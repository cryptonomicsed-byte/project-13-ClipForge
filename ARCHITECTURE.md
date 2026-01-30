# ClipForge Architecture

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Svelte + Vite)                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ App.svelte (Main Router)                             │  │
│  │  ├── Upload.svelte (File/URL input)                  │  │
│  │  ├── Processor.svelte (Real-time progress)           │  │
│  │  ├── Editor.svelte (Clip selection & preview)        │  │
│  │  ├── ExportPanel.svelte (Multi-format export)        │  │
│  │  └── ProcessingQueue.svelte (Batch queue)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  State Management: store.js (Svelte stores)                 │
│  HTTP: Fetch API + WebSocket for real-time updates         │
└──────────────────────────────────┬──────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
         HTTP(S) REST API            WebSocket (Real-time)
                    │                             │
┌───────────────────┴──────────────┬──────────────┴──────────────┐
│                                  │                              │
│        Express.js Backend        │    WebSocket Server         │
│                                  │                              │
│  ┌──────────────────────────┐   │  ┌──────────────────────┐   │
│  │ Routes                   │   │  │ /ws/process/{id}     │   │
│  │ ├── /api/upload          │   │  │ ├── Download         │   │
│  │ ├── /api/download-url    │   │  │ ├── Transcribe       │   │
│  │ └── /api/health          │   │  │ ├── Analyze          │   │
│  └──────────────────────────┘   │  │ └── Extract          │   │
│                                  │  │                      │   │
│  ┌──────────────────────────┐   │  │ /ws/export           │   │
│  │ Middleware               │   │  │ ├── Format clips     │   │
│  │ ├── CORS                 │   │  │ ├── Generate files   │   │
│  │ ├── Multer (uploads)     │   │  │ └── Serve downloads  │   │
│  │ └── Error handling       │   │  │                      │   │
│  └──────────────────────────┘   │  └──────────────────────┘   │
└────────────┬─────────────────────┴──────────────────────────────┘
             │
             │
     ┌───────┴────────────────────────────────────────┐
     │                                                │
┌────┴──────────────────┐                    ┌──────┴────────┐
│   Services Layer      │                    │  Utils Layer  │
│                       │                    │               │
│ ├── transcription.js  │                    │ ├── ffmpeg.js │
│ │   (Whisper/OpenAI)  │                    │ │ (Processing) │
│ │                     │                    │ │               │
│ ├── ai-analyzer.js    │                    │ ├── llm-client │
│ │   (Claude/GPT)      │                    │ │ (LLM APIs)   │
│ │                     │                    │ │               │
│ ├── clip-extractor.js │                    │ └── downloader │
│ │   (FFmpeg)          │                    │   (YouTube)    │
│ │                     │                    │                │
│ └── db-service.js     │                    └────────────────┘
│    (SQLite/Qdrant)    │
└────────┬──────────────┘
         │
    ┌────┴────────────────────────────────────┐
    │      External Dependencies              │
    │                                          │
    │ ├── FFmpeg (Video processing)            │
    │ ├── FFprobe (Metadata extraction)        │
    │ ├── yt-dlp (YouTube downloads)           │
    │ ├── OpenAI/Anthropic APIs (AI)           │
    │ ├── Whisper/Ollama (Transcription)       │
    │ └── SQLite/Qdrant (Data storage)         │
    │                                          │
    └────────────────────────────────────────┘
```

## Data Flow

### 1. Upload & Download
```
User Action
    ↓
Upload Component (Upload.svelte)
    ├→ File selected OR URL entered
    ↓
POST /api/upload (file) OR /api/download-url (URL)
    ├→ Multer validates file
    ├→ yt-dlp downloads YouTube video (if applicable)
    ├→ FFprobe gets duration
    ↓
Response: {id, filepath, duration}
    ↓
Store: appStore.setVideo()
    ↓
Processor Component activated
```

### 2. Video Processing
```
Processor Component
    ↓
WebSocket: ws://localhost:3000/ws/process/{videoId}
    ↓
