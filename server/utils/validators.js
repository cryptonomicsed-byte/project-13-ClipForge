import pino from 'pino';

const logger = pino();

/**
 * Validate video URL
 */
export function validateUrl(url) {
  try {
    const urlObj = new URL(url);
    const validDomains = [
      'youtube.com',
      'youtu.be',
      'vimeo.com',
      'dailymotion.com',
      'twitch.tv'
    ];

    const hostname = urlObj.hostname;
    const isValid = validDomains.some(domain => hostname.includes(domain));

    if (!isValid) {
      logger.warn(`Invalid URL domain: ${hostname}`);
      return false;
    }

    return true;
  } catch (error) {
    logger.error(error, 'URL validation failed');
    return false;
  }
}

/**
 * Validate file type
 */
export function validateFileType(mimetype) {
  const validTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'audio/mpeg',
    'audio/wav',
    'audio/aac',
    'audio/ogg'
  ];

  return validTypes.includes(mimetype) ||
         validTypes.some(t => mimetype.startsWith(t.split('/')[0]));
}

/**
 * Validate file size
 */
export function validateFileSize(sizeBytes, maxGB = 10) {
  const maxBytes = maxGB * 1024 * 1024 * 1024;
  return sizeBytes <= maxBytes;
}

/**
 * Validate export format
 */
export function validateFormat(format) {
  const validFormats = ['tiktok', 'reels', 'shorts', 'linkedin', 'twitter'];
  return validFormats.includes(format);
}

/**
 * Validate quality preset
 */
export function validateQuality(quality) {
  const validQualities = ['high', 'medium', 'low'];
  return validQualities.includes(quality);
}

/**
 * Validate FPS
 */
export function validateFPS(fps) {
  const validFPS = [24, 30, 60];
  return validFPS.includes(parseInt(fps));
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
}

/**
 * Validate transcript
 */
export function validateTranscript(transcript) {
  if (!transcript) return false;
  if (typeof transcript !== 'object') return false;
  if (!transcript.text) return false;
  if (typeof transcript.text !== 'string') return false;
  return transcript.text.length > 0;
}

/**
 * Validate moments
 */
export function validateMoments(moments) {
  if (!Array.isArray(moments)) return false;
  
  return moments.every(moment => {
    return typeof moment.start === 'number' &&
           typeof moment.end === 'number' &&
           typeof moment.reason === 'string' &&
           moment.start >= 0 &&
           moment.end > moment.start;
  });
}

/**
 * Get error message
 */
export function getValidationError(type, value) {
  const errors = {
    url: 'Invalid URL. Use YouTube, Vimeo, or other supported platforms.',
    fileType: 'Invalid file type. Use MP4, WebM, or audio formats.',
    fileSize: 'File too large. Maximum 10GB.',
    format: 'Invalid export format.',
    quality: 'Invalid quality preset.',
    fps: 'Invalid FPS. Use 24, 30, or 60.',
    transcript: 'Invalid transcript format.',
    moments: 'Invalid moments array.'
  };

  return errors[type] || 'Validation failed';
}
