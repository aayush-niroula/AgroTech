# Plant Disease Detector 🔍🌱

A lightweight Flask app for detecting plant diseases from leaf images. Works on Linux, Windows, and Mac.


# [--- download the model here ---](https://mega.nz/file/WQRS2RbA#XLbOvtIKM3padgqjySAh-doj8mqdPJOMT3i1LmAklZ8)  

Place the downloaded `.pt` file in the project root folder after cloning.

## System Requirements 💻
- **Minimum**:
  - 4GB RAM
  - 2GB free disk space
  - Python 3.9+

- **Recommended**:
  - NVIDIA GPU with CUDA 11.8
  - 8GB+ RAM

## Installation 🛠️

### Linux (Debian/Ubuntu)
```bash
# 1. Install dependencies
sudo apt update && sudo apt install -y python3-pip python3-venv libjpeg-dev

# 2. Clone repo
git clone https://github.com/eyeblech/plant-disease-detection-model.git
cd plant-disease-detection-model

# 3. Set up environment
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Windows 10/11
```powershell
# 1. Install Python 3.9+ from Microsoft Store
# 2. In PowerShell:
git clone https://github.com/eyeblech/plant-disease-detection-model.git
cd plant-disease-detection-model

python -m venv venv
.\venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

### MacOS
```bash
brew install python
git clone https://github.com/eyeblech/plant-disease-detection-model.git
cd plant-disease-detection-model

python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## How to Run 🚀
```bash
python app.py
```
Open `http://localhost:5000` in your browser.

## File Structure 📁
```
.
├── app.py                 # Main application
├── plant_disease_model.pt  # Required (download from Mega)
├── class_names.txt        # Disease labels
├── requirements.txt       # Python dependencies
├── static/
│   └── uploads/           # User-uploaded images
└── templates/
    ├── index.html         # Main page
    └── result.html       # Results page
```

![demo](https://github.com/user-attachments/assets/7af8b3d9-f5d2-4899-8e97-58b762b22681)


## License
MIT License - See [LICENSE](LICENSE) file