Server Handler (websocket.js)
    │
    ├─→ Step 1: Transcription
    │   ├→ Extract audio (FFmpeg)
    │   ├→ Send to Whisper/OpenAI
    │   ↓
    │   Transcript + segments
    │
    ├─→ Step 2: AI Analysis
    │   ├→ Build prompt with transcript
    │   ├→ Call Claude/GPT API
    │   ├→ Parse moments (start, end, reason, score)
    │   ↓
    │   Moments array
    │
    ├─→ Step 3: Clip Extraction
    │   ├→ For each moment:
    │   │   ├→ FFmpeg extract (start → end)
    │   │   ├→ Save to clips/
    │   │   └→ Progress update
    │   ↓
    │   Clip files + metadata
    │
    └─→ WebSocket send complete with clips
        ↓
        Frontend: store.setDetectedClips()
        ↓
        Editor Component opens
```

### 3. Clip Editing
```
Editor Component
    ├→ Display all detected clips
    ├→ User selects/deselects
    ├→ Show clip preview (VideoPlayer.svelte)
    ├→ Allow duplicate/delete
    ↓
User clicks "Export"
    ├→ Store selected clips in appStore.clips
    └→ ExportPanel Component opens
```

### 4. Export & Formatting
```
ExportPanel Component
    ├→ Select output formats (TikTok, Reels, Shorts, etc.)
    ├→ Set options (subtitles, quality, watermark)
    ↓
Click "Start Export"
    ↓
WebSocket: ws://localhost:3000/ws/export
    │
    ├→ For each selected format:
    │   ├→ Resize clip for platform aspect ratio
    │   │   (1080x1920 for TikTok, etc.)
    │   ├→ Add subtitles if enabled (FFmpeg + SRT)
    │   ├→ Add watermark/branding
    │   ├→ Apply transitions/effects
    │   ├→ Encode to platform specs
    │   └→ Upload to S3/CDN
    │
    └→ WebSocket: progress + download links
        ↓
        Frontend: show download buttons
        ↓
        User downloads all formats
```

## Component Structure

### Frontend Components

**App.svelte** (Router)
- Manages step flow: upload → processing → editing → export
- Handles app-wide state through store
- Displays header and footer

**Upload.svelte**
- Drag & drop file upload
- YouTube/URL input
- File validation
- Progress feedback

**Processor.svelte**
- Real-time processing progress (WebSocket)
- Step indicator with visual feedback
- Processing logs viewer
- Time estimation

**Editor.svelte**
- Displays all detected clips
- Single/multi-select with preview
- Clip management (delete, duplicate)
- Video player with timeline

**ExportPanel.svelte**
- Format selection (TikTok, Reels, Shorts, etc.)
- Quality/performance settings
- Subtitle configuration
- Watermark options
- Real-time export progress
- Download links display

**Components/** (Reusable)
- `ClipCard.svelte` - Individual clip display
- `VideoPlayer.svelte` - Video preview with timeline
- `ProgressBar.svelte` - Progress visualization
- `ProcessingQueue.svelte` - Batch queue manager

### Backend Services

**transcription.js**
- Audio extraction (FFmpeg)
- Whisper/OpenAI API calls
- Transcript segmentation
- Fallback to local model

**ai-analyzer.js**
- Prompt engineering for moment detection
- Claude/GPT API integration
- Moment filtering and ranking
- Fallback heuristic analysis

**clip-extractor.js**
- FFmpeg clip extraction
- Subtitle/caption rendering
- Platform-specific resizing
- Watermark composition

**utils/ffmpeg.js**
- Video info extraction (FFprobe)
- Duration calculation
- Thumbnail generation
- Health check

**utils/downloader.js**
- yt-dlp YouTube download
- Generic URL download (FFmpeg)
- Metadata retrieval

## Data Structures

### Video Object
```javascript
{
  id: string,
  filename: string,
  filepath: string,
  size: number,
  duration: number,
  uploadedAt: Date,
  sourceUrl?: string // if from YouTube
}
```

### Detected Moment
```javascript
{
  id: string,
  start: number, // seconds
  end: number,
  reason: 'HUMOR' | 'INSIGHT' | 'EMOTIONAL_PEAK' | 'STORY_BEAT' | ...,
  confidence: number, // 0-100
  hook: string, // opening line for social media
  score: number // same as confidence
}
```

### Clip
```javascript
{
  id: string,
  filename: string,
  path: string,
  start: number,
  end: number,
  duration: number,
  reason: string,
  score: number,
  hook: string,
  subtitle?: string,
  selected: boolean,
  editing: boolean
}
```

### Export Settings
```javascript
{
  formats: {
    tiktok: boolean,
    reels: boolean,
    shorts: boolean,
    linkedin: boolean,
    twitter: boolean
  },
  subtitles: boolean,
  subtitleStyle: string,
  branding: boolean,
  brandingText: string,
  brandingPosition: string,
  transition: string,
  quality: 'high' | 'medium' | 'low',
  fps: number,
  watermark: boolean
}
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Svelte 4 | UI components |
| | Vite | Build tool |
| | Tailwind CSS | Styling |
| | WebSocket | Real-time updates |
| **Backend** | Node.js | Runtime |
| | Express.js | HTTP server |
| | ws | WebSocket server |
| **Processing** | FFmpeg | Video encoding |
| | Whisper/OpenAI | Transcription |
| | Claude/GPT | AI analysis |
| | yt-dlp | YouTube download |
| **Storage** | Node.js FS | File storage |
| | SQLite (optional) | Metadata DB |
| | Qdrant (optional) | Vector DB |

