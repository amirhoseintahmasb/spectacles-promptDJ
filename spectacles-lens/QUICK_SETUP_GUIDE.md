# Quick Setup Guide - AudioLayerManager & DynamicAudioOutput

## What Changed?

### ✅ Files Created/Modified:

1. **`AudioLayerManager.ts`** (NEW)
   - Manages multiple audio layers
   - Located in: `spectacles-lens/Scripts/` and `spectacles-lens/Assets/`

2. **`DynamicAudioOutput.ts`** (ENHANCED)
   - Added new methods: `interruptAudioOutput()`, `setVolume()`, `getVolume()`, `getSampleRate()`, `isReady()`
   - Located in: `spectacles-lens/Scripts/` and `spectacles-lens/Assets/`

3. **`AUDIO_LAYER_MANAGER_SETUP.md`** (NEW)
   - Full documentation for AudioLayerManager

---

## Option 1: Keep Using Single DynamicAudioOutput (SIMPLEST - Works Now)

**If you just want to test the current setup, you DON'T need to change anything!**

Your current setup should work:
- `PromptDJController` already uses a single `DynamicAudioOutput`
- The enhanced methods are available but optional

### Current Setup (No Changes Needed):
1. ✅ You already have a SceneObject with `DynamicAudioOutput` script
2. ✅ You already have an `AudioComponent` on that SceneObject
3. ✅ You already have an Audio Output asset connected
4. ✅ `PromptDJController` already connects to it via the `dynamicAudioOutput` input

**Just test it - it should work!**

---

## Option 2: Use AudioLayerManager (ADVANCED - For Multiple Audio Layers)

**Use this if you want to play multiple audio sources simultaneously (melody + drums separately, etc.)**

### Step-by-Step Setup:

#### Step 1: Create Audio Layer Objects

1. In Lens Studio, right-click in **Scene Hierarchy**
2. **Add New Object** → **Empty Object**
3. Name it `AudioLayer0`
4. Repeat 3 more times: `AudioLayer1`, `AudioLayer2`, `AudioLayer3`

#### Step 2: Configure Each AudioLayer

For **each** AudioLayer object (0, 1, 2, 3):

**A. Add AudioComponent:**
- Select the AudioLayer object
- In Inspector, click **Add Component** → **Audio** → **Audio Component**

**B. Create Audio Output Asset:**
- In Asset Browser, right-click → **Add New** → **Audio** → **Audio Output**
- Name it `AudioOutput0` (or `AudioOutput1`, `AudioOutput2`, `AudioOutput3`)

**C. Add DynamicAudioOutput Script:**
- Select the AudioLayer object
- In Inspector, click **Add Component** → **Script**
- Choose `DynamicAudioOutput.ts` from Assets
- Connect the Audio Output asset to the `audioOutputTrack` input field

#### Step 3: Create AudioLayerManager Object

1. Create a new empty SceneObject named `AudioLayerManager`
2. Add the `AudioLayerManager.ts` script:
   - Select `AudioLayerManager` object
   - In Inspector, click **Add Component** → **Script**
   - Choose `AudioLayerManager.ts` from Assets

3. Connect the 4 AudioLayer objects:
   - In `AudioLayerManager` Inspector, find the layer inputs:
     - `_layer0` → Drag `AudioLayer0`'s **DynamicAudioOutput script** here
     - `_layer1` → Drag `AudioLayer1`'s **DynamicAudioOutput script** here
     - `_layer2` → Drag `AudioLayer2`'s **DynamicAudioOutput script** here
     - `_layer3` → Drag `AudioLayer3`'s **DynamicAudioOutput script** here

#### Step 4: (Optional) Update PromptDJController to Use AudioLayerManager

If you want to use AudioLayerManager instead of the single DynamicAudioOutput:

1. Open `PromptDJController.ts`
2. Add import at top:
```typescript
import { AudioLayerManager } from "./AudioLayerManager"
```

3. In `playPCM16Audio()` method, replace the DynamicAudioOutput code with:
```typescript
private playPCM16Audio(data: AudioReadyMessage): void {
    if (!data.audio_base64) {
        log.e("No audio_base64 data received")
        return
    }
    
    const audioManager = AudioLayerManager.getInstance()
    if (!audioManager) {
        log.e("AudioLayerManager not found!")
        return
    }
    
    // Decode base64 to Uint8Array
    const audioData = Base64.decode(data.audio_base64)
    const channels = data.channels || 1
    
    // Play on "combined" layer (or use "melody", "drums", etc.)
    audioManager.playCombined(audioData, channels)
    
    this.isPlaying = true
    this.updateStatusText("Playing ♪")
    log.i("Playing via AudioLayerManager")
}
```

---

## Testing Steps

### Test Option 1 (Single DynamicAudioOutput - Current Setup):

1. ✅ Make sure your server is running:
   ```bash
   cd /Users/amirhoseintahmasb/music-ai-service
   ./start.sh
   ```

2. ✅ In Lens Studio:
   - Open your lens project
   - Make sure `PromptDJController` has `dynamicAudioOutput` connected
   - Make sure the `DynamicAudioOutput` SceneObject has:
     - ✅ `AudioComponent` component
     - ✅ `DynamicAudioOutput` script
     - ✅ Audio Output asset connected to `audioOutputTrack`

3. ✅ Test in Lens Studio Preview or on Spectacles:
   - Connect to your backend
   - Generate audio (melody/drums/both)
   - Audio should play!

### Test Option 2 (AudioLayerManager):

1. ✅ Complete all setup steps above
2. ✅ In Lens Studio, check console for:
   ```
   [AudioLayerManager] Instance created
   [AudioLayerManager] Initializing layers...
   [AudioLayerManager] Layer 0 initialized @ 48000Hz
   [AudioLayerManager] Layer 1 initialized @ 48000Hz
   ...
   [AudioLayerManager] ═══ Ready with 4/4 layers ═══
   ```

3. ✅ Test playback:
   - Generate audio
   - Check console for:
   ```
   [AudioLayerManager] ✓ Acquired layer 0 for "combined"
   [AudioLayerManager] ▶ Playing on layer 0 (combined) - 2.5s @ 100%
   ```

4. ✅ Test status logging:
   - In code, call: `AudioLayerManager.getInstance()?.logLayerStatus()`
   - Should print layer status table

---

## Troubleshooting

### "DynamicAudioOutput not connected!"
- Make sure you dragged the `DynamicAudioOutput` script into `PromptDJController`'s `dynamicAudioOutput` input field

### "No AudioComponent found"
- Add an `AudioComponent` to the same SceneObject as `DynamicAudioOutput`

### "AudioLayerManager not found!"
- Make sure `AudioLayerManager` SceneObject exists and has the script
- Make sure it's initialized (check console for "Ready with X/4 layers")

### "No available layers!"
- All 4 layers are in use
- Call `releaseAllLayers()` or `releaseLayerByOwner("ownerId")` to free layers

### Audio not playing
- Check that `AudioComponent` is playing: `audComponent.isPlaying()` should be `true`
- Check volume: `audComponent.volume` should be `1.0`
- Check console for errors

---

## Recommended: Start with Option 1

**For now, just test Option 1 (single DynamicAudioOutput) - it should work immediately!**

You can add AudioLayerManager later if you need multiple simultaneous audio layers.

