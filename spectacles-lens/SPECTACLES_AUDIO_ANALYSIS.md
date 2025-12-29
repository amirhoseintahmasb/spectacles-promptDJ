# 🔍 Spectacles Audio Playback Analysis

## Problem: Audio Works in Lens Studio Preview but Not on Real Spectacles

Based on analysis of [MiNiMIDI_LYRIA](https://github.com/urbanpeppermint/MiNiMIDI_LYRIA) project, here are the key differences and solutions.

---

## 🔑 Key Finding: Two Different Audio Approaches

### Approach 1: AudioComponent + RemoteMediaModule (Our Current)
```typescript
// What we're using
remoteMediaModule.loadResourceAsAudioTrackAsset(resource, onSuccess, onError)
audioComponent.audioTrack = audioTrack
audioComponent.play(1)
```

**Issues:**
- ❌ Works in Preview but unreliable on real Spectacles
- ❌ Can cause crashes
- ❌ "Attempted operation on null object" errors
- ❌ Audio track assignment timing issues

### Approach 2: DynamicAudioOutput (MiNiMIDI_LYRIA)
```typescript
// What MiNiMIDI_LYRIA uses
import { DynamicAudioOutput } from "RemoteServiceGateway.lspkg/Helpers/DynamicAudioOutput"

dynamicAudioOutput.initialize(48000)
dynamicAudioOutput.interruptAudioOutput()
dynamicAudioOutput.addAudioFrame(audioData, 2)
```

**Advantages:**
- ✅ More reliable on real Spectacles
- ✅ Direct PCM data control
- ✅ Better for real-time audio
- ✅ Used by production Spectacles apps

---

## 🐛 Why Our Approach Fails on Real Spectacles

### Issue 1: AudioComponent Timing
- `AudioComponent` requires proper initialization sequence
- Real Spectacles have stricter validation
- Delayed callbacks can cause null object errors

### Issue 2: RemoteMediaModule Limitations
- `loadResourceAsAudioTrackAsset` may not work reliably on real devices
- Network loading can timeout or fail silently
- AudioTrackAsset may not be properly assigned

### Issue 3: Missing Error Handling
- No fallback mechanism
- Crashes instead of graceful degradation
- No retry logic for network issues

---

## ✅ Solution: Hybrid Approach

### Option A: Switch to DynamicAudioOutput (Recommended)

**Pros:**
- More reliable on real Spectacles
- Better performance
- Direct control over audio data

**Cons:**
- Requires RemoteServiceGateway package
- Need to fetch audio as raw data
- More complex implementation

### Option B: Improve Current Approach

**Pros:**
- No new dependencies
- Simpler to implement
- Works in Preview

**Cons:**
- May still have issues on real Spectacles
- Requires careful timing

### Option C: Hybrid (Best of Both)

**Use DynamicAudioOutput if available, fallback to AudioComponent**

---

## 🔧 Implementation Strategy

### Step 1: Add DynamicAudioOutput Support

1. Check if `RemoteServiceGateway` is available
2. If yes, use `DynamicAudioOutput`
3. If no, fallback to `AudioComponent`

### Step 2: Improve Error Handling

1. Add retry logic
2. Better null checks
3. Graceful degradation
4. Detailed logging

### Step 3: Audio Format Optimization

1. Ensure MP3 format (not WAV)
2. Mono channel (not stereo)
3. Under 15 seconds duration
4. Proper sample rate (48kHz)

---

## 📋 Critical Requirements for Spectacles Audio

Based on MiNiMIDI_LYRIA and Snap documentation:

| Requirement | Value | Why |
|-------------|-------|-----|
| **Sample Rate** | 48kHz | Spectacles standard |
| **Format** | MP3 (mono) | Best compatibility |
| **Duration** | < 15 seconds | Optimal performance |
| **Channels** | Mono (1) | Smaller files, faster |
| **Method** | DynamicAudioOutput | More reliable |

---

## 🚨 Common Crash Causes

### 1. Null Object Errors
**Cause:** AudioComponent or AudioTrack becomes null between assignment and playback

**Fix:** Store references, validate before use

### 2. Network Timeouts
**Cause:** Audio file takes too long to load

**Fix:** Add timeout, retry logic, smaller files

### 3. Too Many Concurrent Tracks
**Cause:** Exceeding 16 track limit

**Fix:** Stop previous tracks before loading new ones

### 4. Wrong Audio Format
**Cause:** WAV instead of MP3, stereo instead of mono

**Fix:** Convert to MP3 mono on server side

---

## 🎯 Recommended Fix

### Immediate: Improve Current Approach

1. ✅ Better null checks (already done)
2. ✅ Store references (already done)
3. ✅ Retry logic (already done)
4. ⚠️ Add timeout handling
5. ⚠️ Ensure MP3 format from server

### Long-term: Migrate to DynamicAudioOutput

1. Add RemoteServiceGateway support
2. Implement DynamicAudioOutput manager
3. Fallback to AudioComponent if not available
4. Test on real Spectacles

---

## 📊 Comparison Table

| Feature | AudioComponent | DynamicAudioOutput |
|---------|----------------|-------------------|
| **Preview** | ✅ Works | ✅ Works |
| **Real Spectacles** | ⚠️ Unreliable | ✅ Reliable |
| **Complexity** | Simple | Medium |
| **Control** | Limited | Full PCM control |
| **Performance** | Good | Better |
| **Dependencies** | Built-in | RemoteServiceGateway |

---

## 🔍 Debugging Checklist

When audio doesn't work on real Spectacles:

- [ ] Check Logger for errors
- [ ] Verify audio format (MP3, mono)
- [ ] Check file size (< 2MB recommended)
- [ ] Verify network connection
- [ ] Check if AudioComponent is enabled
- [ ] Verify RemoteMediaModule is connected
- [ ] Check for null object errors
- [ ] Verify audio URL is accessible
- [ ] Check server CORS headers
- [ ] Test with DynamicAudioOutput if available

---

## 📚 References

- [MiNiMIDI_LYRIA Project](https://github.com/urbanpeppermint/MiNiMIDI_LYRIA) - Working Spectacles audio implementation
- [Snap Spectacles Audio Docs](https://developers.snap.com/spectacles/) - Official documentation
- RemoteServiceGateway.lspkg - Lens Studio package for DynamicAudioOutput

---

*Last updated: Based on MiNiMIDI_LYRIA analysis*

