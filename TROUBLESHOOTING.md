# ClipForge Troubleshooting Guide

## Installation Issues

### Issue: "npm install" fails
**Solutions:**
```bash
# Clear cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still fails, use specific version
npm install --legacy-peer-deps
```

### Issue: FFmpeg not found
**macOS:**
```bash
brew install ffmpeg
brew install ffprobe
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**Windows (PowerShell as Admin):**
```powershell
choco install ffmpeg
# Or download from https://ffmpeg.org/download.html
```

**Verify installation:**
```bash
ffmpeg -version
ffprobe -version
```

### Issue: yt-dlp not found
```bash
pip install yt-dlp
# or
brew install yt-dlp  # macOS
```

---

## Runtime Issues

### Issue: Port 1111 or 3000 already in use

**Find process using port:**
```bash
# macOS/Linux
lsof -i :1111
lsof -i :3000

# Windows (PowerShell as Admin)
netstat -ano | findstr :1111
netstat -ano | findstr :3000
```

**Kill process:**
```bash
# macOS/Linux
kill -9 <PID>

# Windows (PowerShell as Admin)
taskkill /PID <PID> /F
```

**Or use different ports:**
- Edit `vite.config.ts`: change `port: 1111`
- Edit `server/index.js`: change `PORT = 3001`

### Issue: Cannot connect to backend from frontend

**Check if backend is running:**
```bash
curl http://localhost:3000/api/health
```

Should return: `{"status":"ok","timestamp":"..."}`

**Fix proxy in vite.config.ts:**
```javascript
server: {
  port: 1111,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    },
    '/ws': {
      target: 'ws://localhost:3000',
      ws: true
    }
  }
}
```

**If using different machine:**
```javascript
// Frontend vite.config.ts
proxy: {
  '/api': {
    target: 'http://192.168.1.100:3000',  // Your backend IP
    changeOrigin: true
  }
}
```

### Issue: WebSocket connection fails

**Check WebSocket server is running:**
```bash
# Check if server started properly
npm run server:dev

# Look for error logs
```

**Firewall issue:**
- Ensure port 3000 is open
- Check firewall rules
- For production, use HTTPS/WSS

**On macOS (if needed):**
```bash
# Allow node through firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setblockall off
```

---

## Processing Issues

### Issue: "File too large"

**Limit in server/index.js:**
```javascript
// Default: 10GB
limits: { fileSize: 10 * 1024 * 1024 * 1024 }

// Increase to 50GB
limits: { fileSize: 50 * 1024 * 1024 * 1024 }
```

**Or process shorter segments**

### Issue: Out of memory during processing

**Increase Node.js memory:**
```bash
# 4GB
node --max-old-space-size=4096 server/index.js

# 8GB
node --max-old-space-size=8192 server/index.js

# Or in npm script (package.json)
"server": "node --max-old-space-size=8192 server/index.js"
```

**Or reduce video size:**
- Use `medium` quality preset
- Disable subtitles
- Process shorter clips

### Issue: Transcription fails / no audio detected

**Check audio quality:**
- Ensure source has audio track
- Audio should be > 16kHz, mono or stereo
- Try with OpenAI Whisper (better quality):

```bash
# Edit .env
OPENAI_API_KEY=sk-...
USE_LOCAL_WHISPER=false
```

**Test transcription directly:**
```bash
# Extract audio first
ffmpeg -i video.mp4 -q:a 9 -id3v2_version 4 -write_id3v1 0 audio.wav

# If using Ollama:
curl -X POST http://localhost:11434/api/transcribe \
  -H "Content-Type: application/json" \
  -d '{"audio":"<base64>"}'
```

### Issue: AI analysis fails / no moments detected

**Check API keys:**
```bash
# In .env file
ANTHROPIC_API_KEY=sk-ant-...  # For Claude
OPENAI_API_KEY=sk-...          # For GPT
```

**Test API directly:**
```bash
# Claude
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-sonnet-20240229","max_tokens":100,"messages":[{"role":"user","content":"test"}]}'
```

**If no API key available:**
- Uses heuristic fallback (exclamation marks, long thoughts)
- Quality will be lower but app still works

### Issue: No clips detected

**Reasons:**
1. Transcript is empty → Audio quality issue
2. Transcript too short → Video too short
3. API failed → Check API keys
4. Heuristic fallback triggered → Check logs

**Fix:**
```bash
# Check logs in browser console or server output
# Look for errors starting with "ERROR:"

# Try with explicit API key
ANTHROPIC_API_KEY=sk-ant-... npm run server:dev

# Test with simpler video first
# Videos with clear speech work best
```

### Issue: FFmpeg errors during extraction

**Check FFmpeg installation:**
```bash
ffmpeg -codecs | grep h264
ffmpeg -codecs | grep aac
```

**Common codec issues:**
```bash
# Install additional codecs (macOS)
brew install ffmpeg --with-libvpx --with-libvorbis

