# 🕶️ PromptDJ Lens Studio Setup

## Quick Start

### Step 1: Import Scripts into Lens Studio

1. In Lens Studio, go to **Asset Browser**
2. Right-click → **Add New** → **Script**
3. Copy the contents from these files:
   - `PromptDJController.js` - Main WebSocket controller
   - `PromptDJButtons.js` - Button action handlers
   - `PinchGestureHandler.js` - Hand gesture detection

Or import directly:
1. Right-click Asset Browser → **Import Files**
2. Navigate to `~/music-ai-service/spectacles-lens/Scripts/`
3. Select all `.js` files

---

### Step 2: Add InternetModule

1. In Asset Browser, click **+** → **Internet Module**
2. This creates an InternetModule asset

---

### Step 3: Create Scene Hierarchy

```
Scene
├── Camera Object
├── Lighting  
├── SpectaclesInteractionKit
│   ├── [REQUIRED] Core
│   ├── LeftHandInteractor
│   ├── RightHandInteractor
│   └── ...
│
├── PromptDJ_Manager (SceneObject)     ← Create this
│   └── Script: PromptDJController.js
│
├── Gesture_Handler (SceneObject)       ← Create this
│   └── Script: PinchGestureHandler.js
│
└── UI_Panel (SceneObject)              ← Create this
    ├── Background
    ├── StatusText (Text)
    ├── TempoText (Text)
    ├── ScaleText (Text)
    ├── DrumStyleText (Text)
    └── Buttons
        ├── MelodyButton
        │   └── Script: PromptDJButtons.js (action: melody)
        ├── DrumsButton
        │   └── Script: PromptDJButtons.js (action: drums)
        ├── BothButton
        │   └── Script: PromptDJButtons.js (action: both)
        ├── TempoUpButton
        │   └── Script: PromptDJButtons.js (action: tempoUp)
        ├── TempoDownButton
        │   └── Script: PromptDJButtons.js (action: tempoDown)
        └── NextScaleButton
            └── Script: PromptDJButtons.js (action: nextScale)
```

---

### Step 4: Configure PromptDJController

Select the **PromptDJ_Manager** object and in Inspector:

| Input | Value |
|-------|-------|
| **Internet Module** | Drag your InternetModule asset here |
| **Backend Url** | `ws://YOUR_MAC_IP:8123/ws/spectacles/` |
| **Status Text** | Drag StatusText object |
| **Tempo Text** | Drag TempoText object |
| **Scale Text** | Drag ScaleText object |
| **Drum Style Text** | Drag DrumStyleText object |

**Important:** Replace `YOUR_MAC_IP` with your actual IP (e.g., `172.20.10.3`)

---

### Step 5: Configure Button Scripts

For each button, select it and configure:

| Input | Value |
|-------|-------|
| **Controller Object** | Drag PromptDJ_Manager object |
| **Action** | Select from dropdown (melody, drums, both, etc.) |

Then connect the button's **OnTriggerEnd** event to call `onButtonPressed`.

---

### Step 6: Configure Pinch Gesture Handler

Select **Gesture_Handler** and configure:

| Input | Value |
|-------|-------|
| **Controller Object** | Drag PromptDJ_Manager object |
| **Right Hand Tracking** | Drag RightHandInteractor script |
| **Left Hand Tracking** | Drag LeftHandInteractor script |
| **Pinch Threshold** | 0.8 (adjust sensitivity) |
| **Cooldown Time** | 0.5 (seconds between triggers) |

---

## Get Your Mac's IP

Run in Terminal:
```bash
ipconfig getifaddr en0
```

Your WebSocket URL will be:
```
ws://YOUR_IP:8123/ws/spectacles/
```

---

## Start the Backend

```bash
cd ~/music-ai-service
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8123
```

**Important:** Use `--host 0.0.0.0` to accept external connections!

---

## Test WebSocket Connection

Open in browser: `http://YOUR_IP:8123/ws/test`

This test page lets you verify the WebSocket works before testing on Spectacles.

---

## Gesture Controls

| Gesture | Action |
|---------|--------|
| **Right Pinch** 🤏 | Generate Melody |
| **Left Pinch** 🤏 | Generate Drums |
| **Both Pinch** 🤲 | Generate Both |

---

## Troubleshooting

### "Not connected" or connection fails

1. **Check IP address** - Make sure you're using the correct Mac IP
2. **Check firewall** - Allow port 8123 through macOS firewall
3. **Same network** - Spectacles and Mac must be on same WiFi
4. **Backend running** - Verify with `curl http://YOUR_IP:8123/api`

### InternetModule errors

- Make sure you added InternetModule to Asset Browser
- Drag it to the script's internetModule input
- InternetModule only works on Spectacles/Camera Kit (not in Preview)

### Gestures not working

- Verify SpectaclesInteractionKit is set up correctly
- Check hand tracking is enabled in Project Settings
- Look at Logger panel for debug messages

---

## API Reference

### PromptDJController Methods

```javascript
// Generate music
script.generateMelody()    // Generate melody
script.generateDrums()     // Generate drums
script.generateBoth()      // Generate both

// Adjust parameters
script.increaseTempo()     // +5 BPM
script.decreaseTempo()     // -5 BPM
script.nextScale()         // Cycle scale
script.previousScale()     // Previous scale
script.nextDrumStyle()     // Cycle drum style

// Set values directly
script.setDensity(0.6)     // 0-1
script.setVariation(0.4)   // 0-1
script.setBars(16)         // 2-64

// Utilities
script.ping()              // Test connection
script.isConnected()       // Check status
script.getParams()         // Get current params
```

---

## Files Location

```
~/music-ai-service/spectacles-lens/Scripts/
├── PromptDJController.js    ← Main WebSocket controller
├── PromptDJButtons.js       ← Button handlers
└── PinchGestureHandler.js   ← Gesture detection
```

---

*Built for Snap Spectacles 2024 with InternetModule WebSocket API* 🕶️

