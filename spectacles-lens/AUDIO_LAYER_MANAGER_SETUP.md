# AudioLayerManager Setup Guide

## Overview

The `AudioLayerManager` is a singleton component that manages multiple `DynamicAudioOutput` layers for PromptDJ. It provides:

- **Dynamic layer allocation** - Acquire/release audio layers as needed
- **Owner-based tracking** - Track which component owns each layer (melody, drums, combined)
- **Volume control with debouncing** - Smooth volume changes without audio glitches
- **Convenience methods** - Simple API for playing melody, drums, or combined audio

## Setup in Lens Studio

### Step 1: Create Audio Layer Objects

Create 4 SceneObjects for the audio layers:

1. Right-click in Scene Hierarchy → **Add New Object** → **Empty Object**
2. Name it `AudioLayer0`
3. Repeat for `AudioLayer1`, `AudioLayer2`, `AudioLayer3`

### Step 2: Configure Each Audio Layer

For each AudioLayer object:

1. **Add AudioComponent**
   - Select the AudioLayer object
   - In Inspector, click **Add Component** → **Audio** → **Audio Component**

2. **Create Audio Output Asset**
   - In Asset Browser, right-click → **Add New** → **Audio** → **Audio Output**
   - Name it `AudioOutput0` (or 1, 2, 3)

3. **Add DynamicAudioOutput Script**
   - Select the AudioLayer object
   - In Inspector, click **Add Component** → **Script**
   - Choose `DynamicAudioOutput.ts`
   - Connect the Audio Output asset to the `audioOutputTrack` input

### Step 3: Create AudioLayerManager

1. Create a new empty SceneObject named `AudioLayerManager`
2. Add the `AudioLayerManager.ts` script
3. Connect the 4 AudioLayer objects to the layer inputs:
   - `_layer0` → AudioLayer0's DynamicAudioOutput script
   - `_layer1` → AudioLayer1's DynamicAudioOutput script
   - `_layer2` → AudioLayer2's DynamicAudioOutput script
   - `_layer3` → AudioLayer3's DynamicAudioOutput script

### Step 4: Update PromptDJController

In `PromptDJController.ts`, you can now use the AudioLayerManager instead of a single DynamicAudioOutput:

```typescript
// Get the manager
const audioManager = AudioLayerManager.getInstance();

// Play combined audio
audioManager?.playCombined(audioData, 1);

// Or acquire a specific layer
const layerIdx = audioManager?.acquireLayer("myCustomAudio");
if (layerIdx >= 0) {
    audioManager?.playOnLayer(layerIdx, audioData, 1);
}

// Set volume
audioManager?.setCombinedVolume(0.8);

// Release when done
audioManager?.releaseLayerByOwner("myCustomAudio");
```

## API Reference

### Layer Acquisition

| Method | Description |
|--------|-------------|
| `acquireLayer(ownerId)` | Acquire a layer for an owner. Returns layer index or -1 |
| `releaseLayerByOwner(ownerId)` | Release a layer by owner ID |
| `releaseLayer(index)` | Release a layer by index |
| `releaseAllLayers()` | Release all layers |
| `getLayerForOwner(ownerId)` | Get layer index for an owner (-1 if not found) |

### Playback Control

| Method | Description |
|--------|-------------|
| `playOnLayer(index, audioData, channels)` | Play audio on a specific layer |
| `playBase64OnLayer(index, base64Audio, channels)` | Play base64-encoded audio |
| `stopLayer(index)` | Stop a specific layer |
| `stopLayerByOwner(ownerId)` | Stop layer by owner |
| `stopAll()` | Stop all layers |

### Convenience Methods (PromptDJ-specific)

| Method | Description |
|--------|-------------|
| `playMelody(audioData, channels)` | Play melody (auto-acquires layer) |
| `playDrums(audioData, channels)` | Play drums (auto-acquires layer) |
| `playCombined(audioData, channels)` | Play combined audio |
| `stopMelody()` / `stopDrums()` / `stopCombined()` | Stop specific audio |
| `setMelodyVolume(volume)` | Set melody volume (0-1) |
| `setDrumsVolume(volume)` | Set drums volume (0-1) |
| `setCombinedVolume(volume)` | Set combined volume (0-1) |

### Volume Control

| Method | Description |
|--------|-------------|
| `setLayerVolume(index, volume)` | Set layer volume (0-1, debounced) |
| `setVolumeByOwner(ownerId, volume)` | Set volume by owner |
| `getLayerVolume(index)` | Get layer volume |
| `getVolumeByOwner(ownerId)` | Get volume by owner |

### Status

| Method | Description |
|--------|-------------|
| `isReady()` | Check if manager is initialized |
| `isLayerInUse(index)` | Check if layer is in use |
| `hasAudioData(index)` | Check if layer has audio data |
| `getActiveLayerCount()` | Get number of active layers |
| `getAvailableLayerCount()` | Get number of available layers |
| `getTotalLayerCount()` | Get total layer count (4) |
| `getLayerOwner(index)` | Get owner of a layer |
| `hasOwner(ownerId)` | Check if owner has a layer |
| `logLayerStatus()` | Print layer status to console |

## Scene Hierarchy Example

```
Scene
├── Camera
├── PromptDJController
│   └── (PromptDJController.ts)
├── AudioLayerManager
│   └── (AudioLayerManager.ts)
├── AudioLayer0
│   ├── AudioComponent
│   └── (DynamicAudioOutput.ts) → AudioOutput0
├── AudioLayer1
│   ├── AudioComponent
│   └── (DynamicAudioOutput.ts) → AudioOutput1
├── AudioLayer2
│   ├── AudioComponent
│   └── (DynamicAudioOutput.ts) → AudioOutput2
└── AudioLayer3
    ├── AudioComponent
    └── (DynamicAudioOutput.ts) → AudioOutput3
```

## Debugging

Call `logLayerStatus()` to see the current state of all layers:

```
[AudioLayerManager] ═══════════════════════════════════════
[AudioLayerManager]          LAYER STATUS                  
[AudioLayerManager] ═══════════════════════════════════════
  Layer 0: ✓ 🔊 IN USE | Owner: combined   | Vol: 100% 📀
  Layer 1: ✓ ⚪ FREE   | Owner: -          | Vol: 100%   
  Layer 2: ✓ ⚪ FREE   | Owner: -          | Vol: 100%   
  Layer 3: ✓ ⚪ FREE   | Owner: -          | Vol: 100%   
[AudioLayerManager] ───────────────────────────────────────
[AudioLayerManager] Active: 1 | Available: 3 | Total: 4
[AudioLayerManager] ═══════════════════════════════════════
```

