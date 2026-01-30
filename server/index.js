import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getVideoDuration } from './utils/ffmpeg.js';
import { downloadYouTube } from './utils/downloader.js';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const logger = pino();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(join(__dirname, '../dist')));

// Storage setup
const uploadsDir = join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const id = uuidv4();
    cb(null, `${id}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10GB
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// File upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const fileId = uuidv4();
    const filepath = req.file.path;
    
    // Get duration
    const duration = await getVideoDuration(filepath);

    res.json({
      id: fileId,
      filename: req.file.originalname,
      filepath: filepath.replace(uploadsDir, '/uploads'),
      size: req.file.size,
      duration
    });

    logger.info(`File uploaded: ${fileId} (${req.file.originalname})`);
  } catch (error) {
    logger.error(error, 'Upload failed');
    res.status(500).json({ error: error.message });
  }
});

// Download from URL
app.post('/api/download-url', async (req, res) => {
  try {
    const { url, type } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }

    const fileId = uuidv4();
    const outputPath = join(uploadsDir, `${fileId}-download.mp4`);

    let duration;

    if (type === 'youtube') {
      const result = await downloadYouTube(url, outputPath);
      duration = result.duration;
    } else {
      // Generic URL download (implement as needed)
      return res.status(501).json({ error: 'Generic URL download not yet implemented' });
    }

    res.json({
      id: fileId,
      filename: `download-${fileId}.mp4`,
      filepath: `/uploads/${fileId}-download.mp4`,
      size: fs.statSync(outputPath).size,
      duration
    });

    logger.info(`Downloaded from URL: ${fileId}`);
  } catch (error) {
    logger.error(error, 'Download failed');
    res.status(500).json({ error: error.message });
  }
});

// WebSocket handling (in separate module)
import { setupWebSocket } from './websocket.js';
setupWebSocket(app);

// Error handling
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: err.message });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`ClipForge server running on port ${PORT}`);
});
