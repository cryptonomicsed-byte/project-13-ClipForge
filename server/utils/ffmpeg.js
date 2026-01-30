import { spawn } from 'child_process';
import pino from 'pino';

const logger = pino();

/**
 * Get video duration using FFprobe
 */
export function getVideoDuration(filepath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1:noprint_sections=1',
      filepath
    ]);

    let output = '';

    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code === 0) {
        const duration = parseFloat(output.trim());
        if (!isNaN(duration)) {
          resolve(duration);
        } else {
          reject(new Error('Invalid duration output'));
        }
      } else {
        reject(new Error(`FFprobe failed with code ${code}`));
      }
    });

    ffprobe.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Get video information (duration, bitrate, codec, etc)
 */
export function getVideoInfo(filepath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filepath
    ]);

    let output = '';

    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(output);
          const videoStream = info.streams?.find(s => s.codec_type === 'video');
          const audioStream = info.streams?.find(s => s.codec_type === 'audio');

          resolve({
            duration: parseFloat(info.format.duration),
            bitrate: parseInt(info.format.bit_rate),
            video: {
              codec: videoStream?.codec_name,
              width: videoStream?.width,
              height: videoStream?.height,
              fps: eval(videoStream?.r_frame_rate) || 30
            },
            audio: {
              codec: audioStream?.codec_name,
              sampleRate: audioStream?.sample_rate,
              channels: audioStream?.channels
            }
          });
        } catch (error) {
          reject(new Error('Failed to parse video info'));
        }
      } else {
        reject(new Error(`FFprobe failed with code ${code}`));
      }
    });

    ffprobe.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Generate thumbnail from video
 */
export function generateThumbnail(videoPath, outputPath, timeSeconds = 1) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-ss', timeSeconds.toString(),
      '-vframes', '1',
      '-vf', 'scale=320:180',
      '-y',
      outputPath
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg thumbnail failed with code ${code}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Check if FFmpeg is installed
 */
export async function checkFFmpeg() {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    let output = '';

    ffmpeg.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffmpeg.on('close', (code) => {
      resolve(code === 0 && output.includes('ffmpeg version'));
    });

    ffmpeg.on('error', () => {
      resolve(false);
    });

    setTimeout(() => resolve(false), 5000);
  });
}
