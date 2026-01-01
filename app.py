"""
Music AI Service - Local Backend for MIDI Generation
=====================================================
A FastAPI-based service that generates and manipulates MIDI files.
Track A: Algorithmic/probabilistic generation (stable, fast)
Track B: Magenta ML models (future upgrade)
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import tempfile
import os
import random
import json
import base64
import asyncio
import subprocess
import uuid
from typing import Optional, List, Dict, Any
from pathlib import Path
from datetime import datetime

import mido
from mido import MidiFile, MidiTrack, Message, MetaMessage

app = FastAPI(
    title="PromptDJ - AI Music Generator",
    description="Local backend AI service for MIDI generation - Spectacles Ready",
    version="1.0.0"
)

# Get the directory where app.py is located
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
OUT_DIR = BASE_DIR / "out"
SF2_DIR = BASE_DIR / "sf2"

# Create output directory for rendered audio
OUT_DIR.mkdir(exist_ok=True)

# SoundFont path for FluidSynth
SF2_PATH = SF2_DIR / "MuseScore_General.sf2"

# Server URL - use 127.0.0.1 for Lens Studio Preview, network IP for real Spectacles
# Set HOST_IP environment variable to override (e.g., export HOST_IP=172.20.10.3)
import os
HOST_IP = os.getenv("HOST_IP", "127.0.0.1")  # Default to localhost for local testing
HOST_URL = f"http://{HOST_IP}:8123"

# Mount static files
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Mount output directory for audio files
app.mount("/out", StaticFiles(directory=str(OUT_DIR)), name="out")

# Enable CORS for web UI access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# REQUEST MODELS
# ============================================================================

class GenerateRequest(BaseModel):
    tempo_bpm: int = 120
    bars: int = 8
    seed: Optional[int] = None
    scale: str = "C_major"      # C_major, A_minor, D_minor, G_major, etc.
    density: float = 0.55       # 0..1 how many notes
    variation: float = 0.35     # 0..1 how wild/experimental
    octave_range: int = 2       # How many octaves to span


class DrumifyRequest(BaseModel):
    tempo_bpm: int = 120
    bars: int = 4
    seed: Optional[int] = None
    style: str = "basic"        # basic, funk, jazz, electronic
    swing: float = 0.0          # 0..1 swing amount


class StyleRequest(BaseModel):
    humanize: float = 0.3       # 0..1 timing variation
    velocity_variation: float = 0.2  # 0..1 velocity variation
    swing: float = 0.0          # 0..1 swing amount


# ============================================================================
# SCALE & MUSIC THEORY UTILITIES
# ============================================================================

SCALES = {
    "C_major": {"root": 0, "intervals": [0, 2, 4, 5, 7, 9, 11]},
    "C_minor": {"root": 0, "intervals": [0, 2, 3, 5, 7, 8, 10]},
    "D_major": {"root": 2, "intervals": [0, 2, 4, 5, 7, 9, 11]},
    "D_minor": {"root": 2, "intervals": [0, 2, 3, 5, 7, 9, 10]},
    "E_minor": {"root": 4, "intervals": [0, 2, 3, 5, 7, 8, 10]},
    "F_major": {"root": 5, "intervals": [0, 2, 4, 5, 7, 9, 11]},
    "G_major": {"root": 7, "intervals": [0, 2, 4, 5, 7, 9, 11]},
    "A_minor": {"root": 9, "intervals": [0, 2, 3, 5, 7, 8, 10]},
    "A_major": {"root": 9, "intervals": [0, 2, 4, 5, 7, 9, 11]},
    "B_minor": {"root": 11, "intervals": [0, 2, 3, 5, 7, 8, 10]},
}

# GM Drum Map (Channel 10)
DRUM_MAP = {
    "kick": 36,
    "snare": 38,
    "hihat_closed": 42,
    "hihat_open": 46,
    "tom_low": 45,
    "tom_mid": 47,
    "tom_high": 50,
    "crash": 49,
    "ride": 51,
    "clap": 39,
}

DRUM_PATTERNS = {
    "basic": {
        "kick":         [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        "snare":        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        "hihat_closed": [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    },
    "funk": {
        "kick":         [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        "snare":        [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
        "hihat_closed": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        "hihat_open":   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    },
    "jazz": {
        "ride":         [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0],
        "kick":         [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        "snare":        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        "hihat_closed": [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    },
    "electronic": {
        "kick":         [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        "snare":        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        "hihat_closed": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        "clap":         [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    },
    "techno": {
        "kick":         [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        "clap":         [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        "hihat_closed": [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        "hihat_open":   [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        "tom_low":      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    },
    "dnb": {  # Drum and Bass
        "kick":         [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        "snare":        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        "hihat_closed": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    },
    "hiphop": {
        "kick":         [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        "snare":        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        "hihat_closed": [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        "hihat_open":   [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    },
    "house": {
        "kick":         [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        "clap":         [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        "hihat_closed": [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        "hihat_open":   [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    },
    "trap": {
        "kick":         [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0],
        "snare":        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        "hihat_closed": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        "hihat_open":   [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],
    },
    "reggae": {
        "kick":         [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        "snare":        [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        "hihat_closed": [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    },
    "latin": {  # Bossa Nova style
        "kick":         [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        "snare":        [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        "hihat_closed": [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        "tom_high":     [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
    },
    "dubstep": {
        "kick":         [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        "snare":        [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        "hihat_closed": [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        "tom_low":      [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
    },
}


def get_scale_notes(scale_name: str, base_octave: int = 4, octave_range: int = 2) -> list:
    """Get all MIDI note numbers for a scale across octave range."""
    scale = SCALES.get(scale_name, SCALES["C_major"])
    root = scale["root"]
    intervals = scale["intervals"]
    
    notes = []
    for octave in range(base_octave - octave_range // 2, base_octave + octave_range // 2 + 1):
        for interval in intervals:
            note = (octave * 12) + root + interval
            if 0 <= note <= 127:
                notes.append(note)
    return notes


# ============================================================================
# MIDI GENERATION FUNCTIONS
# ============================================================================

def generate_melody_midi(req: GenerateRequest) -> str:
    """Generate a melodic MIDI file using probabilistic methods."""
    if req.seed is not None:
        random.seed(req.seed)

    mid = MidiFile(ticks_per_beat=480)
    track = MidiTrack()
    mid.tracks.append(track)

    # Set tempo and time signature
    tempo = mido.bpm2tempo(req.tempo_bpm)
    track.append(MetaMessage("set_tempo", tempo=tempo, time=0))
    track.append(MetaMessage("time_signature", numerator=4, denominator=4, time=0))
    track.append(MetaMessage("track_name", name="AI Melody", time=0))

    # Get scale notes
    scale_notes = get_scale_notes(req.scale, octave_range=req.octave_range)
    
    # Note durations in ticks (480 = quarter note)
    durations = [120, 240, 480, 720, 960]  # 16th, 8th, quarter, dotted quarter, half
    
    # Markov-ish movement (scale degree steps)
    steps = [-3, -2, -1, 0, 1, 2, 3]
    step_weights = [0.05, 0.15, 0.25, 0.1, 0.25, 0.15, 0.05]  # Prefer stepwise motion

    total_ticks = req.bars * 4 * 480  # bars * beats * ticks_per_beat
    current_tick = 0
    current_idx = len(scale_notes) // 2  # Start in middle of range

    while current_tick < total_ticks:
        # Probabilistic note placement based on density
        if random.random() > req.density:
            current_tick += 120  # Skip a 16th note
            continue

        # Choose duration
        dur = random.choice(durations)
        if current_tick + dur > total_ticks:
            dur = total_ticks - current_tick

        # Move through scale
        step = random.choices(steps, weights=step_weights)[0]
        if random.random() < req.variation:
            step *= random.choice([1, 2])  # Bigger jumps occasionally
        
        current_idx = max(0, min(len(scale_notes) - 1, current_idx + step))
        pitch = scale_notes[current_idx]

        # Velocity with some variation
        vel = random.randint(60, 100)
        if random.random() < 0.1:  # Occasional accent
            vel = min(127, vel + 20)

        # Note on
        track.append(Message("note_on", note=pitch, velocity=vel, time=0))
        # Note off
        track.append(Message("note_off", note=pitch, velocity=0, time=dur))

        current_tick += dur

    # End of track
    track.append(MetaMessage("end_of_track", time=0))

    # Save to temp file
    fd, path = tempfile.mkstemp(suffix=".mid", prefix="melody_")
    os.close(fd)
    mid.save(path)
    return path


def generate_drums_midi(req: DrumifyRequest) -> str:
    """Generate a drum pattern MIDI file."""
    if req.seed is not None:
        random.seed(req.seed)

    mid = MidiFile(ticks_per_beat=480)
    track = MidiTrack()
    mid.tracks.append(track)

    tempo = mido.bpm2tempo(req.tempo_bpm)
    track.append(MetaMessage("set_tempo", tempo=tempo, time=0))
    track.append(MetaMessage("time_signature", numerator=4, denominator=4, time=0))
    track.append(MetaMessage("track_name", name="AI Drums", time=0))

    pattern = DRUM_PATTERNS.get(req.style, DRUM_PATTERNS["basic"])
    ticks_per_16th = 480 // 4  # 120 ticks

    # Apply swing (delays every other 16th note)
    def get_swing_offset(step: int) -> int:
        if req.swing > 0 and step % 2 == 1:
            return int(ticks_per_16th * req.swing * 0.5)
        return 0

    # Collect all drum hits with their times
    events = []
    for bar in range(req.bars):
        for step in range(16):
            tick = (bar * 16 + step) * ticks_per_16th + get_swing_offset(step)
            
            for drum_name, hits in pattern.items():
                if hits[step % len(hits)]:
                    # Add some probability for variation
                    if random.random() < 0.95:  # 95% chance to play
                        note = DRUM_MAP.get(drum_name, 36)
                        vel = random.randint(80, 110)
                        # Ghost notes occasionally
                        if random.random() < 0.1:
                            vel = random.randint(40, 60)
                        events.append((tick, note, vel))

    # Sort by time and write to track
    events.sort(key=lambda x: x[0])
    
    # Build list of all MIDI messages with absolute times
    midi_events = []
    for tick, note, vel in events:
        midi_events.append((tick, "on", note, vel))
        midi_events.append((tick + 60, "off", note, 0))  # Short drum hit
    
    # Sort all events by absolute time
    midi_events.sort(key=lambda x: x[0])
    
    # Convert to delta times
    last_tick = 0
    for abs_tick, event_type, note, vel in midi_events:
        delta = max(0, abs_tick - last_tick)  # Ensure non-negative delta
        if event_type == "on":
            track.append(Message("note_on", note=note, velocity=vel, time=delta, channel=9))
        else:
            track.append(Message("note_off", note=note, velocity=0, time=delta, channel=9))
        last_tick = abs_tick

    track.append(MetaMessage("end_of_track", time=0))

    fd, path = tempfile.mkstemp(suffix=".mid", prefix="drums_")
    os.close(fd)
    mid.save(path)
    return path


def continue_midi_file(input_path: str) -> str:
    """Continue/extend a MIDI file by analyzing and extending patterns."""
    mid = MidiFile(input_path)
    out = MidiFile(ticks_per_beat=mid.ticks_per_beat)

    for orig_track in mid.tracks:
        new_track = MidiTrack()
        out.tracks.append(new_track)
        
        # Copy original track
        new_track.extend(orig_track)
        
        # Analyze the last portion and create variation
        note_events = [msg for msg in orig_track if msg.type in ("note_on", "note_off")]
        
        if len(note_events) > 20:
            # Take last ~25% of notes and create variation
            tail_start = int(len(note_events) * 0.75)
            tail = note_events[tail_start:]
            
            for msg in tail:
                if msg.type == "note_on" and msg.velocity > 0:
                    # Slight pitch and velocity variation
                    new_pitch = msg.note + random.choice([-2, -1, 0, 0, 1, 2])
                    new_pitch = max(0, min(127, new_pitch))
                    new_vel = max(1, min(127, msg.velocity + random.randint(-10, 10)))
                    new_track.append(msg.copy(note=new_pitch, velocity=new_vel))
                else:
                    new_track.append(msg.copy())

    fd, path = tempfile.mkstemp(suffix=".mid", prefix="continued_")
    os.close(fd)
    out.save(path)
    return path


def humanize_midi_file(input_path: str, req: StyleRequest) -> str:
    """Apply humanization (timing/velocity variation) to a MIDI file."""
    mid = MidiFile(input_path)
    out = MidiFile(ticks_per_beat=mid.ticks_per_beat)

    for orig_track in mid.tracks:
        new_track = MidiTrack()
        out.tracks.append(new_track)
        
        for msg in orig_track:
            if msg.type == "note_on" and msg.velocity > 0:
                # Timing variation
                time_offset = int(random.gauss(0, req.humanize * 20))
                new_time = max(0, msg.time + time_offset)
                
                # Velocity variation
                vel_offset = int(random.gauss(0, req.velocity_variation * 15))
                new_vel = max(1, min(127, msg.velocity + vel_offset))
                
                new_track.append(msg.copy(time=new_time, velocity=new_vel))
            else:
                new_track.append(msg.copy())

    fd, path = tempfile.mkstemp(suffix=".mid", prefix="humanized_")
    os.close(fd)
    out.save(path)
    return path


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/", response_class=HTMLResponse)
def root():
    """Serve the PromptDJ UI."""
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return index_path.read_text()
    return """
    <html>
        <head><title>PromptDJ</title></head>
        <body style="background:#0a0a0f;color:white;font-family:sans-serif;text-align:center;padding:50px;">
            <h1>PromptDJ - AI Music Generator</h1>
            <p>Static files not found. Please ensure /static/index.html exists.</p>
            <p><a href="/docs" style="color:#00f5ff;">API Documentation</a></p>
        </body>
    </html>
    """


@app.get("/api")
def api_info():
    """Health check and API info."""
    return {
        "service": "PromptDJ - AI Music Generator",
        "version": "1.0.0",
        "status": "running",
        "spectacles_ready": True,
        "endpoints": [
            "GET / - PromptDJ Web UI",
            "POST /generate - Generate melody MIDI",
            "POST /drums - Generate drum pattern MIDI", 
            "POST /continue - Continue/extend uploaded MIDI",
            "POST /style - Apply humanization to uploaded MIDI",
            "GET /docs - Interactive API documentation",
        ]
    }


@app.post("/generate")
def generate(req: GenerateRequest):
    """Generate a new melody MIDI file."""
    try:
        path = generate_melody_midi(req)
        return FileResponse(
            path, 
            media_type="audio/midi", 
            filename=f"melody_{req.scale}_{req.tempo_bpm}bpm.mid"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/drums")
def drums(req: DrumifyRequest):
    """Generate a drum pattern MIDI file."""
    try:
        path = generate_drums_midi(req)
        return FileResponse(
            path,
            media_type="audio/midi",
            filename=f"drums_{req.style}_{req.tempo_bpm}bpm.mid"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/continue")
async def continue_midi(file: UploadFile = File(...)):
    """Upload a MIDI file and get an extended version."""
    try:
        data = await file.read()
        fd_in, path_in = tempfile.mkstemp(suffix=".mid", prefix="upload_")
        os.close(fd_in)
        with open(path_in, "wb") as f:
            f.write(data)

        path_out = continue_midi_file(path_in)
        
        # Cleanup input
        os.unlink(path_in)
        
        return FileResponse(
            path_out,
            media_type="audio/midi",
            filename=f"continued_{file.filename}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/style")
async def style(
    file: UploadFile = File(...),
    humanize: float = 0.3,
    velocity_variation: float = 0.2,
    swing: float = 0.0
):
    """Apply humanization/style transformation to uploaded MIDI."""
    try:
        data = await file.read()
        fd_in, path_in = tempfile.mkstemp(suffix=".mid", prefix="upload_")
        os.close(fd_in)
        with open(path_in, "wb") as f:
            f.write(data)

        req = StyleRequest(
            humanize=humanize,
            velocity_variation=velocity_variation,
            swing=swing
        )
        path_out = humanize_midi_file(path_in, req)
        
        # Cleanup input
        os.unlink(path_in)
        
        return FileResponse(
            path_out,
            media_type="audio/midi",
            filename=f"styled_{file.filename}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# WEBSOCKET FOR SPECTACLES
# ============================================================================

class ConnectionManager:
    """Manages WebSocket connections for Spectacles clients."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.client_states: Dict[str, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.client_states[client_id] = {
            "connected_at": datetime.now().isoformat(),
            "tempo_bpm": 120,
            "scale": "C_major",
            "density": 0.55,
            "variation": 0.35,
            "drum_style": "techno",
            "swing": 0.0
        }
        print(f"🕶️ Spectacles client connected: {client_id}")
    
    def disconnect(self, websocket: WebSocket, client_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if client_id in self.client_states:
            del self.client_states[client_id]
        print(f"🕶️ Spectacles client disconnected: {client_id}")
    
    async def send_json(self, websocket: WebSocket, data: dict):
        try:
            await websocket.send_json(data)
        except Exception as e:
            print(f"Error sending JSON to client: {e}")
            raise  # Re-raise to let caller handle
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass


manager = ConnectionManager()


# ============================================================================
# MIDI TO AUDIO RENDERING (FluidSynth)
# ============================================================================

def render_midi_to_wav(midi_path: str) -> str:
    """
    Render a MIDI file to WAV using FluidSynth.
    Returns the path to the generated WAV file.
    """
    if not SF2_PATH.exists():
        raise RuntimeError(f"SoundFont not found: {SF2_PATH}")
    
    if not Path(midi_path).exists():
        raise RuntimeError(f"MIDI file not found: {midi_path}")
    
    # Generate unique output filename
    out_name = f"track_{uuid.uuid4().hex}.wav"
    wav_path = OUT_DIR / out_name
    
    # Run FluidSynth to render MIDI to WAV
    # Correct syntax: fluidsynth -ni -F output.wav -r 44100 soundfont.sf2 input.mid
    cmd = [
        "fluidsynth",
        "-ni",                   # Non-interactive mode (required for rendering)
        "-F", str(wav_path),     # Output WAV file (must come before soundfont)
        "-r", "44100",           # Sample rate
        str(SF2_PATH.absolute()),  # SoundFont file (absolute path)
        str(Path(midi_path).absolute()),  # Input MIDI (absolute path)
    ]
    
    print(f"FluidSynth command: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        print(f"FluidSynth stdout: {result.stdout}")
        if result.stderr:
            print(f"FluidSynth stderr: {result.stderr}")
        print(f"FluidSynth return code: {result.returncode}")
        
        # Check if file was created
        if not wav_path.exists():
            raise RuntimeError(f"FluidSynth did not create output file. Return code: {result.returncode}, stderr: {result.stderr}")
        
        print(f"FluidSynth rendered: {wav_path} ({wav_path.stat().st_size} bytes)")
        return str(wav_path)
        
    except subprocess.TimeoutExpired:
        raise RuntimeError("FluidSynth rendering timed out")


def wav_to_mp3(wav_path: str) -> str:
    """
    Convert WAV to MP3 using FFmpeg.
    Returns the path to the generated MP3 file.
    """
    mp3_path = Path(wav_path).with_suffix(".mp3")
    
    try:
        subprocess.run([
            "ffmpeg",
            "-y",                     # Overwrite output
            "-i", wav_path,           # Input WAV
            "-codec:a", "libmp3lame", # MP3 codec
            "-q:a", "3",              # Quality (0-9, lower is better)
            str(mp3_path)
        ], check=True, capture_output=True, text=True, timeout=60)
        
        print(f"FFmpeg converted to MP3: {mp3_path}")
        return str(mp3_path)
        
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg error: {e.stderr}")
        raise RuntimeError(f"FFmpeg conversion failed: {e.stderr}")


def generate_audio_from_midi(midi_path: str, format: str = "wav") -> tuple:
    """
    Generate audio file from MIDI and return (file_path, url).
    For Spectacles, use format="mp3" for better compatibility.
    """
    wav_path = render_midi_to_wav(midi_path)
    
    if format == "mp3":
        audio_path = wav_to_mp3(wav_path)
        # Clean up WAV file after MP3 conversion to save space
        try:
            os.unlink(wav_path)
        except:
            pass  # Ignore if already deleted
    else:
        audio_path = wav_path
    
    # Build URL for Lens Studio to fetch
    filename = Path(audio_path).name
    url = f"{HOST_URL}/out/{filename}"
    
    return audio_path, url


def generate_midi_bytes(req: GenerateRequest) -> bytes:
    """Generate melody MIDI and return as bytes."""
    path = generate_melody_midi(req)
    with open(path, "rb") as f:
        data = f.read()
    os.unlink(path)
    return data


def generate_drums_bytes(req: DrumifyRequest) -> bytes:
    """Generate drums MIDI and return as bytes."""
    path = generate_drums_midi(req)
    with open(path, "rb") as f:
        data = f.read()
    os.unlink(path)
    return data


@app.websocket("/ws/spectacles/{client_id}")
async def websocket_spectacles(websocket: WebSocket, client_id: str):
    """
    WebSocket endpoint for Snap Spectacles.
    
    Message Protocol:
    
    Client → Server:
    {
        "action": "generate_melody" | "generate_drums" | "update_params" | "ping",
        "params": { ... }
    }
    
    Server → Client:
    {
        "type": "midi_data" | "status" | "error" | "pong",
        "data": { ... }
    }
    """
    await manager.connect(websocket, client_id)
    
    # Send welcome message with current state
    await manager.send_json(websocket, {
        "type": "connected",
        "client_id": client_id,
        "state": manager.client_states[client_id],
        "available_scales": list(SCALES.keys()),
        "available_drum_styles": list(DRUM_PATTERNS.keys())
    })
    
    try:
        while True:
            # Receive message from Spectacles (handle both text and binary)
            try:
                message = await websocket.receive()
                
                # Handle different message types
                if "text" in message:
                    raw_text = message["text"]
                elif "bytes" in message:
                    raw_text = message["bytes"].decode("utf-8")
                else:
                    print(f"Unknown message type from {client_id}: {message}")
                    continue
                
                # Clean the text (remove any trailing garbage and null bytes)
                raw_text = raw_text.strip().rstrip('\x00')
                
                # Handle potential concatenated JSON objects - find first complete object
                # Look for the end of the first JSON object
                brace_count = 0
                end_pos = 0
                in_string = False
                escape_next = False
                
                for i, char in enumerate(raw_text):
                    if escape_next:
                        escape_next = False
                        continue
                    if char == '\\' and in_string:
                        escape_next = True
                        continue
                    if char == '"' and not escape_next:
                        in_string = not in_string
                        continue
                    if not in_string:
                        if char == '{':
                            brace_count += 1
                        elif char == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                end_pos = i + 1
                                break
                
                # Extract just the first JSON object
                if end_pos > 0:
                    json_text = raw_text[:end_pos]
                else:
                    json_text = raw_text
                
                # Parse JSON
                data = json.loads(json_text)
                
            except json.JSONDecodeError as e:
                print(f"JSON decode error from {client_id}: {e}")
                print(f"Raw message (first 300 chars): {raw_text[:300] if 'raw_text' in dir() else 'N/A'}")
                await manager.send_json(websocket, {
                    "type": "error",
                    "message": f"Invalid JSON: {str(e)}",
                    "code": "parse_error"
                })
                continue
            except Exception as e:
                print(f"Error receiving message from {client_id}: {e}")
                await manager.send_json(websocket, {
                    "type": "error",
                    "message": f"Message error: {str(e)}",
                    "code": "receive_error"
                })
                continue
            
            action = data.get("action", "")
            params = data.get("params", {})
            
            # Update client state
            state = manager.client_states.get(client_id, {})
            
            if action == "ping":
                await manager.send_json(websocket, {"type": "pong", "timestamp": datetime.now().isoformat()})
            
            elif action == "update_params":
                # Update stored parameters
                for key, value in params.items():
                    if key in state:
                        state[key] = value
                manager.client_states[client_id] = state
                await manager.send_json(websocket, {
                    "type": "params_updated",
                    "state": state
                })
            
            elif action == "generate_melody":
                # Generate melody with current or provided params
                req = GenerateRequest(
                    tempo_bpm=params.get("tempo_bpm", state.get("tempo_bpm", 120)),
                    bars=params.get("bars", 8),
                    scale=params.get("scale", state.get("scale", "C_major")),
                    density=params.get("density", state.get("density", 0.55)),
                    variation=params.get("variation", state.get("variation", 0.35)),
                    seed=params.get("seed")
                )
                
                await manager.send_json(websocket, {"type": "status", "message": "Generating melody..."})
                
                try:
                    # Generate MIDI file
                    midi_path = generate_melody_midi(req)
                    
                    # Render to audio
                    await manager.send_json(websocket, {"type": "status", "message": "Rendering audio..."})
                    # Use MP3 for Spectacles (better compatibility than WAV)
                    audio_path, audio_url = generate_audio_from_midi(midi_path, format="mp3")
                    
                    # Get file size
                    audio_size = os.path.getsize(audio_path)
                    
                    # Clean up MIDI file
                    os.unlink(midi_path)
                    
                    # Send audio URL to Lens Studio
                    await manager.send_json(websocket, {
                        "type": "audio_ready",
                        "format": "mp3",
                        "url": audio_url,
                        "size_bytes": audio_size,
                        "params": {
                            "tempo_bpm": req.tempo_bpm,
                            "bars": req.bars,
                            "scale": req.scale,
                            "density": req.density,
                            "variation": req.variation
                        }
                    })
                except Exception as e:
                    print(f"Error generating melody: {e}")
                    await manager.send_json(websocket, {"type": "error", "message": str(e)})
            
            elif action == "generate_drums":
                # Generate drums with current or provided params
                req = DrumifyRequest(
                    tempo_bpm=params.get("tempo_bpm", state.get("tempo_bpm", 120)),
                    bars=params.get("bars", 4),
                    style=params.get("style", state.get("drum_style", "techno")),
                    swing=params.get("swing", state.get("swing", 0.0)),
                    seed=params.get("seed")
                )
                
                await manager.send_json(websocket, {"type": "status", "message": "Generating drums..."})
                
                try:
                    # Generate MIDI file
                    midi_path = generate_drums_midi(req)
                    
                    # Render to audio
                    await manager.send_json(websocket, {"type": "status", "message": "Rendering audio..."})
                    # Use MP3 for Spectacles (better compatibility than WAV)
                    audio_path, audio_url = generate_audio_from_midi(midi_path, format="mp3")
                    
                    # Get file size
                    audio_size = os.path.getsize(audio_path)
                    
                    # Clean up MIDI file
                    os.unlink(midi_path)
                    
                    # Send audio URL to Lens Studio
                    await manager.send_json(websocket, {
                        "type": "audio_ready",
                        "format": "mp3",
                        "url": audio_url,
                        "size_bytes": audio_size,
                        "params": {
                            "tempo_bpm": req.tempo_bpm,
                            "bars": req.bars,
                            "style": req.style,
                            "swing": req.swing
                        }
                    })
                except Exception as e:
                    print(f"Error generating drums: {e}")
                    await manager.send_json(websocket, {"type": "error", "message": str(e)})
            
            elif action == "generate_both":
                # Generate both melody and drums
                melody_req = GenerateRequest(
                    tempo_bpm=params.get("tempo_bpm", state.get("tempo_bpm", 120)),
                    bars=params.get("bars", 8),
                    scale=params.get("scale", state.get("scale", "C_major")),
                    density=params.get("density", state.get("density", 0.55)),
                    variation=params.get("variation", state.get("variation", 0.35))
                )
                drums_req = DrumifyRequest(
                    tempo_bpm=params.get("tempo_bpm", state.get("tempo_bpm", 120)),
                    bars=params.get("bars", 8),
                    style=params.get("style", state.get("drum_style", "techno")),
                    swing=params.get("swing", state.get("swing", 0.0))
                )
                
                await manager.send_json(websocket, {"type": "status", "message": "Generating melody..."})
                
                try:
                    # Generate melody
                    melody_midi_path = generate_melody_midi(melody_req)
                    await manager.send_json(websocket, {"type": "status", "message": "Rendering melody audio..."})
                    # Use MP3 for Spectacles (better compatibility)
                    melody_audio_path, melody_url = generate_audio_from_midi(melody_midi_path, format="mp3")
                    melody_size = os.path.getsize(melody_audio_path)
                    os.unlink(melody_midi_path)
                    
                    # Generate drums
                    await manager.send_json(websocket, {"type": "status", "message": "Generating drums..."})
                    drums_midi_path = generate_drums_midi(drums_req)
                    await manager.send_json(websocket, {"type": "status", "message": "Rendering drums audio..."})
                    # Use MP3 for Spectacles (better compatibility)
                    drums_audio_path, drums_url = generate_audio_from_midi(drums_midi_path, format="mp3")
                    drums_size = os.path.getsize(drums_audio_path)
                    os.unlink(drums_midi_path)
                    
                    # Send both audio URLs
                    await manager.send_json(websocket, {
                        "type": "audio_ready",
                        "format": "both",
                        "melody": {
                            "url": melody_url,
                            "size_bytes": melody_size
                        },
                        "drums": {
                            "url": drums_url,
                            "size_bytes": drums_size
                        },
                        "params": {
                            "tempo_bpm": melody_req.tempo_bpm,
                            "bars": melody_req.bars,
                            "scale": melody_req.scale,
                            "drum_style": drums_req.style
                        }
                    })
                except Exception as e:
                    print(f"Error generating both: {e}")
                    await manager.send_json(websocket, {"type": "error", "message": str(e)})
            
            else:
                await manager.send_json(websocket, {
                    "type": "error",
                    "message": f"Unknown action: {action}",
                    "available_actions": ["ping", "update_params", "generate_melody", "generate_drums", "generate_both"]
                })
    
    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {client_id}")
        manager.disconnect(websocket, client_id)
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        print(f"WebSocket error for {client_id}: {error_msg}")
        print(f"Traceback: {error_trace}")
        
        # Try to send error message before disconnecting
        try:
            await manager.send_json(websocket, {
                "type": "error",
                "message": f"Server error: {error_msg}",
                "code": "internal_error"
            })
        except:
            pass  # Connection may already be closed
        
        manager.disconnect(websocket, client_id)


@app.get("/ws/test")
def websocket_test_page():
    """Serve a test page for WebSocket connection."""
    return HTMLResponse("""
<!DOCTYPE html>
<html>
<head>
    <title>PromptDJ WebSocket Test</title>
    <style>
        body { font-family: monospace; background: #0a0a0f; color: #00f5ff; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #ff00aa; }
        button { background: #8b5cf6; color: white; border: none; padding: 10px 20px; margin: 5px; cursor: pointer; border-radius: 5px; }
        button:hover { background: #a78bfa; }
        #log { background: #1a1a25; padding: 15px; border-radius: 10px; height: 300px; overflow-y: auto; margin: 20px 0; }
        .log-entry { margin: 5px 0; padding: 5px; border-left: 3px solid #8b5cf6; padding-left: 10px; }
        .sent { border-left-color: #00f5ff; }
        .received { border-left-color: #00ff88; }
        .error { border-left-color: #ff0055; color: #ff0055; }
        input, select { background: #1a1a25; color: white; border: 1px solid #333; padding: 8px; margin: 5px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🕶️ PromptDJ WebSocket Test</h1>
        <p>Test the Spectacles WebSocket connection</p>
        
        <div>
            <button onclick="connect()">Connect</button>
            <button onclick="disconnect()">Disconnect</button>
            <span id="status" style="margin-left: 20px;">Disconnected</span>
        </div>
        
        <h3>Controls</h3>
        <div>
            <label>Tempo: <input type="number" id="tempo" value="120" min="60" max="180"></label>
            <label>Scale: 
                <select id="scale">
                    <option value="C_major">C Major</option>
                    <option value="A_minor">A Minor</option>
                    <option value="D_minor">D Minor</option>
                    <option value="G_major">G Major</option>
                </select>
            </label>
            <label>Bars: <input type="number" id="bars" value="8" min="2" max="64"></label>
        </div>
        <div>
            <label>Drum Style:
                <select id="drumStyle">
                    <option value="techno">Techno</option>
                    <option value="funk">Funk</option>
                    <option value="jazz">Jazz</option>
                    <option value="electronic">Electronic</option>
                    <option value="basic">Basic</option>
                </select>
            </label>
            <label>Density: <input type="range" id="density" min="0" max="100" value="55"></label>
        </div>
        
        <h3>Actions</h3>
        <div>
            <button onclick="sendPing()">Ping</button>
            <button onclick="generateMelody()">Generate Melody</button>
            <button onclick="generateDrums()">Generate Drums</button>
            <button onclick="generateBoth()">Generate Both</button>
            <button onclick="updateParams()">Update Params</button>
        </div>
        
        <h3>Log</h3>
        <div id="log"></div>
    </div>
    
    <script>
        let ws = null;
        const clientId = 'test-' + Math.random().toString(36).substr(2, 9);
        
        function log(message, type = '') {
            const logDiv = document.getElementById('log');
            const entry = document.createElement('div');
            entry.className = 'log-entry ' + type;
            entry.textContent = new Date().toLocaleTimeString() + ' - ' + message;
            logDiv.appendChild(entry);
            logDiv.scrollTop = logDiv.scrollHeight;
        }
        
        function connect() {
            const wsUrl = 'ws://' + window.location.host + '/ws/spectacles/' + clientId;
            log('Connecting to ' + wsUrl + '...', 'sent');
            
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                document.getElementById('status').textContent = '🟢 Connected';
                document.getElementById('status').style.color = '#00ff88';
                log('Connected!', 'received');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                log('Received: ' + JSON.stringify(data, null, 2), 'received');
                
                if (data.type === 'midi_data') {
                    log('MIDI generated! Size: ' + (data.size_bytes || data.melody?.size_bytes) + ' bytes', 'received');
                }
            };
            
            ws.onclose = () => {
                document.getElementById('status').textContent = '🔴 Disconnected';
                document.getElementById('status').style.color = '#ff0055';
                log('Disconnected', 'error');
            };
            
            ws.onerror = (error) => {
                log('Error: ' + error, 'error');
            };
        }
        
        function disconnect() {
            if (ws) ws.close();
        }
        
        function send(data) {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                log('Not connected!', 'error');
                return;
            }
            log('Sending: ' + JSON.stringify(data), 'sent');
            ws.send(JSON.stringify(data));
        }
        
        function sendPing() {
            send({ action: 'ping' });
        }
        
        function generateMelody() {
            send({
                action: 'generate_melody',
                params: {
                    tempo_bpm: parseInt(document.getElementById('tempo').value),
                    scale: document.getElementById('scale').value,
                    bars: parseInt(document.getElementById('bars').value),
                    density: parseInt(document.getElementById('density').value) / 100
                }
            });
        }
        
        function generateDrums() {
            send({
                action: 'generate_drums',
                params: {
                    tempo_bpm: parseInt(document.getElementById('tempo').value),
                    style: document.getElementById('drumStyle').value,
                    bars: parseInt(document.getElementById('bars').value)
                }
            });
        }
        
        function generateBoth() {
            send({
                action: 'generate_both',
                params: {
                    tempo_bpm: parseInt(document.getElementById('tempo').value),
                    scale: document.getElementById('scale').value,
                    style: document.getElementById('drumStyle').value,
                    bars: parseInt(document.getElementById('bars').value),
                    density: parseInt(document.getElementById('density').value) / 100
                }
            });
        }
        
        function updateParams() {
            send({
                action: 'update_params',
                params: {
                    tempo_bpm: parseInt(document.getElementById('tempo').value),
                    scale: document.getElementById('scale').value,
                    drum_style: document.getElementById('drumStyle').value,
                    density: parseInt(document.getElementById('density').value) / 100
                }
            });
        }
    </script>
</body>
</html>
    """)


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8123)

