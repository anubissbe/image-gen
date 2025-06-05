# Stable Diffusion Docker API & Web UI

A production-ready Dockerized Stable Diffusion image generation service with both REST API and modern web interface.

## 🚀 Features

### Web Interface
- **Modern Dark Theme UI** - Clean, intuitive interface for image generation
- **Real-time Generation** - Visual feedback with loading animations
- **Generation History** - Track your last 10 generated images with thumbnails
- **Parameter Controls** - Easy-to-use sliders and inputs for all parameters
- **Image Management** - Download images and copy generation settings
- **Model Information Display** - Shows loaded model, device (GPU/CPU), and precision

### API Features
- **FastAPI REST API** - High-performance async API endpoints
- **GPU Acceleration** - NVIDIA CUDA support with automatic CPU fallback
- **Optimized Pipeline** - DPM scheduler and memory-efficient attention slicing
- **Docker Container** - Easy deployment with Docker Compose
- **Health Monitoring** - Built-in health check endpoints
- **Streaming Responses** - Efficient image delivery

## 📋 Prerequisites

- Docker & Docker Compose installed
- For GPU acceleration:
  - NVIDIA GPU with CUDA support
  - NVIDIA Container Toolkit installed
  - CUDA drivers installed
- Minimum 8GB RAM (16GB recommended)
- 10GB+ free disk space for models

## 📁 Project Structure

```
/opt/image-gen/
├── Dockerfile              # Multi-stage Docker build configuration
├── docker-compose.yml      # GPU-enabled Docker Compose configuration
├── docker-compose.cpu.yml  # CPU-only Docker Compose configuration
├── requirements.txt        # Python dependencies
├── main.py                # FastAPI application server
├── .env.example           # Environment variable template
├── .dockerignore          # Docker build exclusions
├── static/                # Web UI assets
│   ├── index.html         # Web interface HTML
│   ├── style.css          # Dark theme styling
│   └── script.js          # Frontend JavaScript logic
├── README.md              # This documentation
└── models/                # Model cache directory (created at runtime)
```

## 🏗️ Build Architecture

### Docker Build Process

The project uses a multi-stage Dockerfile that:

1. **Base Image**: Python 3.10-slim for minimal footprint
2. **System Dependencies**: Installs required libraries for ML and graphics
3. **Python Dependencies**: Installs PyTorch, Diffusers, FastAPI, and other packages
4. **Application Code**: Copies the FastAPI server and static files
5. **Runtime Configuration**: Sets up environment and exposes port 8000

#### Key Build Steps:
```dockerfile
# 1. System dependencies for OpenGL and graphics
RUN apt-get update && apt-get install -y \
    git wget libgl1-mesa-glx libglib2.0-0 libsm6 \
    libxext6 libxrender-dev libgomp1 libgfortran5

# 2. NumPy installed separately to avoid compatibility issues
RUN pip install --no-cache-dir numpy==1.24.3

# 3. All other Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 4. Application setup
COPY . .
RUN mkdir -p models
```

### Technology Stack

#### Backend
- **FastAPI**: High-performance async web framework
- **PyTorch**: Deep learning framework
- **Diffusers**: Hugging Face library for Stable Diffusion
- **Transformers**: Model loading and tokenization
- **Accelerate**: Distributed training and inference
- **Uvicorn**: ASGI server for FastAPI

#### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **HTML5**: Semantic markup
- **CSS3**: Modern dark theme with animations
- **Fetch API**: Async communication with backend

### Key Components

#### 1. FastAPI Server (`main.py`)
- **Model Loading**: Loads Stable Diffusion pipeline on startup
- **Endpoints**: 
  - `/` - Serves the web UI
  - `/generate` - Image generation endpoint
  - `/health` - Health check
  - `/model-info` - Model information
- **Static Files**: Serves UI assets from `/static`
- **CORS**: Enabled for API access from different origins

#### 2. Docker Compose
- **GPU Version**: Uses NVIDIA runtime for CUDA acceleration
- **CPU Version**: Standard runtime without GPU requirements
- **Volumes**: Mounts `./models` for model persistence
- **Health Checks**: Monitors service availability

#### 3. Web UI
- **Single Page Application**: All functionality in one page
- **Real-time Updates**: Dynamic UI updates during generation
- **Local Storage**: Generation history persists in browser
- **Responsive Design**: Works on desktop and tablet

## 🛠️ Installation

### 1. Clone or Create Project Directory
```bash
mkdir -p /opt/image-gen
cd /opt/image-gen
```

### 2. Create All Required Files

Create each file with the content from this repository, or clone if available:
- `Dockerfile`
- `docker-compose.yml`
- `docker-compose.cpu.yml`
- `requirements.txt`
- `main.py`
- `.env.example`
- `static/index.html`
- `static/style.css`
- `static/script.js`

