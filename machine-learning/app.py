import os
import torch
import torch.nn as nn
import numpy as np
import cv2
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
from torchvision import models, transforms
from werkzeug.utils import secure_filename

# === CONFIGURATION ===
CLASS_NAMES = [
    'Pepper__bell___Bacterial_spot', 'Pepper__bell___healthy', 'Potato___Early_blight',
    'Potato___Late_blight', 'Potato___healthy', 'Tomato_Bacterial_spot',
    'Tomato_Early_blight', 'Tomato_Late_blight', 'Tomato_Leaf_Mold',
    'Tomato_Septoria_leaf_spot', 'Tomato_Spider_mites_Two_spotted_spider_mite',
    'Tomato__Target_Spot', 'Tomato__Tomato_YellowLeaf__Curl_Virus',
    'Tomato__Tomato_mosaic_virus', 'Tomato_healthy'
]

MODEL_PATH = "checkpoints/model_best.pth.tar"
UPLOAD_FOLDER = "static/uploads"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
IMG_SIZE = 224
MIN_CONFIDENCE = 0.70
MIN_GREEN_RATIO = 0.15
MIN_EDGE_RATIO = 0.01

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# === MODEL LOADING ===
def load_model():
    try:
        model = models.mobilenet_v2(weights=None)
        model.classifier[1] = nn.Linear(model.last_channel, len(CLASS_NAMES))
        checkpoint = torch.load(MODEL_PATH, map_location=device)
        state_dict = checkpoint.get('state_dict', checkpoint)
        model.load_state_dict(state_dict)
        model.eval().to(device)
        print("✅ Model loaded successfully")
        return model
    except Exception as e:
        print(f"❌ Model loading failed: {str(e)}")
        exit(1)

model = load_model()

# === IMAGE VALIDATION ===
def validate_image(image_path):
    try:
        if not os.path.exists(image_path):
            return False, "File not found"
        img = cv2.imread(image_path)
        if img is None:
            return False, "Invalid image file"
        if img.shape[0] < 100 or img.shape[1] < 100:
            return False, "Image too small (min 100x100px)"

        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        green_mask = cv2.inRange(hsv, (35, 50, 50), (85, 255, 255))
        green_ratio = np.sum(green_mask > 0) / (img.shape[0] * img.shape[1])

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_ratio = np.sum(edges > 0) / (img.shape[0] * img.shape[1])

        if green_ratio < MIN_GREEN_RATIO:
            return False, "Not enough plant content detected"
        if edge_ratio < MIN_EDGE_RATIO:
            return False, "Image lacks leaf-like texture"

        return True, "Valid plant image"
    except Exception as e:
        return False, f"Validation error: {str(e)}"

# === TRANSFORMS ===
transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# === FLASK SETUP ===
app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Only JPG/PNG/JPEG allowed"}), 400

    try:
        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)

        # Validate image
        is_valid, message = validate_image(save_path)
        if not is_valid:
            return jsonify({"error": message, "image_url": f"/static/uploads/{filename}"}), 400

        # Process image
        img = Image.open(save_path).convert("RGB")
        tensor = transform(img).unsqueeze(0).to(device)

        # Predict
        with torch.no_grad():
            outputs = model(tensor)
            probs = torch.softmax(outputs, dim=1)
            confidence, pred = torch.max(probs, dim=1)
            confidence = float(confidence.item())
            class_name = CLASS_NAMES[pred.item()]

        # Handle low confidence
        if confidence < MIN_CONFIDENCE:
            return jsonify({
                "prediction": class_name.replace("_", " ").title(),
                "confidence": round(confidence * 100, 2),
                "image_url": f"/static/uploads/{filename}",
                "message": "Low confidence. Please try a clearer image."
            }), 200

        return jsonify({
            "prediction": class_name.replace("_", " ").title(),
            "confidence": round(confidence * 100, 2),
            "image_url": f"/static/uploads/{filename}"
        }), 200

    except Exception as e:
        print(f"🚨 Error: {e}")
        return jsonify({"error": "Server error occurred. Please try again later."}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
