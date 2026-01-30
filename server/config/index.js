import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',

  // Storage
  uploadsDir: process.env.UPLOADS_DIR || './uploads',
  clipsDir: process.env.CLIPS_DIR || './clips',
  maxFileSize: process.env.MAX_FILE_SIZE || '10GB',

  // Processing
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '2'),
  processingTimeout: parseInt(process.env.PROCESSING_TIMEOUT || '3600000'), // 1 hour
  videoQuality: process.env.VIDEO_QUALITY || 'high',
  transcriptionModel: process.env.TRANSCRIPTION_MODEL || 'base',

  // AI Models
  llmProvider: process.env.LLM_PROVIDER || 'claude',
  useLocalWhisper: process.env.USE_LOCAL_WHISPER !== 'false',
  useLocalProcessing: process.env.USE_LOCAL_PROCESSING !== 'false',

  // API Keys
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  openaiKey: process.env.OPENAI_API_KEY,
  qdrantKey: process.env.QDRANT_API_KEY,

  // Logging
  logLevel: process.env.LOG_LEVEL || (process.env.DEBUG ? 'debug' : 'info'),
  debug: !!process.env.DEBUG,

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:1111',

  // FFmpeg
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  ffprobePath: process.env.FFPROBE_PATH || 'ffprobe',
  ytdlpPath: process.env.YTDLP_PATH || 'yt-dlp',

  // Cleanup
  fileCleanupAge: parseInt(process.env.FILE_CLEANUP_AGE || '86400000'), // 24 hours
  cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL || '3600000'), // 1 hour

  // Validation
  allowedMimeTypes: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'audio/mpeg',
    'audio/wav',
    'audio/aac',
    'audio/ogg'
  ],

  allowedFormats: ['tiktok', 'reels', 'shorts', 'linkedin', 'twitter'],
  allowedQualities: ['high', 'medium', 'low'],
  allowedFPS: [24, 30, 60],

  // Defaults
  defaultQuality: 'medium',
  defaultFPS: 30,
  defaultFormats: ['tiktok', 'reels', 'shorts'],

  // Limits
  minClipDuration: 5, // seconds
  maxClipDuration: 300, // 5 minutes
  maxClips: 20,
  maxVideoLength: 10800, // 3 hours in seconds

  // Qdrant (optional vector DB)
  qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
  qdrantCollectionName: 'clipforge_moments',

  // Feature flags
  enableVectorSearch: process.env.ENABLE_VECTOR_SEARCH === 'true',
  enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
  enableBatchProcessing: process.env.ENABLE_BATCH === 'true' ?? true,
  enableAutoCleanup: process.env.ENABLE_AUTO_CLEANUP === 'true' ?? true,

  // Export
  exportFormats: {
    tiktok: { width: 1080, height: 1920, ratio: '9:16', fps: 30 },
    reels: { width: 1080, height: 1920, ratio: '9:16', fps: 30 },
    shorts: { width: 1080, height: 1920, ratio: '9:16', fps: 30 },
    linkedin: { width: 1080, height: 1080, ratio: '1:1', fps: 30 },
    twitter: { width: 1280, height: 720, ratio: '16:9', fps: 30 }
  }
};

// Validate critical config
function validateConfig() {
  if (config.isProd) {
    if (!config.anthropicKey && !config.openaiKey) {
      console.warn('⚠️  No LLM API keys configured. Using fallback detection.');
    }
  }

  // Check FFmpeg installation
  if (!config.useLocalProcessing) {
    console.warn('⚠️  Local processing disabled. Ensure cloud service is configured.');
  }
}

validateConfig();

export default config;