### 3. Configure Environment (Optional)
```bash
cp .env.example .env
```

Edit `.env` to change the model:
```bash
MODEL_ID=runwayml/stable-diffusion-v1-5  # Default model
# Other options:
# MODEL_ID=stabilityai/stable-diffusion-2-1
# MODEL_ID=CompVis/stable-diffusion-v1-4
```

## 🚀 Quick Start

### Build Commands

#### Build Only (without starting)
```bash
# GPU version
docker-compose build

# CPU version
docker-compose -f docker-compose.cpu.yml build

# Force rebuild with no cache
docker-compose build --no-cache
```

#### Build and Run

##### With GPU Support (NVIDIA)
```bash
# Build and start in foreground (see logs)
docker-compose up --build

# Build and start in background (detached)
docker-compose up --build -d

# View logs after starting in background
docker-compose logs -f
```

##### With CPU Only
```bash
# Use CPU-specific compose file
docker-compose -f docker-compose.cpu.yml up --build -d
```

### First Run
The first run will download the Stable Diffusion model (~5GB). This may take several minutes depending on your internet connection.

## ⚙️ How It Works

### 1. Container Startup
```mermaid
graph LR
    A[Container Start] --> B[Install Dependencies]
    B --> C[Start FastAPI]
    C --> D[Load Model]
    D --> E[Ready]
```

1. Docker builds the image with all system and Python dependencies
2. Uvicorn starts the FastAPI server on port 8000
3. FastAPI loads the Stable Diffusion model into memory (GPU/CPU)
4. Static file server initialized for web UI
5. Health endpoint becomes available

### 2. Image Generation Flow
```mermaid
graph LR
    A[User Request] --> B[API Validation]
    B --> C[Model Pipeline]
    C --> D[Image Generation]
    D --> E[Response]
```

1. **Request**: User submits prompt via Web UI or API
2. **Validation**: FastAPI validates parameters (dimensions, steps, etc.)
3. **Pipeline**: 
   - Text encoder processes the prompt
   - U-Net performs denoising steps
   - VAE decoder produces final image
4. **Response**: PNG image streamed back to client

### 3. Memory Management
- **GPU Mode**: Uses FP16 precision to reduce VRAM usage
- **Attention Slicing**: Reduces peak memory consumption
- **VAE Slicing**: Processes image in chunks
- **Model Caching**: Keeps model in memory between requests

## 🌐 Accessing the Service

### Web Interface
Open your browser and navigate to:
```
http://localhost:8000
```

### Direct API Access
The API is available at the same address with the following endpoints.

## 📡 API Reference

### Generate Image
**Endpoint:** `POST /generate`

**Request Body:**
```json
{
  "prompt": "A majestic castle on a hilltop at sunset",
  "negative_prompt": "blurry, low quality, distorted",
  "width": 512,
  "height": 512,
  "num_inference_steps": 25,
  "guidance_scale": 7.5,
  "seed": 42
}
```

**Parameters:**
| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| prompt | string | required | - | Text description of desired image |
| negative_prompt | string | null | - | What to avoid in the image |
| width | integer | 512 | 64-1024 | Image width in pixels |
| height | integer | 512 | 64-1024 | Image height in pixels |
| num_inference_steps | integer | 50 | 1-100 | Number of denoising steps |
| guidance_scale | float | 7.5 | 1.0-20.0 | Classifier-free guidance strength |
| seed | integer | null | any | Random seed for reproducibility |

**Example with cURL:**
```bash
curl -X POST "http://localhost:8000/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic city with flying cars",
    "width": 768,
    "height": 512,
    "num_inference_steps": 30
  }' \
  --output generated_image.png
```

### Health Check
**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### Model Information
**Endpoint:** `GET /model-info`

**Response:**
```json
{
  "model_id": "runwayml/stable-diffusion-v1-5",
  "device": "cuda",
  "dtype": "torch.float16"
}
```

## 💻 Client Examples

### Python
```python
import requests
from PIL import Image
import io

# Generate image
response = requests.post(
    "http://localhost:8000/generate",
    json={
        "prompt": "A serene Japanese garden with cherry blossoms",
        "negative_prompt": "people, buildings",
        "width": 768,
        "height": 512,
        "num_inference_steps": 30,
        "guidance_scale": 8.0
    }
)

# Save the image
if response.status_code == 200:
    image = Image.open(io.BytesIO(response.content))
    image.save("japanese_garden.png")
    print("Image saved successfully!")
else:
    print(f"Error: {response.status_code}")
```

