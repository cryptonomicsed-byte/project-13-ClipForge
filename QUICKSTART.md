# ClipForge Quick Start

## 1. Install Dependencies

```bash
cd clip-forge
npm install
```

## 2. System Requirements

### macOS
```bash
brew install ffmpeg node
```

### Ubuntu/Debian
```bash
sudo apt-get install ffmpeg nodejs npm
```

### Windows
```bash
choco install ffmpeg nodejs
```

## 3. Set Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```env
ANTHROPIC_API_KEY=sk-ant-... (optional)
OPENAI_API_KEY=sk-... (optional)
```

## 4. Create Directories

```bash
mkdir uploads clips
```

## 5. Start Development Server

In separate terminals:

```bash
# Terminal 1 - Frontend (port 1111)
npm run dev

# Terminal 2 - Backend (port 3000)
npm run server:dev
```

## 6. Open Browser

Visit: `http://localhost:1111`

## 7. Try It Out

1. **Upload a video** - Click "Upload File" and select any video (MP4, WebM, etc)
2. **Or use YouTube** - Paste a YouTube URL
3. **Wait for processing** - AI will analyze and detect moments
4. **Select clips** - Choose which ones you want
5. **Export** - Download for TikTok, Reels, Shorts, etc

## Common Issues

### FFmpeg not found
```bash
# Check if installed
ffmpeg -version

# If not, install:
brew install ffmpeg  # macOS
sudo apt install ffmpeg  # Linux
```

### Port already in use
```bash
# Change port in vite.config.ts
server: { port: 5173 }

# And update proxy in server/index.js
```

### Node modules error
```bash
rm -rf node_modules package-lock.json
npm install
```

### Out of memory (large videos)
```bash
node --max-old-space-size=4096 server/index.js
```

## Next Steps

- Edit AI prompts in `server/services/ai-analyzer.js`
- Customize export formats in `src/lib/ExportPanel.svelte`
- Add custom watermarks to `server/assets/watermarks/`
- Deploy to Vercel/Netlify

## Production Build

```bash
npm run build
npm run preview
```

This generates optimized files in `dist/`

---

Need help? Check README.md for full documentation.
