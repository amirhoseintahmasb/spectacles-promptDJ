# 🕶️ PromptDJ Spectacles Lens Setup Guide

## Overview

This guide explains how to set up the PromptDJ Lens in Lens Studio for Snap Spectacles (2024).

## Prerequisites

1. **Lens Studio 5.x** with Spectacles support
2. **SpectaclesInteractionKit** package installed
3. **PromptDJ Backend** running on your Mac
4. **Same WiFi network** for Spectacles and Mac

---

## Step 1: Get Your Mac's IP Address

In Terminal, run:
```bash
ipconfig getifaddr en0
```

Note this IP (e.g., `192.168.1.100`) - you'll need it for the WebSocket URL.

---

## Step 2: Start the PromptDJ Backend

```bash
cd ~/music-ai-service
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8123
```

The server must use `0.0.0.0` to accept connections from Spectacles.

---

## Step 3: Test WebSocket Connection

Open in browser: `http://YOUR_IP:8123/ws/test`

This test page lets you verify the WebSocket is working before connecting Spectacles.

---

## Step 4: Set Up Lens Studio Project

### 4.1 Create New Spectacles Project
1. Open Lens Studio
2. File → New Project → Spectacles

### 4.2 Import SpectaclesInteractionKit
1. Asset Library → SpectaclesInteractionKit
2. Import the package

### 4.3 Add Scripts
1. Copy the scripts from `spectacles-lens/Scripts/` to your Lens Studio project:
   - `PromptDJController.ts`
   - `GestureHandler.ts`

2. In Lens Studio, right-click in Asset Browser → Import Files
3. Select both TypeScript files

### 4.4 Create Scene Objects

Create this hierarchy in Scene:

```
Scene
├── Camera Object
├── Lighting
├── SpectaclesInteractionKit (from package)
│   ├── [REQUIRED] Core
│   ├── LeftHandInteractor
│   ├── RightHandInteractor
│   └── ...
├── PromptDJ_Controller (SceneObject)  ← Create this
│   └── PromptDJController.ts (attached)
├── Gesture_Handler (SceneObject)       ← Create this
│   └── GestureHandler.ts (attached)
└── UI_Panel (SceneObject)              ← Create this
    ├── StatusText (Text)
    ├── TempoText (Text)
    ├── ScaleText (Text)
    └── Buttons...
```

### 4.5 Configure PromptDJController

Select the PromptDJ_Controller object and in Inspector:

| Property | Value |
|----------|-------|
| Backend Url | `ws://YOUR_IP:8123/ws/spectacles/` |
| Status Text | Link to StatusText object |
| Tempo Text | Link to TempoText object |
| Scale Text | Link to ScaleText object |

### 4.6 Configure GestureHandler

Select the Gesture_Handler object and in Inspector:

| Property | Value |
|----------|-------|
| Controller | Link to PromptDJ_Controller |
| Right Hand Interactor | Link to RightHandInteractor |
| Left Hand Interactor | Link to LeftHandInteractor |

---

## Step 5: Create UI Panel

### Using Spectacles UI Kit

1. Import **SpectaclesUIKit** from Asset Library
2. Create a floating panel with:

```
UI_Panel
├── Background (Image with rounded corners)
├── Title: "PROMPTDJ" (Text)
├── StatusText (Text) - Shows connection status
├── TempoDisplay
│   ├── TempoText (Text) - "120 BPM"
│   ├── TempoUpButton (Interactable)
│   └── TempoDownButton (Interactable)
├── ScaleDisplay
│   ├── ScaleText (Text) - "C Major"
│   └── NextScaleButton (Interactable)
├── GenerateButtons
│   ├── MelodyButton (Interactable)
│   ├── DrumsButton (Interactable)
│   └── BothButton (Interactable)
└── DrumStyleDisplay
    ├── DrumStyleText (Text)
    └── NextStyleButton (Interactable)
```

### Connect Button Events

For each button, in the Interactable component:
1. Add OnTriggerEnd event
2. Set Target: Gesture_Handler object
3. Set Method: Corresponding handler method

| Button | Method |
|--------|--------|
| TempoUpButton | onTempoUpButton |
| TempoDownButton | onTempoDownButton |
| NextScaleButton | onNextScaleButton |
| MelodyButton | onGenerateMelodyButton |
| DrumsButton | onGenerateDrumsButton |
| BothButton | onGenerateBothButton |
| NextStyleButton | onNextDrumStyleButton |

---

## Step 6: Test in Preview

1. Click "Preview Lens" in Lens Studio
2. Select "Spectacles (2024)" device
3. Use mouse to simulate hand interactions
4. Check Logger for connection messages

---

## Step 7: Deploy to Spectacles

1. Click "Publish" in Lens Studio
2. Follow the publishing flow
3. On Spectacles, open Snapchat and find your Lens

---

## Gesture Controls

| Gesture | Action |
|---------|--------|
| Right Hand Pinch | Generate Melody |
| Left Hand Pinch | Generate Drums |
| Both Hands Pinch | Generate Both |
| Swipe Up | Increase Tempo |
| Swipe Down | Decrease Tempo |
| Swipe Left | Previous Scale |
| Swipe Right | Next Scale |

---

## Troubleshooting

### "Not connected" status
- Check Mac and Spectacles are on same WiFi
- Verify backend is running with `--host 0.0.0.0`
- Test with browser first: `http://YOUR_IP:8123/ws/test`

### WebSocket errors
- Ensure firewall allows port 8123
- Try disabling macOS firewall temporarily for testing

### Gestures not working
- Verify SpectaclesInteractionKit is properly set up
- Check hand interactors are linked in GestureHandler
- Look at Logger for gesture detection messages

### MIDI not generating
- Check backend logs for errors
- Verify API works: `curl http://YOUR_IP:8123/api`

---

## WebSocket Protocol

### Client → Server Messages

```json
// Generate melody
{
    "action": "generate_melody",
    "params": {
        "tempo_bpm": 120,
        "scale": "C_major",
        "bars": 8,
        "density": 0.55,
        "variation": 0.35
    }
}

// Generate drums
{
    "action": "generate_drums",
    "params": {
        "tempo_bpm": 120,
        "style": "techno",
        "bars": 8,
        "swing": 0.1
    }
}

// Generate both
{
    "action": "generate_both",
    "params": { ... }
}

// Update parameters
{
    "action": "update_params",
    "params": { ... }
}

// Ping
{
    "action": "ping"
}
```

### Server → Client Messages

```json
// Connected
{
    "type": "connected",
    "client_id": "spectacles-abc123",
    "state": { ... },
    "available_scales": [...],
    "available_drum_styles": [...]
}

// MIDI data
{
    "type": "midi_data",
    "format": "melody",
    "params": { ... },
    "midi_base64": "TVRoZC...",
    "size_bytes": 1234
}

// Status
{
    "type": "status",
    "message": "Generating..."
}

// Error
{
    "type": "error",
    "message": "Error description"
}
```

---

## Next Steps

1. **Add Audio Preview**: Use Spectacles audio API to play generated MIDI
2. **Add Visualizer**: Create 3D visualization of the generated music
3. **Multi-user**: Use Sync Kit for collaborative music creation
4. **Save/Export**: Add ability to save MIDI to phone via Snapchat

---

*Built for Snap Spectacles 2024* 🕶️