### JavaScript/Node.js
```javascript
const fs = require('fs');
const axios = require('axios');

async function generateImage() {
    try {
        const response = await axios.post(
            'http://localhost:8000/generate',
            {
                prompt: 'A magical forest with glowing mushrooms',
                width: 512,
                height: 512,
                num_inference_steps: 25
            },
            { responseType: 'arraybuffer' }
        );
        
        fs.writeFileSync('magical_forest.png', response.data);
        console.log('Image saved successfully!');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

generateImage();
```

## 🎨 Web UI Features

### Main Interface
- **Prompt Input** - Large text area for detailed image descriptions
- **Negative Prompt** - Specify what you don't want in the image
- **Dimension Controls** - Dropdown menus for width and height selection
- **Quality Settings** - Sliders for steps and guidance scale with real-time value display
- **Seed Control** - Optional seed input with random button
- **Generate Button** - Large, prominent button to start generation

### During Generation
- Loading spinner animation
- Status messages (generating, success, error)
- Generation time display

### After Generation
- Full-size image display
- Download button for saving images locally
- Copy settings button to clipboard
- Image automatically added to history

### History Panel
- Thumbnail previews of last 10 generations
- Click to reload any previous generation's settings
- Shows dimensions, steps, and generation time
- Persistent during session

## 🔧 Advanced Configuration

### Using Different Models
1. Edit the `.env` file or set the environment variable:
   ```bash
   MODEL_ID=stabilityai/stable-diffusion-2-1
   ```

2. Restart the container:
   ```bash
   docker-compose restart
   ```

### Supported Models
- `runwayml/stable-diffusion-v1-5` (default)
- `stabilityai/stable-diffusion-2-1`
- `stabilityai/stable-diffusion-2`
- `CompVis/stable-diffusion-v1-4`
- Any Hugging Face model compatible with `diffusers`

### Performance Tuning

For GPU:
- The service automatically uses FP16 precision on GPU
- Attention slicing is enabled for memory efficiency
- VAE slicing is enabled to reduce memory usage

For CPU:
- Uses FP32 precision
- Expect slower generation times (1-5 minutes per image)
- Reduce image dimensions for faster generation

## 📊 Resource Requirements

### Minimum Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 10GB free space
- **GPU** (optional): NVIDIA GPU with 6GB+ VRAM

### Recommended Requirements
- **CPU**: 8+ cores
- **RAM**: 16GB+
- **Storage**: 20GB+ free space
- **GPU**: NVIDIA GPU with 8GB+ VRAM

## 🐳 Docker Operations

### Common Commands

```bash
# Start service
docker-compose up -d

# Stop service
docker-compose stop

# Stop and remove containers
docker-compose down

# Rebuild after code changes
docker-compose up --build -d

# View logs
docker-compose logs -f

# View last 100 lines of logs
docker-compose logs --tail=100

# Enter running container
docker exec -it stable-diffusion-api bash

# Check container status
docker ps

# Remove all stopped containers and unused images
docker system prune -a
```

### Managing Resources

```bash
# Check disk usage
docker system df

# Clean up unused resources
docker system prune

# Remove model cache (frees ~5GB)
sudo rm -rf ./models/*

# Check container resource usage
docker stats stable-diffusion-api
```

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs for errors
docker-compose logs -f

# Ensure Docker daemon is running
sudo systemctl status docker

# Check if port 8000 is already in use
sudo lsof -i :8000
```

### Out of Memory errors
- Reduce image dimensions (try 512x512 or smaller)
- Decrease num_inference_steps
- Use CPU mode if GPU memory is insufficient
- Add swap space on host system

### Model download fails
```bash
# Clear everything and restart
docker-compose down
docker system prune -a
docker-compose up --build
```

### GPU not detected
```bash
# Verify NVIDIA drivers
nvidia-smi

# Check NVIDIA Container Toolkit
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# Ensure docker-compose has GPU support
docker-compose version  # Should be 1.28.0 or higher
```

### Web UI not loading
```bash
# Check if static files are being served
curl http://localhost:8000/static/style.css

# Verify main page loads
curl http://localhost:8000/

# Check CORS if accessing from different host
# May need to update CORS settings in main.py
```

## 🔒 Security Considerations

- The service binds to all interfaces (0.0.0.0:8000)
- For production, use a reverse proxy (nginx, traefik)
- Consider adding authentication for public deployments
- CORS is enabled for all origins (customize for production)

## 📝 License

This project uses Stable Diffusion models which are subject to their respective licenses:
- Models are loaded from Hugging Face
- Check individual model cards for licensing terms

## 🤝 Contributing

Feel free to open issues or submit pull requests for improvements.

## 📚 Additional Resources

- [Stable Diffusion on Hugging Face](https://huggingface.co/runwayml/stable-diffusion-v1-5)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Diffusers Library](https://huggingface.co/docs/diffusers)