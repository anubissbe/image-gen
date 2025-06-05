#!/usr/bin/env python3
import requests
import sys
import json
from PIL import Image
import io

API_URL = "http://localhost:8000"

def test_health():
    print("Testing health endpoint...")
    response = requests.get(f"{API_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_model_info():
    print("\nTesting model info endpoint...")
    response = requests.get(f"{API_URL}/model-info")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_generate():
    print("\nTesting image generation...")
    payload = {
        "prompt": "A cute robot playing with a ball in a park",
        "negative_prompt": "blurry, bad quality",
        "width": 512,
        "height": 512,
        "num_inference_steps": 20,
        "guidance_scale": 7.5,
        "seed": 42
    }
    
    print(f"Request payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(f"{API_URL}/generate", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        image = Image.open(io.BytesIO(response.content))
        image.save("test_output.png")
        print("Image saved as test_output.png")
        return True
    else:
        print(f"Error: {response.text}")
        return False

if __name__ == "__main__":
    print("Starting API tests...")
    
    try:
        # Check if API is running
        requests.get(API_URL)
    except requests.exceptions.ConnectionError:
        print("Error: API is not running at http://localhost:8000")
        print("Please start the API first with: docker-compose up")
        sys.exit(1)
    
    tests = [test_health, test_model_info, test_generate]
    results = [test() for test in tests]
    
    print(f"\nTest Results: {sum(results)}/{len(results)} passed")
    sys.exit(0 if all(results) else 1)