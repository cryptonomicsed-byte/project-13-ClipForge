import { spawn } from 'child_process';
import pino from 'pino';
import { getVideoDuration } from './ffmpeg.js';

const logger = pino();

/**
 * Download video from YouTube using yt-dlp
 */
export async function downloadYouTube(url, outputPath) {
  return new Promise((resolve, reject) => {
    logger.info(`Downloading from YouTube: ${url}`);

    const ytdlp = spawn('yt-dlp', [
      '-f', 'best[height<=1080]',
      '-o', outputPath,
      '-N', '4', // max concurrent fragments
      url
    ]);

    ytdlp.on('close', async (code) => {
      if (code === 0) {
        try {
          const duration = await getVideoDuration(outputPath);
          logger.info(`YouTube download complete: ${duration}s`);
          resolve({ duration, path: outputPath });
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error(`yt-dlp failed with code ${code}`));
      }
    });

    ytdlp.stderr.on('data', (data) => {
      logger.debug(`yt-dlp: ${data.toString()}`);
    });

    ytdlp.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Download video from generic URL
 */
export async function downloadURL(url, outputPath) {
  return new Promise((resolve, reject) => {
    logger.info(`Downloading from URL: ${url}`);

    // Use ffmpeg to download
    const ffmpeg = spawn('ffmpeg', [
      '-i', url,
      '-c', 'copy',
      '-y',
      outputPath
    ]);

    ffmpeg.on('close', async (code) => {
      if (code === 0) {
        try {
          const duration = await getVideoDuration(outputPath);
          logger.info(`URL download complete: ${duration}s`);
          resolve({ duration, path: outputPath });
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error(`FFmpeg download failed with code ${code}`));
      }
    });

    ffmpeg.stderr.on('data', (data) => {
      logger.debug(`FFmpeg: ${data.toString()}`);
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Get video metadata from URL
 */
export async function getVideoMetadata(url) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      '-j', // JSON output
      '--skip-download',
      url
    ]);

    let output = '';

    ytdlp.stdout.on('data', (data) => {
      output += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        try {
          const metadata = JSON.parse(output);
          resolve({
            title: metadata.title,
            duration: metadata.duration,
            thumbnail: metadata.thumbnail,
            uploader: metadata.uploader,
            uploadDate: metadata.upload_date
          });
        } catch (error) {
          reject(new Error('Failed to parse metadata'));
        }
      } else {
        reject(new Error(`yt-dlp failed with code ${code}`));
      }
    });

    ytdlp.on('error', (error) => {
      reject(error);
    });
  });
}
