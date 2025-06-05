from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
import torch
from PIL import Image
import io
import os
from typing import Optional
import logging
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Stable Diffusion API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., description="Text prompt for image generation")
    negative_prompt: Optional[str] = Field(None, description="Negative prompt to avoid certain features")
    width: int = Field(512, ge=64, le=1024, description="Image width")
    height: int = Field(512, ge=64, le=1024, description="Image height")
    num_inference_steps: int = Field(50, ge=1, le=100, description="Number of denoising steps")
    guidance_scale: float = Field(7.5, ge=1.0, le=20.0, description="Guidance scale for classifier-free guidance")
    seed: Optional[int] = Field(None, description="Random seed for reproducibility")

class ModelInfo(BaseModel):
    model_id: str
    device: str
    dtype: str

pipeline = None
model_info = None

def load_model():
    global pipeline, model_info
    
    model_id = os.getenv("MODEL_ID", "runwayml/stable-diffusion-v1-5")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32
    
    logger.info(f"Loading model {model_id} on {device} with dtype {dtype}")
    
    try:
        pipeline = StableDiffusionPipeline.from_pretrained(
            model_id,
            torch_dtype=dtype,
            use_safetensors=True,
            safety_checker=None,
            requires_safety_checker=False,
            variant="fp16" if dtype == torch.float16 else None
        )
        
        # Configure scheduler for faster inference
        pipeline.scheduler = DPMSolverMultistepScheduler.from_config(pipeline.scheduler.config)
        pipeline = pipeline.to(device)
        
        if device == "cuda":
            pipeline.enable_attention_slicing()
            pipeline.enable_vae_slicing()
        
        model_info = ModelInfo(model_id=model_id, device=device, dtype=str(dtype))
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise

@app.on_event("startup")
async def startup_event():
    load_model()

@app.get("/")
async def root():
    return FileResponse("static/index.html")

@app.get("/health")
async def health_check():
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"status": "healthy", "model_loaded": True}

@app.post("/generate")
async def generate_image(request: ImageGenerationRequest):
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        generator = None
        if request.seed is not None:
            generator = torch.Generator(device=pipeline.device).manual_seed(request.seed)
        
        image = pipeline(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            width=request.width,
            height=request.height,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
            generator=generator
        ).images[0]
        
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        return StreamingResponse(
            img_byte_arr,
            media_type="image/png",
            headers={"Content-Disposition": "inline; filename=generated.png"}
        )
    
    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-info")
async def get_model_info():
    if model_info is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return model_info