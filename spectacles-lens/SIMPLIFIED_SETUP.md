# Simplified PromptDJ for Spectacles

## The Problem

Too many scripts with circular dependencies:
- PromptDJController ↔ PromptDJUI ↔ DJButton ↔ DJControlButton ↔ PromptDJButton

## The Solution

**2 scripts total:**
1. **PromptDJManager.ts** - Handles EVERYTHING (WebSocket, audio, UI, state)
2. **DJButtonSimple.ts** - Simple button that calls the manager

---

## Step 1: Create PromptDJManager.ts (All-in-One)

✅ **Already created!** The script is at `Scripts/PromptDJManager.ts`

### Setup Steps:

1. **Create Manager Object**
   - Right-click in Hierarchy → Create Empty
   - Rename to "PromptDJManager"
   - Add Component → Script → PromptDJManager.ts
   - Add Component → Audio → Audio Component

2. **Add Required Assets**
   - Open Asset Browser (Ctrl+Shift+A)
   - Search "InternetModule" → Add to Assets
   - Search "RemoteMediaModule" → Add to Assets
   - Drag InternetModule to script's "Internet Module" input
   - Drag RemoteMediaModule to script's "Remote Media Module" input
   - Drag the AudioComponent to "Audio Player" input

3. **Set Backend URL**

   **For Lens Studio Preview:**
   ```
   ws://127.0.0.1:8123/ws/spectacles/
   ```

   **For Real Spectacles:**
   ```
   ws://YOUR_COMPUTER_IP:8123/ws/spectacles/
   ```
   
   **Get your IP:**
   - Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig` → Look for IPv4 Address

---

## Step 2: Create DJButtonSimple.ts

✅ **Already created!** The script is at `Scripts/DJButtonSimple.ts`

### Setup Steps:

1. **Create Test Button**
   - Right-click → Create Empty → Rename "TestButton"
   - Add Component → Interaction → Interactable
   - Add Component → Script → DJButtonSimple.ts
   - Set action to: `"test"`

2. **Create Play Button**
   - Right-click → Create Empty → Rename "PlayButton"  
   - Add Component → Interaction → Interactable
   - Add Component → Script → DJButtonSimple.ts
   - Set action to: `"random"`

---

## Step 3: Minimal Test Setup

### Scene Hierarchy:
```
Scene
├── Camera
├── PromptDJManager (Empty SceneObject)
│   └── [PromptDJManager.ts script]
│   └── [AudioComponent]
├── TestButton (SceneObject with Interactable)
│   └── [DJButtonSimple.ts - action: "test"]
└── PlayButton (SceneObject with Interactable)
    └── [DJButtonSimple.ts - action: "random"]
```

---

## Step 4: Testing Checklist

### Test 1: Backend Connection

```bash
# In terminal, start your backend:
cd /Users/amirhoseintahmasb/music-ai-service
./start.sh

# You should see:
# INFO: Uvicorn running on http://0.0.0.0:8123
```

### Test 2: Verify Backend is Reachable

```bash
# From another terminal:
curl http://127.0.0.1:8123/api

# Should return: {"status":"PromptDJ API running","version":"1.0"}
```

### Test 3: Lens Studio Preview

1. Press Play in Lens Studio
2. Look at Logger panel (View → Logger)
3. You should see:
   ```
   [PromptDJManager] PromptDJ Manager Initializing
   [PromptDJManager] ✓ InternetModule connected
   [PromptDJManager] ✓ RemoteMediaModule connected
   [PromptDJManager] ✓ AudioComponent connected
   [PromptDJManager] Connecting to: ws://...
   [PromptDJManager] ✓ Connected!
   ```

### Test 4: Click Test Button

1. In Preview, click the TestButton
2. Logger should show:
   ```
   [DJButton] Pressed: test
   [PromptDJManager] ========== CONNECTION TEST ==========
   [PromptDJManager] InternetModule: ✓
   ...
   ```

### Test 5: Click Play Button

1. Click PlayButton
2. Logger should show:
   ```
   [DJButton] Pressed: random
   [PromptDJManager] Playing: Techno @ 128 BPM
   [PromptDJManager] Sent: generate_both
   [PromptDJManager] Received: audio_ready
   [PromptDJManager] ✓ Playing!
   ```
3. You should hear music!

---

## Step 5: Common Issues & Fixes

### Issue: "InternetModule NOT connected!"

**Fix:**
1. Asset Browser → Search "InternetModule"
2. Click to add to Assets panel
3. Drag from Assets to script's "Internet Module" input

### Issue: "Connection error" or "Disconnected"

**Fix:**
1. Verify backend is running: `curl http://YOUR_IP:8123/api`
2. Check URL format: `ws://IP:8123/ws/spectacles/`
3. Ensure same WiFi network
4. Check firewall allows port 8123
5. **For real Spectacles, use network IP (not 127.0.0.1)**

### Issue: "No audio" or "Audio error"

**Fix:**
1. Check AudioComponent is connected
2. Verify backend returns audio URL in logs
3. Try: `curl http://YOUR_IP:8123/api/audio/test.mp3`

### Issue: Button doesn't respond

**Fix:**
1. Ensure Interactable component is on button
2. Check Logger for "Button ready: [action]"
3. Verify hand tracking is working in Preview

### Issue: Works in Preview, not on Device

**Fix:**
1. Change backendUrl to your network IP (not 127.0.0.1)
2. Get IP: Mac → `ifconfig en0` | Windows → `ipconfig`
3. Ensure Spectacles and computer on same WiFi

---

## Step 6: Full Button Layout (After Basic Test Works)

### Genre buttons - set action to:
- `"techno"` - Techno 128 BPM
- `"house"` - House 124 BPM
- `"funk"` - Funk 110 BPM
- `"jazz"` - Jazz 120 BPM
- `"dnb"` - Drum & Bass 174 BPM
- `"hiphop"` - Hip Hop 90 BPM
- `"trap"` - Trap 140 BPM
- `"electronic"` - Electronic 128 BPM
- `"chill"` - Chill 95 BPM

### Control buttons - set action to:
- `"random"` - Random genre
- `"next"` - Next genre
- `"prev"` - Previous genre
- `"stop"` - Stop playback
- `"regenerate"` - Same genre, new variation
- `"bpmUp"` - +5 BPM
- `"bpmDown"` - -5 BPM
- `"test"` - Debug connection

---

## Summary

**Before (Complex):**
- 5 scripts with circular dependencies
- Many inputs to configure
- Fragile global references

**After (Simple):**
- 2 scripts total
- PromptDJManager handles everything
- DJButtonSimple just calls methods
- Global reference is one-way (buttons → manager)

**Test Order:**
1. ✅ Backend running
2. ✅ Backend reachable (curl test)
3. ✅ Manager logs show all ✓ 
4. ✅ "Connected!" appears
5. ✅ Test button works
6. ✅ Play button generates music
7. ✅ Audio plays

**Start with the minimal 2-button setup. Only add more complexity once that works!**

