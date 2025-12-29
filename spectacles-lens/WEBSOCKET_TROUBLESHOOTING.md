# 🔌 WebSocket Connection Troubleshooting Guide

## Common WebSocket Connection Errors on Spectacles

### Error: "Cannot connect" or "Connection failed"

This guide helps you diagnose and fix WebSocket connection issues.

---

## ✅ Quick Checklist

Before troubleshooting, verify these basics:

- [ ] **Server is running**: `curl http://YOUR_IP:8123/api`
- [ ] **InternetModule added**: Asset Browser → + → Internet Module
- [ ] **InternetModule connected**: Drag to PromptDJController input
- [ ] **Backend URL correct**: `ws://YOUR_IP:8123/ws/spectacles/`
- [ ] **Same WiFi network**: Mac and Spectacles on same network
- [ ] **Firewall allows port 8123**: Check macOS firewall settings
- [ ] **Using network IP**: Not `127.0.0.1` for real Spectacles

---

## 🔍 Diagnostic Steps

### Step 1: Check Server Status

```bash
# Test if server is running
curl http://127.0.0.1:8123/api

# Should return JSON with service info
```

**If this fails:**
- Start the server: `uvicorn app:app --host 0.0.0.0 --port 8123`
- Check port 8123 is not in use: `lsof -i :8123`

### Step 2: Get Your Network IP

```bash
# macOS
ipconfig getifaddr en0

# Example output: 172.20.10.2
```

**Use this IP in your WebSocket URL:**
```
ws://172.20.10.2:8123/ws/spectacles/
```

### Step 3: Test WebSocket from Browser

Open in browser: `http://YOUR_IP:8123/ws/test`

This test page lets you verify WebSocket works before testing on Spectacles.

### Step 4: Check Lens Studio Logger

1. Open **Logger** panel in Lens Studio
2. Look for these messages:
   - `✓ WebSocket Connected!` - Success!
   - `✗ InternetModule not connected!` - Missing module
   - `✗ Failed to create WebSocket` - Connection issue
   - `Connection lost, code: 1006` - Network/server issue

### Step 5: Use Connection Test Method

In Lens Studio, you can call the test method:

```typescript
// From any script or console
if (global.promptDJController) {
    global.promptDJController.testConnection()
}
```

This will log detailed diagnostics to the Logger.

---

## 🐛 Common Errors and Solutions

### Error: "InternetModule not connected"

**Problem:** InternetModule asset not added or not connected.

**Solution:**
1. In Asset Browser, click **+** → **Internet Module**
2. Select `PromptDJ_Manager` object
3. In Inspector, find `PromptDJController` script
4. Drag InternetModule asset to **Internet Module** input

---

### Error: "Backend URL is empty"

**Problem:** Backend URL not set in Inspector.

**Solution:**
1. Select `PromptDJ_Manager` object
2. In Inspector, find `Backend Url` field
3. Set to: `ws://YOUR_IP:8123/ws/spectacles/`
   - Replace `YOUR_IP` with your Mac's network IP
   - Use `127.0.0.1` only for Lens Studio Preview

---

### Error: "Connection lost, code: 1006"

**Problem:** Abnormal closure - usually network or server issue.

**Solutions:**
1. **Check server is running:**
   ```bash
   curl http://YOUR_IP:8123/api
   ```

2. **Check firewall:**
   - macOS: System Settings → Network → Firewall
   - Allow port 8123 or disable firewall temporarily

3. **Check same network:**
   - Mac and Spectacles must be on same WiFi
   - Some networks block device-to-device communication

4. **Verify IP address:**
   ```bash
   ipconfig getifaddr en0
   ```
   Use this exact IP in WebSocket URL

---

### Error: "Invalid WebSocket URL format"

**Problem:** URL doesn't start with `ws://` or `wss://`.

**Solution:**
- Correct format: `ws://172.20.10.2:8123/ws/spectacles/`
- ❌ Wrong: `http://172.20.10.2:8123/ws/spectacles/`
- ❌ Wrong: `172.20.10.2:8123/ws/spectacles/`

---

### Error: "Using localhost - only works in Preview"

**Problem:** Using `127.0.0.1` or `localhost` on real Spectacles.

