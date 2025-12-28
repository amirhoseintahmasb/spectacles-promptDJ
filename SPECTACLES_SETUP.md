# 🕶️ PromptDJ Spectacles Setup Guide

## ✅ What's Fixed

1. **WebSocket Connection (Error 1011)**: Fixed by:
   - Using network IP (`172.20.10.3`) instead of `127.0.0.1`
   - Server now binds to `0.0.0.0` to accept connections from all interfaces
   - Improved error handling to prevent crashes

2. **TypeScript Version**: Ready to use in Lens Studio

---

## 🚀 Quick Start

### 1. Start the Backend Server

```bash
cd ~/music-ai-service
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8123 --reload
```

**Or use the start script:**
```bash
cd ~/music-ai-service
./start.sh
```

### 2. Configure IP Address

**For Lens Studio Preview (local testing):**
- Default is `127.0.0.1` ✅ (already configured)
- No changes needed!

**For Real Spectacles Glasses:**
1. Find your Mac's IP:
   ```bash
   ipconfig getifaddr en0
   ```

2. Update in Lens Studio:
   - Select `PromptDJ_Manager` SceneObject
   - In Inspector, change `backendUrl` to: `ws://YOUR_IP:8123/ws/spectacles/`
   - Example: `ws://172.20.10.3:8123/ws/spectacles/`

3. Or set environment variable when starting server:
   ```bash
   export HOST_IP=172.20.10.3
   uvicorn app:app --host 0.0.0.0 --port 8123 --reload
   ```

---

## 📝 Using TypeScript in Lens Studio

### Option 1: Use the TypeScript File (Recommended)

1. **In Lens Studio**, open your project
2. **In the Assets panel**, find `PromptDJController.ts`
3. **Drag it** onto your `PromptDJ_Manager` SceneObject
4. **Lens Studio will automatically compile** TypeScript to JavaScript
5. **In the Inspector**, configure the inputs:
   - `internetModule`: Drag your InternetModule asset
   - `remoteMediaModule`: Drag your RemoteMediaModule asset
   - `backendUrl`: `ws://172.20.10.3:8123/ws/spectacles/` (or your Mac's IP)
   - `audioPlayer`: Drag your AudioComponent
   - `statusText`: (Optional) Text component for status display

### Option 2: Use the JavaScript File

1. **In Lens Studio**, find `PromptDJController.js`
2. **Drag it** onto your `PromptDJ_Manager` SceneObject
3. **Configure inputs** the same way as above

**Note**: TypeScript is recommended because:
- Better type checking
- Auto-completion in Lens Studio
- Easier to maintain

---

## 🔧 Configuration

### Default Settings

- **Lens Studio Preview**: Uses `127.0.0.1` (localhost) ✅
- **Real Spectacles**: Need network IP (e.g., `172.20.10.3`)

### Update Backend URL for Real Spectacles

1. Select `PromptDJ_Manager` SceneObject
2. In Inspector, find `PromptDJController` script
3. Change `backendUrl` from `ws://127.0.0.1:8123/ws/spectacles/` to `ws://YOUR_IP:8123/ws/spectacles/`

### Or Set via Environment Variable

```bash
export HOST_IP=172.20.10.3  # Your Mac's network IP
cd ~/music-ai-service
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8123 --reload
```

**Note**: Server always binds to `0.0.0.0` to accept connections from both localhost and network.

---

## 🐛 Troubleshooting

### Error 1011: WebSocket Connection Failed

**Causes:**
- Server not running
- Wrong IP address
- Server bound to `127.0.0.1` instead of `0.0.0.0`
- Network firewall blocking port 8123

**Solutions:**
1. Check server is running: `ps aux | grep uvicorn`
2. Verify IP: `ipconfig getifaddr en0`
3. Test connection: `curl http://YOUR_IP:8123/`
4. Make sure server uses `--host 0.0.0.0`

### SyncInteractionManager Warning

This is harmless. To disable:
1. In Lens Studio hierarchy, find `[OPTIONAL] Connected Lens`
2. Uncheck/disable it

### TypeScript Compilation Errors

If you see TypeScript errors:
1. Check Lens Studio console for specific errors
2. Make sure all imports are correct
3. Try using the JavaScript version instead

---

## ✅ Testing

### Test WebSocket Connection

```bash
cd ~/music-ai-service
source .venv/bin/activate
python3 << 'EOF'
import asyncio
import websockets
import json

async def test():
    uri = "ws://172.20.10.3:8123/ws/spectacles/test"
    async with websockets.connect(uri) as ws:
        msg = await ws.recv()
        print(f"✅ Connected: {json.loads(msg)['type']}")

asyncio.run(test())
EOF
```

### Test from Browser

Open: `http://172.20.10.3:8123/ws/test`

---

## 📊 Status Messages

When connected, you'll see:
- `PromptDJ: Connected!` ✅
- `PromptDJ Status: Connected ✓` ✅
- `PromptDJ: Audio ready!` ✅
- `PromptDJ Status: Playing ♪` ✅

---

## 🎵 Available Actions

- `generate_melody` - Generate melody only
- `generate_drums` - Generate drums only
- `generate_both` - Generate melody + drums (recommended)
- `update_params` - Update tempo, scale, etc.
- `ping` - Test connection

---

## 🔗 Files

- **Backend**: `app.py` (FastAPI server)
- **TypeScript**: `spectacles-lens/Scripts/PromptDJController.ts`
- **JavaScript**: `spectacles-lens/Scripts/PromptDJController.js`
- **UI Controller**: `spectacles-lens/Scripts/PromptDJUI.js`
- **Buttons**: `spectacles-lens/Scripts/DJButton.js`, `DJControlButton.js`

---

## 📝 Next Steps

1. ✅ Server is running on `0.0.0.0:8123`
2. ✅ TypeScript file is ready
3. ✅ Network IP is configured
4. 🎯 **Open Lens Studio and use `PromptDJController.ts`**
5. 🎯 **Connect your Spectacles and test!**

---

**Need help?** Check the server logs:
```bash
tail -f /tmp/promptdj_server.log
```

