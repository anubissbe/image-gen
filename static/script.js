// State management
let generationHistory = [];
let currentImageUrl = null;

// DOM elements
const form = document.getElementById('generationForm');
const generateBtn = document.getElementById('generateBtn');
const statusDiv = document.getElementById('status');
const imageContainer = document.getElementById('imageContainer');
const imageControls = document.getElementById('imageControls');
const historyList = document.getElementById('historyList');
const modelInfo = document.getElementById('modelInfo');

// Range input displays
const stepsSlider = document.getElementById('num_inference_steps');
const stepsValue = document.getElementById('steps_value');
const guidanceSlider = document.getElementById('guidance_scale');
const guidanceValue = document.getElementById('guidance_value');

// Update range displays
stepsSlider.addEventListener('input', (e) => {
    stepsValue.textContent = e.target.value;
});

guidanceSlider.addEventListener('input', (e) => {
    guidanceValue.textContent = e.target.value;
});

// Random seed button
document.getElementById('randomSeed').addEventListener('click', () => {
    document.getElementById('seed').value = Math.floor(Math.random() * 2147483647);
});

// Load model info on page load
async function loadModelInfo() {
    try {
        const response = await fetch('/model-info');
        const data = await response.json();
        
        modelInfo.innerHTML = `
            <h3>Model Information</h3>
            <p><strong>Model:</strong> ${data.model_id}</p>
            <p><strong>Device:</strong> ${data.device.toUpperCase()}</p>
            <p><strong>Precision:</strong> ${data.dtype}</p>
        `;
    } catch (error) {
        modelInfo.innerHTML = '<h3>Model Information</h3><p>Unable to load model info</p>';
    }
}

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const params = {
        prompt: formData.get('prompt'),
        negative_prompt: formData.get('negative_prompt') || null,
        width: parseInt(formData.get('width')),
        height: parseInt(formData.get('height')),
        num_inference_steps: parseInt(formData.get('num_inference_steps')),
        guidance_scale: parseFloat(formData.get('guidance_scale'))
    };
    
    const seed = formData.get('seed');
    if (seed) {
        params.seed = parseInt(seed);
    }
    
    await generateImage(params);
});

async function generateImage(params) {
    // Update UI state
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    statusDiv.className = 'status loading';
    statusDiv.textContent = 'Generating image...';
    
    // Show loading spinner
    imageContainer.innerHTML = '<div class="loading-spinner"></div>';
    imageControls.style.display = 'none';
    
    try {
        const startTime = Date.now();
        
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        // Display the image
        displayImage(imageUrl);
        
        // Update status
        statusDiv.className = 'status success';
        statusDiv.textContent = `Image generated successfully in ${generationTime}s`;
        
        // Add to history
        addToHistory({
            ...params,
            imageUrl: imageUrl,
            timestamp: new Date().toISOString(),
            generationTime: generationTime
        });
        
        // Store current image URL for download
        currentImageUrl = imageUrl;
        
    } catch (error) {
        statusDiv.className = 'status error';
        statusDiv.textContent = `Error: ${error.message}`;
        imageContainer.innerHTML = '<div class="placeholder"><p>Generation failed</p></div>';
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Image';
        
        // Hide status after 5 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

function displayImage(imageUrl) {
    imageContainer.innerHTML = `<img src="${imageUrl}" alt="Generated image">`;
    imageControls.style.display = 'flex';
}

function addToHistory(item) {
    generationHistory.unshift(item);
    
    // Keep only last 10 items
    if (generationHistory.length > 10) {
        generationHistory = generationHistory.slice(0, 10);
    }
    
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    historyList.innerHTML = generationHistory.map((item, index) => `
        <div class="history-item" onclick="loadFromHistory(${index})">
            <img src="${item.imageUrl}" alt="Thumbnail">
            <div class="history-item-text">
                <div class="history-item-prompt">${item.prompt}</div>
                <div class="history-item-details">
                    ${item.width}x${item.height} • ${item.num_inference_steps} steps • ${item.generationTime}s
                </div>
            </div>
        </div>
    `).join('');
}

function loadFromHistory(index) {
    const item = generationHistory[index];
    
    // Load parameters into form
    document.getElementById('prompt').value = item.prompt;
    document.getElementById('negative_prompt').value = item.negative_prompt || '';
    document.getElementById('width').value = item.width;
    document.getElementById('height').value = item.height;
    document.getElementById('num_inference_steps').value = item.num_inference_steps;
    document.getElementById('guidance_scale').value = item.guidance_scale;
    
    if (item.seed) {
        document.getElementById('seed').value = item.seed;
    }
    
    // Update range displays
    stepsValue.textContent = item.num_inference_steps;
    guidanceValue.textContent = item.guidance_scale;
    
    // Display the image
    displayImage(item.imageUrl);
    currentImageUrl = item.imageUrl;
}

// Download button
document.getElementById('downloadBtn').addEventListener('click', () => {
    if (currentImageUrl) {
        const a = document.createElement('a');
        a.href = currentImageUrl;
        a.download = `stable-diffusion-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});

// Copy settings button
document.getElementById('copyPromptBtn').addEventListener('click', () => {
    const formData = new FormData(form);
    const settings = {
        prompt: formData.get('prompt'),
        negative_prompt: formData.get('negative_prompt'),
        width: formData.get('width'),
        height: formData.get('height'),
        steps: formData.get('num_inference_steps'),
        guidance_scale: formData.get('guidance_scale'),
        seed: formData.get('seed') || 'random'
    };
    
    const settingsText = Object.entries(settings)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    
    navigator.clipboard.writeText(settingsText).then(() => {
        const btn = document.getElementById('copyPromptBtn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
});

// Make history items accessible globally
window.loadFromHistory = loadFromHistory;

// Initialize
loadModelInfo();