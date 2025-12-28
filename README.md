# 🎵 PromptDJ

**AI-Powered Music Generation Service for Snap Spectacles**

PromptDJ is a real-time music generation backend that creates melodies and drum patterns using algorithmic composition, renders them to audio using FluidSynth, and streams to Snap Spectacles via WebSocket.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-green.svg)
![Spectacles](https://img.shields.io/badge/Snap-Spectacles%202024-yellow.svg)

## Features

- 🎹 **Melody Generation** - Algorithmic composition in multiple scales
- 🥁 **Drum Patterns** - Techno, Funk, Jazz, Electronic, Basic styles
- 🔊 **Audio Rendering** - MIDI → WAV via FluidSynth (no Ableton required)
- 🕶️ **Spectacles Integration** - WebSocket API for Lens Studio
- 🎛️ **Web UI** - DJ-style control interface
- ⚡ **Real-time** - Generate and play music in seconds

## Quick Start

### Prerequisites

- Python 3.10+
- FluidSynth (`brew install fluidsynth`)
- FFmpeg (`brew install ffmpeg`)

### Installation

```bash
git clone https://github.com/amirhoseintahmasb/spectacles-promptDJ.git
cd spectacles-promptDJ
./setup.sh
```

### Run

```bash
./start.sh
```

Open: http://localhost:8123

## Architecture

```
Spectacles ──WebSocket──▶ FastAPI ──▶ MIDI Gen ──▶ FluidSynth ──▶ WAV
                              │
                              ▼
                         /out/*.wav ◀── HTTP ◀── Lens Studio
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web UI |
| `/generate` | POST | Generate melody |
| `/drums` | POST | Generate drums |
| `/ws/spectacles/{id}` | WS | Spectacles WebSocket |

### WebSocket Example

```json
// Send
{ "action": "generate_melody", "params": { "tempo_bpm": 120, "scale": "C_major" } }

// Receive
{ "type": "audio_ready", "url": "http://IP:8123/out/track_xxx.wav" }
```

## Project Structure

```
promptdj/
├── app.py              # FastAPI backend
├── requirements.txt    # Dependencies
├── setup.sh           # Setup script
├── start.sh           # Start script
├── sf2/               # SoundFonts
├── out/               # Generated audio
├── static/            # Web UI
└── spectacles-lens/   # Lens Studio scripts
```

## Configuration

Set your Mac's IP in `app.py`:
```python
HOST_URL = "http://YOUR_IP:8123"
```

## Lens Studio Setup

1. Import scripts from `spectacles-lens/Scripts/`
2. Add `InternetModule` + `RemoteMediaModule`
3. Connect `AudioComponent`
4. Enable Experimental APIs (for `ws://`)

## Tech Stack

- **Backend**: FastAPI, Python
- **Audio**: FluidSynth, MuseScore SoundFont
- **MIDI**: mido
- **Frontend**: Vanilla JS, CSS
- **AR**: Snap Lens Studio, Spectacles SDK

## License

MIT License - see [LICENSE](LICENSE)

## Author

**Amirhosein Tahmasbzadeh**

---

*Built for Snap Spectacles 2024* 🕶️
