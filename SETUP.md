# Setup Guide

## macOS

### 1. Install Dependencies

```bash
brew install fluidsynth ffmpeg python@3.11
```

### 2. Clone & Setup

```bash
git clone https://github.com/amirhoseintahmasb/spectacles-promptDJ.git
cd spectacles-promptDJ
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Download SoundFont

Download a General MIDI SoundFont (~200MB):

```bash
mkdir -p sf2
curl -L "https://ftp.osuosl.org/pub/musescore/soundfont/MuseScore_General/MuseScore_General.sf2" -o sf2/MuseScore_General.sf2
```

### 4. Configure IP

Edit `app.py` line ~43:
```python
HOST_URL = "http://YOUR_LAN_IP:8123"
```

Find your IP: `ipconfig getifaddr en0`

### 5. Run

```bash
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8123
```

## Lens Studio

1. Open Lens Studio 5.x
2. Create Spectacles project
3. Import `spectacles-lens/Scripts/*.js`
4. Add InternetModule, RemoteMediaModule, AudioComponent
5. Configure script inputs with your server IP
6. Enable Experimental APIs in Project Settings