**Solution:**
- **Lens Studio Preview**: Use `ws://127.0.0.1:8123/ws/spectacles/`
- **Real Spectacles**: Use `ws://YOUR_NETWORK_IP:8123/ws/spectacles/`

Get network IP:
```bash
ipconfig getifaddr en0
```

---

### Error: "createWebSocket returned null"

**Problem:** InternetModule not properly configured.

**Solutions:**
1. Remove and re-add InternetModule asset
2. Disconnect and reconnect in Inspector
3. Restart Lens Studio
4. Check InternetModule is latest version

---

### Error: "Protocol error (1002)"

**Problem:** WebSocket protocol mismatch or invalid URL.

**Solutions:**
1. Check URL format: `ws://IP:PORT/ws/spectacles/`
2. Ensure no trailing slash issues
3. Verify server supports WebSocket (not just HTTP)
4. Check server logs for errors

---

### Error: "Connection lost, code: 1003"

**Problem:** Unsupported data format.

**Solutions:**
1. Check server is sending valid JSON
2. Verify message format matches expected protocol
3. Check server logs for parsing errors

---

## 🔧 Advanced Troubleshooting

### Test WebSocket Connection Manually

```python
# Python test script
import asyncio
import websockets

async def test():
    uri = "ws://YOUR_IP:8123/ws/spectacles/test-client"
    async with websockets.connect(uri) as ws:
        print("Connected!")
        msg = await ws.recv()
        print(f"Received: {msg}")

asyncio.run(test())
```

### Check Network Connectivity

```bash
# Ping test
ping YOUR_IP

# Port test
nc -zv YOUR_IP 8123

# Should show: Connection succeeded
```

### Check Server Logs

When connecting from Spectacles, check server terminal for:
- Connection attempts
- Error messages
- WebSocket handshake status

---

## 📋 Connection Test Checklist

Use this checklist when setting up:

1. **Server Setup:**
   - [ ] Server running: `uvicorn app:app --host 0.0.0.0 --port 8123`
   - [ ] Server accessible: `curl http://YOUR_IP:8123/api`
   - [ ] WebSocket test page works: `http://YOUR_IP:8123/ws/test`

2. **Lens Studio Setup:**
   - [ ] InternetModule asset created
   - [ ] InternetModule connected to PromptDJController
   - [ ] RemoteMediaModule asset created
   - [ ] RemoteMediaModule connected to PromptDJController
   - [ ] AudioComponent added to scene
   - [ ] AudioComponent connected to PromptDJController
   - [ ] Backend URL set correctly

3. **Network Setup:**
   - [ ] Mac and Spectacles on same WiFi
   - [ ] Firewall allows port 8123
   - [ ] Network IP obtained: `ipconfig getifaddr en0`
   - [ ] WebSocket URL uses network IP (not 127.0.0.1)

4. **Testing:**
   - [ ] Logger panel shows connection attempts
   - [ ] No error messages in Logger
   - [ ] Status text shows "Connected ✓"
   - [ ] Can send ping and receive pong

---

## 🆘 Still Not Working?

If you've tried everything:

1. **Check Lens Studio version compatibility**
   - Update Lens Studio to latest version
   - Check Spectacles firmware is up to date

2. **Try different network**
   - Use personal hotspot
   - Try different WiFi network
   - Some networks block device-to-device communication

3. **Check server configuration**
   - Verify `--host 0.0.0.0` (not `127.0.0.1`)
   - Check server logs for errors
   - Test with browser WebSocket test page

4. **Reset everything**
   - Restart Lens Studio
   - Restart server
   - Re-add InternetModule
   - Reconnect all inputs

5. **Get detailed logs**
   - Call `testConnection()` method
   - Check Logger panel for all messages
   - Share error messages for help

---

## 📞 Getting Help

When asking for help, include:

1. **Error message** from Logger
2. **WebSocket URL** you're using
3. **Server status**: `curl http://YOUR_IP:8123/api`
4. **Network IP**: `ipconfig getifaddr en0`
5. **Lens Studio version**
6. **Spectacles model and firmware**

---

*Last updated: Based on improved error handling and diagnostics*

