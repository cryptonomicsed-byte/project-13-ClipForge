import pino from 'pino';
import { spawn } from 'child_process';
import { join } from 'path';
import { mkdir } from 'fs/promises';

const logger = pino();

/**
 * Extract video clips based on detected moments
 * Creates high-quality clips with optional captions
 */
export async function extractClips(videoPath, moments, options = {}) {
  const {
    outputDir = './clips',
    quality = 'high',
    includeSubtitles = true,
    onProgress = null
  } = options;

  await mkdir(outputDir, { recursive: true });

  const extractedClips = [];
  const totalClips = moments.length;

  for (let i = 0; i < moments.length; i++) {
    const moment = moments[i];

    try {
      const clipPath = join(outputDir, `clip-${i}-${moment.id}.mp4`);

      if (onProgress) {
        onProgress({
          step: 'extract',
          progress: (i / totalClips) * 100,
          message: `Extracting clip ${i + 1}/${totalClips}...`
        });
      }

      // Extract clip
      await extractClip(videoPath, clipPath, moment, quality);

      extractedClips.push({
        id: moment.id,
        filename: `clip-${i}.mp4`,
        path: clipPath,
        start: moment.start,
        end: moment.end,
        duration: moment.end - moment.start,
        reason: moment.reason,
        score: moment.score,
        hook: moment.hook,
        subtitle: includeSubtitles ? moment.subtitle : null
      });

      logger.info(`Extracted clip ${i + 1}/${totalClips}: ${moment.id}`);
    } catch (error) {
      logger.error(error, `Failed to extract clip: ${moment.id}`);
    }
  }

  if (onProgress) {
    onProgress({
      step: 'extract',
      progress: 100,
      message: `Extracted ${extractedClips.length} clips`
    });
  }

  return extractedClips;
}

/**
 * Extract a single clip using FFmpeg
 */
function extractClip(inputPath, outputPath, moment, quality = 'high') {
  return new Promise((resolve, reject) => {
    const qualitySettings = {
      high: ['-crf', '18', '-preset', 'slow'],
      medium: ['-crf', '23', '-preset', 'medium'],
      low: ['-crf', '28', '-preset', 'fast']
    }[quality] || ['-crf', '23'];

    const ffmpegArgs = [
      '-i', inputPath,
      '-ss', moment.start.toString(),
      '-to', moment.end.toString(),
      '-vcodec', 'libx264',
      '-acodec', 'aac',
      ...qualitySettings,
      '-y',
      outputPath
    ];

    const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg extraction failed with code ${code}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });

    ffmpeg.stderr.on('data', (data) => {
      // Parse FFmpeg progress
      const timeMatch = data.toString().match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = parseFloat(timeMatch[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;
        const duration = moment.end - moment.start;
        const progress = (currentTime / duration) * 100;
        logger.debug(`Extraction progress: ${progress.toFixed(2)}%`);
      }
    });
  });
}

/**
 * Add captions to clip
 */
export async function addCaptions(clipPath, outputPath, captions, style = 'white-bold') {
  return new Promise((resolve, reject) => {
    // Create SRT subtitle file
    const srtContent = captions
      .map((cap, i) => {
        const startTime = formatSRTTime(cap.start);
        const endTime = formatSRTTime(cap.end);
        return `${i + 1}\n${startTime} --> ${endTime}\n${cap.text}\n`;
      })
      .join('\n');

    const styleFilter = {
      'white-bold': "subtitles='subtitles.srt':force_style='FontSize=24,FontName=Arial,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,OutlineWidth=2'",
      'white-shadow': "subtitles='subtitles.srt':force_style='FontSize=20,FontName=Arial,PrimaryColour=&H00FFFFFF,ShadowColour=&H00000000,ShadowDepth=3'",
      'black-white-outline': "subtitles='subtitles.srt':force_style='FontSize=24,FontName=Arial,PrimaryColour=&H00000000,OutlineColour=&H00FFFFFF,OutlineWidth=3'"
    }[style] || "subtitles='subtitles.srt'";

    // FFmpeg to add subtitles
    const ffmpeg = spawn('ffmpeg', [
      '-i', clipPath,
      '-vf', styleFilter,
      '-y',
      outputPath
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg caption failed with code ${code}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Format time for SRT subtitle format
 */
function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs.toFixed(3)).padStart(6, '0')}`;
}

/**
 * Resize clip for different platforms
 */
export async function resizeClipForPlatform(inputPath, outputPath, platform) {
  const dimensions = {
    tiktok: { width: 1080, height: 1920 },
    reels: { width: 1080, height: 1920 },
    shorts: { width: 1080, height: 1920 },
    linkedin: { width: 1080, height: 1080 },
    twitter: { width: 1280, height: 720 }
  }[platform] || { width: 1080, height: 1920 };

  return new Promise((resolve, reject) => {
    const scaleFilter = `scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=decrease,pad=${dimensions.width}:${dimensions.height}:(ow-iw)/2:(oh-ih)/2`;

    const ffmpeg = spawn('ffmpeg', [
      '-i', inputPath,
      '-vf', scaleFilter,
      '-c:v', 'libx264',
      '-crf', '22',
      '-c:a', 'aac',
      '-y',
      outputPath
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg resize failed with code ${code}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Add watermark/branding to clip
 */
export async function addWatermark(inputPath, outputPath, watermarkPath, position = 'bottom-right') {
  return new Promise((resolve, reject) => {
    const overlayFilter = {
      'top-left': 'overlay=10:10',
      'top-right': 'overlay=main_w-overlay_w-10:10',
      'bottom-left': 'overlay=10:main_h-overlay_h-10',
      'bottom-right': 'overlay=main_w-overlay_w-10:main_h-overlay_h-10'
    }[position] || 'overlay=10:10';

    const ffmpeg = spawn('ffmpeg', [
      '-i', inputPath,
      '-i', watermarkPath,
      '-filter_complex', overlayFilter,
      '-y',
      outputPath
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg watermark failed with code ${code}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
}
