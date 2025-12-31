# Quick Start Guide - Simplified PromptDJ

## ✅ What's New

**Simplified from 5+ scripts to just 2:**
- `PromptDJManager.ts` - Everything in one place
- `DJButtonSimple.ts` - Simple button handler

## 🚀 5-Minute Setup

### 1. Start Backend Server

```bash
cd /Users/amirhoseintahmasb/music-ai-service
./start.sh
```

Verify it's running:
```bash
curl http://127.0.0.1:8123/api
# Should return: {"status":"PromptDJ API running","version":"1.0"}
```

### 2. Get Your Network IP (for Real Spectacles)

**Mac:**
```bash
ifconfig en0 | grep "inet " | awk '{print $2}'
# Or: ifconfig en1 | grep "inet " | awk '{print $2}'
```

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your WiFi adapter
```

**Current detected IP:** `172.20.10.3` (update in Lens Studio if different)

### 3. Lens Studio Setup

#### A. Create Manager Object
1. Hierarchy → Right-click → Create Empty
2. Rename: `PromptDJManager`
3. Add Component → Script → `PromptDJManager.ts`
4. Add Component → Audio → `AudioComponent`

#### B. Add Required Assets
1. Asset Browser (Ctrl+Shift+A)
2. Search `InternetModule` → Add to Assets
3. Search `RemoteMediaModule` → Add to Assets
4. Drag `InternetModule` → Script's "Internet Module" input
5. Drag `RemoteMediaModule` → Script's "Remote Media Module" input
6. Drag `AudioComponent` → Script's "Audio Player" input

#### C. Set Backend URL

**For Lens Studio Preview:**
```
ws://127.0.0.1:8123/ws/spectacles/
```

**For Real Spectacles:**
```
ws://172.20.10.3:8123/ws/spectacles/
```
*(Replace with your actual network IP)*

#### D. Create Test Button
1. Hierarchy → Right-click → Create Empty
2. Rename: `TestButton`
3. Add Component → Interaction → `Interactable`
4. Add Component → Script → `DJButtonSimple.ts`
5. Set `action` input to: `"test"`

#### E. Create Play Button
1. Hierarchy → Right-click → Create Empty
2. Rename: `PlayButton`
3. Add Component → Interaction → `Interactable`
4. Add Component → Script → `DJButtonSimple.ts`
5. Set `action` input to: `"random"`

### 4. Test in Preview

1. Press **Play** in Lens Studio
2. Check **Logger** panel (View → Logger)
3. Look for:
   ```
   [PromptDJManager] ✓ InternetModule connected
   [PromptDJManager] ✓ RemoteMediaModule connected
   [PromptDJManager] ✓ AudioComponent connected
   [PromptDJManager] ✓ Connected!
   ```
4. Click **TestButton** → Should show connection test
5. Click **PlayButton** → Should generate and play music!

### 5. Deploy to Spectacles

1. **Change Backend URL** to your network IP (not 127.0.0.1)
2. File → Publish → Spectacles
3. Test on device

---

## 🎛️ Available Button Actions

### Genre Buttons
Set `action` to:
- `"techno"` - Techno (128 BPM)
- `"house"` - House (124 BPM)
- `"funk"` - Funk (110 BPM)
- `"jazz"` - Jazz (120 BPM)
- `"dnb"` - Drum & Bass (174 BPM)
- `"hiphop"` - Hip Hop (90 BPM)
- `"trap"` - Trap (140 BPM)
- `"electronic"` - Electronic (128 BPM)
- `"chill"` - Chill (95 BPM)

### Control Buttons
Set `action` to:
- `"random"` - Random genre
- `"next"` - Next genre
- `"prev"` - Previous genre
- `"stop"` - Stop playback
- `"regenerate"` - Same genre, new variation
- `"bpmUp"` - Increase BPM by 5
- `"bpmDown"` - Decrease BPM by 5
- `"test"` - Test connection

---

## 🔧 Troubleshooting

### "InternetModule NOT connected!"
→ Asset Browser → Search "InternetModule" → Add → Drag to script

### "Connection error"
→ Check:
1. Backend running? `curl http://YOUR_IP:8123/api`
2. Correct URL? `ws://IP:8123/ws/spectacles/`
3. Same WiFi network?
4. Firewall allows port 8123?

### "No audio"
→ Check:
1. AudioComponent connected?
2. Backend logs show audio URL?
3. Try: `curl http://YOUR_IP:8123/api/audio/test.mp3`

### Works in Preview, not on Device
→ **Change backendUrl to network IP (not 127.0.0.1)**

---

## 📁 File Structure

```
spectacles-lens/
├── Scripts/
│   ├── PromptDJManager.ts    ← Main manager (all-in-one)
│   └── DJButtonSimple.ts      ← Simple button handler
├── SIMPLIFIED_SETUP.md        ← Detailed setup guide
└── QUICK_START.md            ← This file
```

---

## 🎯 Next Steps

1. ✅ Test with 2 buttons (test + play)
2. ✅ Add more genre buttons
3. ✅ Add control buttons (next, prev, stop)
4. ✅ Customize UI text components (optional)

**Start simple, add complexity only after basic test works!**

