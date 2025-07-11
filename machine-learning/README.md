
# 🌿 Plant Disease Detector (Flask + PyTorch)

A simple and fast web app that detects plant leaf diseases using deep learning. Upload a leaf image and get instant predictions along with confidence.

Supports GPU (CUDA) acceleration if available.

---

## 🔧 Features

- ✅ Fast MobileNetV2-based model
- ✅ Upload leaf image & detect disease
- ✅ Shows prediction confidence
- ✅ Rejects non-plant images (green-pixel HSV check)
- ✅ Clean and minimal responsive UI

---

## ⚙️ Requirements

- Python 3.9+
- PyTorch (torch, torchvision)
- Flask
- Pillow
- OpenCV

(See requirements.txt for exact versions)

---

## 🚀 Installation

Clone the repo and install dependencies:

```bash
git clone https://github.com/aayush-niroula/AgroTech.git
cd AgroTech

python3 -m venv venv
source venv/bin/activate        # On Windows: .\venv\Scripts\activate

pip install -r requirements.txt
````

Optional: For GPU acceleration, install PyTorch with CUDA 12.1 support.

---

## 📂 Model Checkpoint

Place your trained model checkpoint here:

```
checkpoints/model_best.pth.tar
```

It should be a MobileNetV2 model trained on 15 plant disease classes.

---

## 🧪 Run the App

Start the web app locally:

```bash
python app.py
```

Then open your browser and visit:

```
http://localhost:5000
```

---

## 📁 Folder Structure

```
.
├── app.py                   # Main Flask app
├── checkpoints/             # Folder for saved model
│   └── model_best.pth.tar
├── requirements.txt         # Python dependencies
├── static/
│   └── uploads/             # Uploaded leaf images
└── templates/
    ├── index.html           # Upload UI
    └── result.html          # Result display page
```

---

## 📸 Example Use

Upload a clear image of a leaf, like:

* Potato Early Blight
* Tomato Yellow Leaf Curl Virus
* Pepper Bacterial Spot

You’ll see:

* Predicted disease name
* Confidence percentage
* Image preview

---

## 📄 License

MIT License

Feel free to use, fork, deploy, and improve this project for research, education, or real-world deployment.

---

## 🌍 Want More?

* Add Gemini AI integration for suggestions
* Deploy on Render / Hugging Face Spaces
* Add mobile PWA support
* Add batch testing UI

Let me know and I’ll help you expand it!
