# 🕶️ PromptDJ Lens Studio Setup (TypeScript)

## ⚠️ Critical Audio Requirements for Spectacles

Based on official Snap documentation, these are the **key requirements** for audio playback on Spectacles:

| Requirement | Details |
|-------------|---------|
| **Max Concurrent Tracks** | 16 audio assets maximum |
| **Recommended Format** | MP3 (mono channel) |
| **Optimal Duration** | Under 15 seconds |
| **Playback Mode** | LowLatency for immediate response |
| **Required Modules** | InternetModule + RemoteMediaModule |

---

## Quick Start

### Step 1: Import TypeScript Scripts into Lens Studio

1. In Lens Studio, go to **Asset Browser**
2. Right-click → **Import Files**
3. Navigate to `~/music-ai-service/spectacles-lens/Scripts/`
4. Select all `.ts` files:
   - `PromptDJController.ts` - Main WebSocket controller
   - `PromptDJButtons.ts` - Button action handlers
   - `PromptDJUI.ts` - UI management
   - `DJButton.ts` - Genre button
   - `DJControlButton.ts` - Control button
   - `PinchGestureHandler.ts` - Hand gesture detection
   - `PromptDJGenreButton.ts` - Genre-specific button

---

### Step 2: Add Required Modules (CRITICAL!)

⚠️ **Both modules are REQUIRED for audio playback!**

1. In Asset Browser, click **+** → **Internet Module**
2. Click **+** → **Remote Media Module**

Without RemoteMediaModule, audio will NOT play on Spectacles!

---

### Step 3: Add AudioComponent (CRITICAL!)

1. Create a new SceneObject for audio playback
2. Add **Component** → **Audio** → **Audio Component**
3. Connect this AudioComponent to the PromptDJController script

---

### Step 4: Create Scene Hierarchy

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
│   ├── Script: PromptDJController.ts
│   └── AudioComponent                  ← Add this!
│
├── Gesture_Handler (SceneObject)       ← Create this
│   └── Script: PinchGestureHandler.ts
│
└── UI_Panel (SceneObject)              ← Create this
    ├── Background
    ├── StatusText (Text)
    ├── TempoText (Text)
    ├── ScaleText (Text)
    ├── DrumStyleText (Text)
    ├── NowPlayingText (Text)
    └── Buttons
        ├── MelodyButton
        │   └── Script: PromptDJButtons.ts (action: melody)
        ├── DrumsButton
        │   └── Script: PromptDJButtons.ts (action: drums)
        ├── BothButton
        │   └── Script: PromptDJButtons.ts (action: both)
        ├── TempoUpButton
        │   └── Script: PromptDJButtons.ts (action: tempoUp)
        ├── TempoDownButton
        │   └── Script: PromptDJButtons.ts (action: tempoDown)
        └── NextScaleButton
            └── Script: PromptDJButtons.ts (action: nextScale)
```

---

### Step 5: Configure PromptDJController

Select the **PromptDJ_Manager** object and in Inspector:

| Input | Value | Required |
|-------|-------|----------|
| **Internet Module** | Drag your InternetModule asset | ✅ YES |
| **Remote Media Module** | Drag your RemoteMediaModule asset | ✅ YES |
| **Backend Url** | `ws://YOUR_MAC_IP:8123/ws/spectacles/` | ✅ YES |
| **Audio Player** | Drag the AudioComponent | ✅ YES |
| **Use Low Latency Audio** | ✅ Checked (recommended) | Optional |
| **Status Text** | Drag StatusText object | Optional |
| **Tempo Text** | Drag TempoText object | Optional |
| **Scale Text** | Drag ScaleText object | Optional |
| **Drum Style Text** | Drag DrumStyleText object | Optional |

**Important:** Replace `YOUR_MAC_IP` with your actual IP (e.g., `172.20.10.3`)

---

### Step 6: Configure Button Scripts

For each button, select it and configure:

| Input | Value |
|-------|-------|
| **Controller Object** | Drag PromptDJ_Manager object (optional - uses global) |
| **Action** | Select from dropdown (melody, drums, both, etc.) |

**Note:** Buttons will automatically find the controller via `global.promptDJController` if not linked.

---

### Step 7: Configure Pinch Gesture Handler

Select **Gesture_Handler** and configure:

| Input | Value |
|-------|-------|
| **Controller Object** | Drag PromptDJ_Manager object (optional - uses global) |
| **Right Hand Tracking** | Drag RightHandInteractor script |
| **Left Hand Tracking** | Drag LeftHandInteractor script |
| **Pinch Threshold** | 0.8 (adjust sensitivity) |
| **Cooldown Time** | 0.5 (seconds between triggers) |

---

## 🔊 Audio Playback Deep Dive

### Why Audio Might Not Play

Based on Snap's official documentation, here are the common causes:

1. **Missing RemoteMediaModule** - Required for loading remote audio
2. **Missing AudioComponent** - Required for playback
3. **Too Many Concurrent Tracks** - Max 16 at once
4. **Wrong Audio Format** - Use MP3, mono channel
5. **Audio Too Long** - Keep under 15 seconds for best results
6. **Low Power Mode** - Default mode has latency; use LowLatency

### Audio Playback Mode

Spectacles default all Audio Components to **Low Power** mode to save battery. This introduces latency.