# Or use precompiled ffmpeg-full
brew tap homebrew-ffmpeg/ffmpeg
brew install homebrew-ffmpeg/ffmpeg/ffmpeg --with-libvpx
```

**Check video compatibility:**
```bash
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name input.mp4
```

---

## Export Issues

### Issue: Export takes too long

**Reduce quality:**
```
Export settings → Quality Preset: Low
```

**Disable features:**
- Disable subtitles
- Use "None" transition
- Lower FPS to 24

**Use batch mode:**
- Export one format at a time
- Process overnight

### Issue: Downloaded file corrupted

**Check file size:**
```bash
# Should be several MB
ls -lh downloads/
```

**Try re-export:**
- Use different quality preset
- Try lower FPS (24 instead of 30)

**Check disk space:**
```bash
# macOS/Linux
df -h

# Windows
diskutil list
```

### Issue: Captions not appearing in exported video

**Check SRT file generation:**
```bash
# Captions should be in response
# Check server logs for caption encoding
```

**Try different subtitle style:**
- Settings: Caption Style
- Different styles may work better with your encoder

**Force re-process:**
```bash
# Delete export cache and try again
rm -rf clips/
npm run dev
```

---

## UI/UX Issues

### Issue: Upload button not responding

**Check browser console for errors:**
- Open DevTools (F12)
- Check Console tab
- Look for red error messages

**Common issues:**
```javascript
// Port mismatch
// Should see: http://localhost:3000/api/upload
// If getting 404, backend not running

// CORS error
// Check server/index.js has CORS enabled
app.use(cors());
```

**Fix:**
```bash
# Restart both servers
npm run dev
npm run server:dev
```

### Issue: Video player shows black screen

**Check video path:**
- Uploaded file should be in `/uploads/`
- Path should be accessible via `/uploads/{filename}`

**Try opening in separate tab:**
```
http://localhost:1111/uploads/your-video.mp4
```

**Check browser support:**
- Ensure MP4/H.264 support (most browsers have it)
- Try different video format (WebM, MOV)

### Issue: Progress bars not updating

**WebSocket not connected:**
```javascript
// Check browser DevTools → Network → WS
// Should see ws:// connection
```

**Fix:**
```bash
# Restart servers
npm run dev
npm run server:dev

# Check for firewall blocks
```

### Issue: Buttons disabled/grayed out

**Check app state:**
- Have you selected clips to export?
- Have you chosen at least one export format?

**Requirements:**
- Export button: Need ≥1 selected clip
- Start Export button: Need ≥1 format selected

---

## Performance Issues

### Issue: App feels slow

**Check browser:**
```bash
# Open DevTools → Performance
# Click record
# Do action
# Click stop
# Look for slow operations
```

**Reduce load:**
- Don't process videos >2GB
- Close other apps
- Use "low" quality preset

**Increase resources:**
```bash
# Give Node more memory
node --max-old-space-size=8192 server/index.js
```

### Issue: Video upload slow

**Check:**
- Network speed: `speedtest.net`
- File size: Consider splitting large videos
- Use SSD (not HDD)

**Optimize:**
```bash
# Compress before upload
ffmpeg -i input.mp4 -crf 28 -preset fast output.mp4
```

---

## Advanced Debugging

### Enable verbose logging

**Server side:**
```bash
# In server/index.js
import pino from 'pino'
const logger = pino({ level: 'debug' })

# Run with debug
DEBUG=clipforge:* npm run server:dev
```

**Frontend:**
```javascript
// In App.svelte
import pino from 'pino'
const logger = pino({ level: 'debug' })
logger.debug('...', data)
```

### Check server logs

```bash
# macOS/Linux
tail -f server.log

# Or save logs
npm run server:dev > server.log 2>&1 &
```

### Check browser console

```javascript
// DevTools → Console
// Look for errors and warnings
// Network tab shows API calls and responses
```

### Test endpoints directly

```bash
# Health check
curl http://localhost:3000/api/health

# Upload test
curl -X POST http://localhost:3000/api/upload \
  -F "file=@video.mp4"

# Download test
curl -X POST http://localhost:3000/api/download-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtube.com/...","type":"youtube"}'
```

---

## Getting Help

1. **Check logs**
   - Browser console (F12)
   - Server terminal output
   - Error messages are usually descriptive

2. **Check this guide**
   - Search for your error message
   - Look for similar issues

3. **Check code**
   - Error often includes file name
   - Go to that file and read comments
   - Check related services

4. **Community**
   - GitHub Issues
   - Stack Overflow tag `clipforge`
   - Reddit `/r/VideoEditing`

5. **Environment**
   - Make sure all dependencies installed
   - Check `.env` file has required keys
   - Verify FFmpeg/yt-dlp installation

---

## Still Stuck?

**Provide this info:**
1. Error message (exact text)
2. What were you doing? (upload, export, etc)
3. System: macOS/Linux/Windows
4. File size and format
5. Output of `npm -v` and `node -v`
6. Output of `ffmpeg -version`

**Then:**
1. Create GitHub issue with details
2. Include console error logs
3. Mention any customizations made
4. Be specific about steps to reproduce

---

Good luck! You've got this! 🚀
