import os
import cv2
import numpy as np
from flask import Flask, request, render_template
from werkzeug.utils import secure_filename
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Device setup
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Model definition that exactly matches your training
class PlantDiseaseModel(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        # Load base ResNet18 without pretrained weights
        self.base = models.resnet18(weights=None)
        
        # Replace final layer with your custom head
        num_features = self.base.fc.in_features
        self.base.fc = nn.Sequential(
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes)
        )
    
    def forward(self, x):
        return self.base(x)

# Initialize model
try:
    print("Loading model...")
    model = PlantDiseaseModel(num_classes=15)  # Update 15 to your actual class count
    
    # Load state dict with flexible key matching
    state_dict = torch.load('plant_disease_model.pt', map_location=device)
    
    # Debug: Print expected and actual keys
    print("\nExpected model keys:")
    for k in model.state_dict().keys():
        print(f"- {k}")
    
    print("\nSaved model keys:")
    for k in state_dict.keys():
        print(f"- {k}")
    
    # Handle key mismatches
    new_state_dict = {}
    for key, value in state_dict.items():
        # Remove unexpected prefixes
        new_key = key.replace("model.", "").replace("base_model.", "base.")
        new_state_dict[new_key] = value
    
    model.load_state_dict(new_state_dict, strict=False)
    model = model.to(device)
    model.eval()
    print("Model loaded successfully!")
    
except Exception as e:
    print(f"\n❌ Failed to load model: {e}")
    print("\nPossible solutions:")
    print("1. Verify your model architecture matches the training code exactly")
    print("2. Check if you saved the complete model (not just state_dict)")
    print("3. Compare the printed keys above and adjust the key mapping")
    exit(1)

# Load class names
try:
    with open('class_names.txt') as f:
        classes = [line.strip() for line in f.readlines()]
    print(f"\nLoaded {len(classes)} classes")
except FileNotFoundError:
    print("\n❌ class_names.txt not found")
    exit(1)

# Image transformations
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def is_plant_image(image):
    """Check if image contains plant-like colors"""
    try:
        img_np = np.array(image)
        if len(img_np.shape) != 3:
            return False
            
        # Convert to HSV color space
        hsv = cv2.cvtColor(img_np, cv2.COLOR_RGB2HSV)
        
        # Define green color range in HSV
        lower_green = np.array([35, 50, 50])
        upper_green = np.array([85, 255, 255])
        
        # Calculate green pixel percentage
        mask = cv2.inRange(hsv, lower_green, upper_green)
        green_ratio = np.sum(mask > 0) / (img_np.shape[0] * img_np.shape[1])
        
        return green_ratio > 0.1  # At least 10% green pixels
    except Exception as e:
        print(f"Plant detection error: {e}")
        return False

@app.route('/', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        if 'file' not in request.files:
            return render_template('index.html', error="No file selected")
            
        file = request.files['file']
        if file.filename == '':
            return render_template('index.html', error="No file selected")
        
        if file and allowed_file(file.filename):
            try:
                # Save uploaded file
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                
                # Open and check image
                img = Image.open(filepath).convert('RGB')
                
                if not is_plant_image(img):
                    return render_template('result.html',
                                        prediction="NOT A PLANT",
                                        confidence=0,
                                        message="The image doesn't contain enough plant-like features",
                                        image_path=filepath)
                
                # Make prediction
                tensor = transform(img).unsqueeze(0).to(device)
                with torch.no_grad():
                    outputs = model(tensor)
                    probs = torch.nn.functional.softmax(outputs, dim=1)
                    conf, pred = torch.max(probs, 1)
                    conf_percent = round(conf.item() * 100, 2)
                
                return render_template('result.html',
                                    prediction=classes[pred.item()],
                                    confidence=conf_percent,
                                    image_path=filepath)
            
            except Exception as e:
                return render_template('index.html', 
                                    error=f"Processing error: {str(e)}")
    
    return render_template('index.html')

if __name__ == '__main__':
    print("\nStarting Flask server...")
    app.run(host='0.0.0.0', port=5000, debug=True)