## Performance Considerations

### Memory Usage
- **Large videos**: Process in 5-10 min segments
- **Concurrent jobs**: Limit to 2 by default
- **FFmpeg**: Uses ~500MB for 1080p processing

### Speed Optimizations
- Stream processing instead of loading entire video
- Parallel format export (4 concurrent)
- Cache transcripts/analysis
- Lazy load video preview
- Compress export with medium/low quality preset

### Scalability
- **Horizontal**: Run multiple backend instances
- **Queue**: Bull/BullMQ for job processing
- **Cloud**: AWS S3 for storage, Lambda for processing
- **Database**: PostgreSQL + pgvector for scale

## Security

### Input Validation
- File type checking (video/audio only)
- File size limits (10GB max)
- URL validation (YouTube/HTTPS only)
- Filename sanitization

### API Security
- CORS headers
- Rate limiting
- API key validation
- WebSocket origin check

### File Handling
- Temp file cleanup after 24h
- Virus scanning (optional)
- User isolation (session-based)

## Error Handling

```
Try-Catch Blocks
    ├→ Upload: Invalid file/network
    ├→ Transcription: Poor audio quality
    ├→ AI Analysis: API rate limits
    ├→ Extraction: FFmpeg codec issues
    └→ Export: Disk space

Fallbacks
    ├→ Whisper fails → Use OpenAI Whisper
    ├→ Claude fails → Use GPT-4
    ├→ No moments detected → Heuristic fallback
    └→ Export fails → Retry with lower quality
```

## Deployment

### Local Development
```
npm run dev        # Frontend (1111)
npm run server:dev # Backend (3000)
```

### Production
```
npm run build      # Optimize frontend
npm run server     # Start backend
# Serve dist/ with Nginx/Apache
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
RUN apk add ffmpeg
COPY . .
RUN npm install && npm run build
CMD ["npm", "run", "server"]
```

### Cloud (Vercel/Netlify)
- Frontend: Deploy dist/ to Vercel
- Backend: Deploy server/ to Vercel Functions
- Storage: AWS S3 or Cloudinary for clips

## Monitoring

```
Logs
├→ Frontend: Browser console + Sentry
├→ Backend: Pino logger
├→ Processing: Detailed step logs
└→ Errors: Error tracking + alerts

Metrics
├→ Processing time per video
├→ Clip detection accuracy
├→ Export success rate
└→ API response times
```

---

This architecture provides scalability, reliability, and excellent user experience for AI-powered video clip generation.
