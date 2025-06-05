# Image Generation API Guide

## Overview
This API provides endpoints for generating images using Stable Diffusion models. The service can run on both CPU and GPU configurations.

## Base URL
```
http://localhost:5000
```

## Endpoints

### 1. Generate Image
Generate an image based on a text prompt.

**Endpoint:** `POST /generate`

**Request Body:**
```json
{
  "prompt": "string",
  "negative_prompt": "string (optional)",
  "num_inference_steps": 50,
  "guidance_scale": 7.5,
  "width": 512,
  "height": 512,
  "seed": -1
}
```

**Parameters:**
- `prompt` (required): Text description of the image to generate
- `negative_prompt` (optional): What to avoid in the generated image
- `num_inference_steps` (optional): Number of denoising steps (default: 50)
- `guidance_scale` (optional): How closely to follow the prompt (default: 7.5)
- `width` (optional): Image width in pixels (default: 512)
- `height` (optional): Image height in pixels (default: 512)
- `seed` (optional): Random seed for reproducibility (default: -1 for random)

**Response:**
```json
{
  "image": "base64_encoded_image_string"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:5000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape at sunset",
    "negative_prompt": "low quality, blurry",
    "num_inference_steps": 30,
    "guidance_scale": 8.0
  }'
```

### 2. Health Check
Check if the API is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

## Error Responses

All errors follow this format:
```json
{
  "error": "Error description"
}
```

**Common HTTP Status Codes:**
- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters
- `500 Internal Server Error`: Server-side error

## Usage Examples

### Python
```python
import requests
import base64
from PIL import Image
import io

# Generate image
response = requests.post('http://localhost:5000/generate', json={
    'prompt': 'A futuristic city with flying cars',
    'num_inference_steps': 25
})

# Decode and save image
if response.status_code == 200:
    image_data = base64.b64decode(response.json()['image'])
    image = Image.open(io.BytesIO(image_data))
    image.save('generated_image.png')
```

### JavaScript
```javascript
async function generateImage(prompt) {
    const response = await fetch('http://localhost:5000/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: prompt,
            num_inference_steps: 30
        })
    });

    const data = await response.json();
    
    // Display image
    const img = document.createElement('img');
    img.src = `data:image/png;base64,${data.image}`;
    document.body.appendChild(img);
}
```

## Rate Limiting
Currently, there are no rate limits implemented. For production use, consider implementing rate limiting based on your requirements.

## Notes
- Image generation can take 30 seconds to several minutes depending on hardware and parameters
- GPU mode is significantly faster than CPU mode
- Higher `num_inference_steps` values produce better quality but take longer
- Image dimensions should be multiples of 8 for best results