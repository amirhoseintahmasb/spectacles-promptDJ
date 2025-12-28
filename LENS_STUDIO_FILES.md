# 📁 Files to Copy to Lens Studio

## ✅ Required Files (Copy These)

Copy these files from `spectacles-lens/Scripts/` to your Lens Studio project's `Assets/` folder:

### 1. **Main Controller** (Choose ONE)
- ✅ `PromptDJController.ts` ⭐ **Recommended** (TypeScript with type checking)
- OR `PromptDJController.js` (JavaScript version)

### 2. **UI Controller**
- ✅ `PromptDJUI.js` - Manages the DJ interface UI and genre selection

### 3. **Button Scripts**
- ✅ `DJButton.js` - Individual genre buttons (Techno, House, etc.)
- ✅ `DJControlButton.js` - Control buttons (Start, Stop, etc.)

---

## 📋 Optional Files

These are optional depending on your setup:

- `PromptDJButtons.js` / `PromptDJButtons.ts` - Alternative button handler (if not using DJButton.js)
- `PromptDJGenreButton.js` - Alternative genre button (if not using DJButton.js)
- `PinchGestureHandler.js` - Hand gesture detection (if you want pinch gestures)

---

## 🚀 Quick Copy Instructions

### Method 1: Copy via Finder

1. **Open Finder** and navigate to:
   ```
   ~/music-ai-service/spectacles-lens/Scripts/
   ```

2. **Copy these files:**
   - `PromptDJController.ts` ⭐
   - `PromptDJUI.js`
   - `DJButton.js`
   - `DJControlButton.js`

3. **In Lens Studio:**
   - Open your project
   - Go to **Assets** panel
   - Right-click → **Import** → Select the copied files
   - OR drag and drop the files into the Assets panel

### Method 2: Copy via Terminal

```bash
# Navigate to your Lens Studio project
cd ~/path/to/your/lens/studio/project

# Copy required files
cp ~/music-ai-service/spectacles-lens/Scripts/PromptDJController.ts Assets/
cp ~/music-ai-service/spectacles-lens/Scripts/PromptDJUI.js Assets/
cp ~/music-ai-service/spectacles-lens/Scripts/DJButton.js Assets/
cp ~/music-ai-service/spectacles-lens/Scripts/DJControlButton.js Assets/
```

---

## 📝 File Descriptions

| File | Purpose | Required? |
|------|---------|-----------|
| `PromptDJController.ts` | Main WebSocket controller, audio playback | ✅ **YES** |
| `PromptDJUI.js` | UI state management, genre selection | ✅ **YES** |
| `DJButton.js` | Genre button handler (Techno, House, etc.) | ✅ **YES** |
| `DJControlButton.js` | Control button handler (Start, Stop) | ✅ **YES** |
| `PromptDJButtons.js` | Alternative button handler | ❌ Optional |
| `PinchGestureHandler.js` | Hand gesture detection | ❌ Optional |

---

## 🎯 After Copying

1. **In Lens Studio**, drag `PromptDJController.ts` onto your main SceneObject (e.g., `PromptDJ_Manager`)

2. **Configure inputs** in Inspector:
   - `internetModule`: Drag InternetModule asset
   - `remoteMediaModule`: Drag RemoteMediaModule asset
   - `backendUrl`: `ws://127.0.0.1:8123/ws/spectacles/` (for Preview)
   - `audioPlayer`: Drag AudioComponent
   - Other inputs as needed

3. **Attach button scripts:**
   - Drag `DJButton.js` onto each genre button SceneObject
   - Drag `DJControlButton.js` onto control buttons
   - Connect them to `PromptDJUI` in Inspector

---

## ✅ Summary

**Minimum Required Files:**
1. `PromptDJController.ts` ⭐
2. `PromptDJUI.js`
3. `DJButton.js`
4. `DJControlButton.js`

**Total: 4 files**

---

**Location:** `~/music-ai-service/spectacles-lens/Scripts/`