For immediate response (like button feedback), use **Low Latency** mode:

```typescript
// This is automatically done in PromptDJController if useLowLatencyAudio is true
if (Audio.PlaybackMode) {
    audioComponent.playbackMode = Audio.PlaybackMode.LowLatency
}
```

### Server-Side Audio Requirements

Your backend server should:

1. **Return MP3 format** (not WAV) for better compatibility
2. **Use mono channel** for smaller file size
3. **Keep duration under 15 seconds** for optimal performance
4. **Set proper CORS headers** for Spectacles to fetch audio

---

## Global Controller Access

The TypeScript version registers the controller globally, so any script can access it:

```typescript
// From any script
if (global.promptDJController) {
    global.promptDJController.generateMelody()
    global.promptDJController.generateDrums()
    global.promptDJController.generateBoth()
}
```

This fixes the `TypeError: cannot set property 'generateMelody' of undefined` error.

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

## 🔧 Troubleshooting

### Sound Not Playing (Most Common Issue)

**Checklist:**
- [ ] RemoteMediaModule added and connected?
- [ ] AudioComponent added and connected?
- [ ] InternetModule added and connected?
- [ ] Backend returning MP3 format (not WAV)?
- [ ] Audio file under 15 seconds?
- [ ] Less than 16 concurrent audio tracks?
- [ ] Spectacles volume turned up?
- [ ] Same WiFi network as backend?

**Debug Steps:**
1. Check Logger panel for error messages
2. Look for "Audio loaded successfully!" message
3. If you see "RemoteMediaModule not connected" - add the module
4. If you see "AudioComponent not connected" - add the component
5. If you see "Failed to load audio" - check audio format/URL

### "Not connected" or connection fails

1. **Check IP address** - Make sure you're using the correct Mac IP
2. **Check firewall** - Allow port 8123 through macOS firewall
3. **Same network** - Spectacles and Mac must be on same WiFi
4. **Backend running** - Verify with `curl http://YOUR_IP:8123/api`

### InternetModule errors

- Make sure you added InternetModule to Asset Browser
- Drag it to the script's internetModule input
- InternetModule only works on Spectacles/Camera Kit (not in Preview)

### RemoteMediaModule errors

- Make sure you added RemoteMediaModule to Asset Browser
- Drag it to the script's remoteMediaModule input
- Required for loading remote audio

### Gestures not working

- Verify SpectaclesInteractionKit is set up correctly
- Check hand tracking is enabled in Project Settings
- Look at Logger panel for debug messages

### Audio plays in Preview but not on Spectacles

- Spectacles have stricter audio requirements
- Convert audio to MP3 mono
- Reduce audio duration
- Check Spectacles firmware is up to date

---

## TypeScript Files

```
~/music-ai-service/spectacles-lens/Scripts/
├── PromptDJController.ts    ← Main WebSocket controller (registers globally)
├── PromptDJButtons.ts       ← Button handlers (uses global controller)
├── PromptDJUI.ts            ← UI management
├── DJButton.ts              ← Genre button
├── DJControlButton.ts       ← Control button
├── PinchGestureHandler.ts   ← Gesture detection
└── PromptDJGenreButton.ts   ← Genre-specific button
```

---

## API Reference

### PromptDJController Methods

```typescript
// Generate music
controller.generateMelody()    // Generate melody
controller.generateDrums()     // Generate drums
controller.generateBoth()      // Generate both

// Adjust parameters
controller.increaseTempo()     // +5 BPM
controller.decreaseTempo()     // -5 BPM
controller.nextScale()         // Cycle scale
controller.previousScale()     // Previous scale
controller.nextDrumStyle()     // Cycle drum style

// Set values directly
controller.setDensity(0.6)     // 0-1
controller.setVariation(0.4)   // 0-1
controller.setBars(16)         // 2-64

// Utilities
controller.ping()              // Test connection
controller.getIsConnected()    // Check status
controller.getIsPlaying()      // Check if audio playing
controller.getParams()         // Get current params
controller.getCurrentAudioUrl() // Get current audio URL

// Direct params access
controller.params.tempo_bpm = 120
controller.params.scale = "C_major"
controller.params.drum_style = "techno"
```

### Events

```typescript
// Subscribe to events
controller.onConnected.add(() => {
    print("Connected to backend!")
})

controller.onAudioReady.add((url: string) => {
    print("Audio ready: " + url)
})

controller.onAudioPlaying.add(() => {
    print("Audio is now playing!")
})

controller.onAudioError.add((error: string) => {
    print("Audio error: " + error)
})

controller.onParamsChanged.add((params: MusicParams) => {
    print("Params changed: " + params.tempo_bpm + " BPM")
})
```

---

## 📚 References

- [Spectacles Audio Documentation](https://developers.snap.com/spectacles/about-spectacles-features/audio)
- [Spectacles FAQ - Components](https://developers.snap.com/spectacles/support/spectacles-faq/components)
- [Lens Studio Audio Guide](https://developers.snap.com/lens-studio/features/audio/playing-audio)
- [Audio Track Assets](https://developers.snap.com/lens-studio/features/audio/audio-track-assets)

---

*Built for Snap Spectacles 2024 with TypeScript and InternetModule WebSocket API* 🕶️
