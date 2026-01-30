import pino from 'pino';
import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import axios from 'axios';

const logger = pino();

/**
 * Transcribe audio using Whisper
 * Supports local Ollama or OpenAI API
 */
export async function transcribeAudio(videoPath, options = {}) {
  const { useLocal = true } = options;

  if (useLocal) {
    return transcribeWithOllama(videoPath);
  } else {
    return transcribeWithOpenAI(videoPath);
  }
}

/**
 * Transcribe using local Ollama (free)
 */
async function transcribeWithOllama(videoPath) {
  try {
    logger.info('Transcribing with local Ollama...');

    // First extract audio from video
    const audioPath = videoPath.replace(/\.[^/.]+$/, '.wav');

    // FFmpeg to extract audio
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-q:a', '9',
        '-id3v2_version', '4',
        '-write_id3v1', '0',
        audioPath
      ]);

      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg failed with code ${code}`));
      });

      ffmpeg.stderr.on('data', (data) => {
        logger.debug(`FFmpeg: ${data}`);
      });
    });

    // Convert to base64 for API
    const audioBuffer = readFileSync(audioPath);
    const base64Audio = audioBuffer.toString('base64');

    // Call Ollama transcription
    const response = await axios.post('http://localhost:11434/api/transcribe', {
      audio: base64Audio
    });

    logger.info('Transcription complete');

    return {
      text: response.data.text || '',
      segments: response.data.segments || [],
      language: response.data.language || 'en'
    };
  } catch (error) {
    logger.error(error, 'Ollama transcription failed');
    throw error;
  }
}

/**
 * Transcribe using OpenAI Whisper API
 */
async function transcribeWithOpenAI(videoPath) {
  try {
    logger.info('Transcribing with OpenAI Whisper...');

    // Extract audio first
    const audioPath = videoPath.replace(/\.[^/.]+$/, '.m4a');

    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-vn',
        '-acodec', 'aac',
        audioPath
      ]);

      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg failed with code ${code}`));
      });
    });

    // Upload to OpenAI
    const fs = await import('fs');
    const FormData = await import('form-data');
    const formData = new FormData.default();
    formData.append('file', fs.createReadStream(audioPath));
    formData.append('model', 'whisper-1');

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    logger.info('Transcription complete');

    return {
      text: response.data.text || '',
      segments: response.data.segments || [],
      language: 'en'
    };
  } catch (error) {
    logger.error(error, 'OpenAI transcription failed');
    throw error;
  }
}

/**
 * Stream transcription progress
 */
export async function transcribeAudioStreaming(videoPath, onProgress) {
  return new Promise((resolve, reject) => {
    // Stream audio processing
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-q:a', '9',
      '-f', 'wav',
      'pipe:1'
    ]);

    let totalBytes = 0;

    ffmpeg.stdout.on('data', (chunk) => {
      totalBytes += chunk.length;
      if (onProgress) {
        onProgress({
          step: 'transcribe',
          progress: Math.min(90, (totalBytes / 1000000) * 50), // Up to 50%
          message: `Processing audio... ${(totalBytes / 1024 / 1024).toFixed(2)}MB`
        });
      }
    });

    ffmpeg.on('close', async (code) => {
      if (code === 0) {
        try {
          const result = await transcribeAudio(videoPath);
          if (onProgress) {
            onProgress({
              step: 'transcribe',
              progress: 100,
              message: 'Transcription complete'
            });
          }
          resolve(result);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error(`FFmpeg failed with code ${code}`));
      }
    });

    ffmpeg.stderr.on('data', (data) => {
      logger.debug(`FFmpeg: ${data}`);
    });
  });
}
