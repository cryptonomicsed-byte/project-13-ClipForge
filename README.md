# ClipForge - AI Video Clip Generator

Better than Opus Clips. Create viral video clips automatically with AI-powered moment detection.

## Features

- **Multiple Input Formats**: YouTube URLs, video files, audio files
- **AI-Powered Clipping**: Detects the best moments for engagement
- **Multi-Format Export**: TikTok, Instagram Reels, YouTube Shorts, LinkedIn, Twitter
- **Advanced Editing**: Captions, transitions, watermarks, branding
- **Batch Processing**: Queue multiple videos for automated processing
- **Real-Time Feedback**: Live processing progress with detailed logs
- **Cost Efficient**: Uses local processing + optional cloud APIs

## Installation

```bash
# Install dependencies
npm install

# Create uploads directory
mkdir uploads
mkdir clips
```

## Environment Setup

```bash
cp .env.example .env
```

### Required Dependencies

- **FFmpeg** - Video processing
- **FFprobe** - Video analysis
- **yt-dlp** - YouTube downloads
- **Node.js 18+** - Runtime

### API Keys (Optional)

```env
# For AI analysis (use one or more)
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here

# Optional: For cloud transcription
OPENAI_API_KEY=your_key_here
```

## Running

```bash
# Development (both frontend and server)
npm run dev              # Frontend on port 1111
npm run server:dev       # Backend on port 3000

# Production
npm run build
npm run preview
npm run server
```

Visit `http://localhost:1111`

## Architecture

```
ClipForge/
├── src/                    # Svelte frontend
│   ├── App.svelte         # Main app
│   └── lib/
│       ├── Upload.svelte  # Upload/URL input
│       ├── Processor.svelte
│       ├── Editor.svelte  # Clip selection
│       ├── ExportPanel.svelte
│       └── components/
│
├── server/                # Node.js backend
│   ├── index.js          # Express server
│   ├── processor.js      # Main pipeline
│   ├── websocket.js      # Real-time updates
│   ├── services/
│   │   ├── transcription.js
│   │   ├── ai-analyzer.js
│   │   └── clip-extractor.js
│   └── utils/
│       ├── ffmpeg.js
│       ├── downloader.js
│       └── llm-client.js
│
└── uploads/             # Temp storage
```

## Processing Pipeline

1. **Download** - Fetch video from URL or validate upload
2. **Transcribe** - Extract audio and generate transcript
3. **Analyze** - AI detects interesting moments (humor, insights, emotional peaks)
4. **Extract** - Create individual clips from detected moments
5. **Export** - Generate multi-format versions with captions/branding

## Better Than Opus Clips

✅ Real-time processing feedback  
✅ Batch processing support  
✅ Advanced AI detection (emotion, humor, insights)  
✅ Custom editing UI with live preview  
✅ Multi-format simultaneous export  
✅ Watermark and branding layers  
✅ Open source and customizable  
✅ No subscription required  
✅ Cost-efficient processing  
✅ Clip chaining and compilations  

## API Endpoints

### Upload
- `POST /api/upload` - Upload video file
- `POST /api/download-url` - Download from URL/YouTube

### WebSocket
- `ws://localhost:3000/ws/process/{videoId}` - Processing progress
- `ws://localhost:3000/ws/export` - Export progress

## Customization

### Adding New Output Formats

Edit `src/lib/ExportPanel.svelte`:

```javascript
const formatConfigs = {
  your_platform: {
    name: 'Your Platform',
    ratio: '16:9',
    width: 1280,
    height: 720
  }
};
```

### Custom AI Prompts

Edit `server/services/ai-analyzer.js` to customize moment detection criteria.

### Adding Watermarks

Place watermark images in `server/assets/watermarks/` and configure in export settings.

## Performance Tips

- **For Long Videos** (30+ min): Process on server, use local Whisper
- **For Quick Processing** - Use medium quality preset, disable subtitles
- **For Best Quality** - Use high quality, enable transitions, custom captions
- **Batch Processing** - Queue up to 10 videos for overnight processing

## Troubleshooting

### FFmpeg not found
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
choco install ffmpeg
```

### Transcription quality issues
- Ensure good audio quality in source video
- Try raising mic levels in original recording
- Use OpenAI Whisper for more accuracy (requires API key)

### Memory issues with long videos
- Use medium quality preset
- Process shorter segments
- Increase Node.js memory: `node --max-old-space-size=4096 server/index.js`

## License

MIT - Open source and free to use

## Roadmap

- [ ] Video thumbnails with captions
- [ ] Music/effects library
- [ ] Advanced color grading
- [ ] Multi-language support
- [ ] Cloud processing (AWS/GCP)
- [ ] Direct social media upload
- [ ] Analytics dashboard
- [ ] Team collaboration

---

Made with ❤️ for content creators
