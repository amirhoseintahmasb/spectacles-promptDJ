# Fix: AudioLayerManager Setup Issues

## 🔴 Current Problems (From Your Screenshot)

1. **Error**: `Input _layer0 was not provided` - AudioLayerManager's layer inputs are not connected
2. **Wrong Connection**: `PromptDJController`'s `Dynamic Audio Output` is connected to `AudioLayerManager` (should be a `DynamicAudioOutput` script)
3. **Structure**: Audio objects are nested under AudioLayerManager (this is OK, but connections are missing)

---

## ✅ Step-by-Step Fix

### Step 1: Fix AudioLayerManager Layer Connections

1. **Select `TS AudioLayerManager`** in Scene Hierarchy
2. In the **Inspector** panel, you should see the `AudioLayerManager` script component
3. Find these input fields:
   - `_layer0`
   - `_layer1`
   - `_layer2`
   - `_layer3`

4. **For each input field**, connect the corresponding `DynamicAudioOutput` script:
   - `_layer0` → Drag **`Audio`** object's **`TS DynamicAudioOutput` script** into this field
   - `_layer1` → Drag **`Audio 1`** object's **`TS DynamicAudioOutput` script** into this field
   - `_layer2` → Drag **`Audio 2`** object's **`TS DynamicAudioOutput` script** into this field
   - `_layer3` → Drag **`Audio 3`** object's **`TS DynamicAudioOutput` script** into this field

   **How to find the script:**
   - Select `Audio` object → In Inspector, find `TS DynamicAudioOutput` component → Drag that component into `_layer0`
   - Repeat for `Audio 1`, `Audio 2`, `Audio 3`

### Step 2: Fix PromptDJController Connection

**IMPORTANT**: `PromptDJController` should NOT connect to `AudioLayerManager`. It should connect to a single `DynamicAudioOutput` OR you need to update the code to use AudioLayerManager.

**Option A: Keep Simple Setup (Recommended for Testing)**

1. **Select `TS PromptDJ_Manager`** (or wherever `PromptDJController` is)
2. In Inspector, find the **`Dynamic Audio Output`** input field
3. **Clear it** (remove `TS AudioLayerManager`)
4. Connect it to **`Audio`** object's **`TS DynamicAudioOutput` script** instead
   - Drag `Audio` → `TS DynamicAudioOutput` component into the `Dynamic Audio Output` field

**Option B: Use AudioLayerManager (Advanced)**

If you want to use AudioLayerManager, you need to update `PromptDJController.ts` code. See below.

---

## 🎯 Correct Setup Structure

### Scene Hierarchy (Current - OK):
```
Scene
└── TS PromptDJ_Manager
    └── TS AudioLayerManager
        ├── Audio (has TS DynamicAudioOutput script)
        ├── Audio 1 (has TS DynamicAudioOutput script)
        ├── Audio 2 (has TS DynamicAudioOutput script)
        └── Audio 3 (has TS DynamicAudioOutput script)
```

### Inspector Connections Needed:

**AudioLayerManager Inspector:**
- `_layer0` → `Audio`'s `TS DynamicAudioOutput` script ✅
- `_layer1` → `Audio 1`'s `TS DynamicAudioOutput` script ✅
- `_layer2` → `Audio 2`'s `TS DynamicAudioOutput` script ✅
- `_layer3` → `Audio 3`'s `TS DynamicAudioOutput` script ✅

**PromptDJController Inspector:**
- `Dynamic Audio Output` → `Audio`'s `TS DynamicAudioOutput` script ✅
  (NOT AudioLayerManager!)

---

## 🔍 How to Verify Each Audio Object Has DynamicAudioOutput

For each `Audio`, `Audio 1`, `Audio 2`, `Audio 3`:

1. Select the object in Scene Hierarchy
2. In Inspector, check:
   - ✅ Has `AudioComponent` component
   - ✅ Has `TS DynamicAudioOutput` script component
   - ✅ `TS DynamicAudioOutput` has `audioOutputTrack` connected to an Audio Output asset

If missing, add them:
- **Add AudioComponent**: Inspector → Add Component → Audio → Audio Component
- **Add DynamicAudioOutput**: Inspector → Add Component → Script → `TS DynamicAudioOutput`
- **Create Audio Output Asset**: Asset Browser → Right-click → Add New → Audio → Audio Output
- **Connect**: In `TS DynamicAudioOutput`, drag the Audio Output asset to `audioOutputTrack` field

---

## 🧪 After Fixing - Test

1. **Check Console** - Should see:
   ```
   [AudioLayerManager] Instance created
   [AudioLayerManager] Initializing layers...
   [AudioLayerManager] Layer 0 initialized @ 48000Hz
   [AudioLayerManager] Layer 1 initialized @ 48000Hz
   [AudioLayerManager] Layer 2 initialized @ 48000Hz
   [AudioLayerManager] Layer 3 initialized @ 48000Hz
   [AudioLayerManager] ═══ Ready with 4/4 layers ═══
   ```

2. **No more errors** - The `_layer0 was not provided` error should disappear

3. **Test audio playback** - Generate audio and it should play!

---

## 📝 Quick Checklist

- [ ] `AudioLayerManager` has all 4 layer inputs connected (`_layer0` through `_layer3`)
- [ ] Each `Audio` object has:
  - [ ] `AudioComponent` component
  - [ ] `TS DynamicAudioOutput` script
  - [ ] Audio Output asset connected to `audioOutputTrack`
- [ ] `PromptDJController`'s `Dynamic Audio Output` is connected to a `DynamicAudioOutput` script (NOT AudioLayerManager)
- [ ] Console shows no errors
- [ ] Console shows "Ready with 4/4 layers"

---

## 💡 If You Want to Use AudioLayerManager in Code

If you want `PromptDJController` to use `AudioLayerManager` instead of a single `DynamicAudioOutput`, you need to update the code. But for now, **just fix the connections above** and test with the simple setup first!

