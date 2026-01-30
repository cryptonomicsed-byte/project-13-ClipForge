import pino from 'pino';
import { transcribeAudio } from './services/transcription.js';
import { analyzeForClips } from './services/ai-analyzer.js';
import { extractClips } from './services/clip-extractor.js';
import { getVideoDuration } from './utils/ffmpeg.js';
import fs from 'fs';

const logger = pino();

/**
 * Main processing pipeline
 * Steps:
 * 1. Download/validate video
 * 2. Transcribe audio
 * 3. Analyze with AI for best moments
 * 4. Extract clips
 * 5. Return clip metadata
 */
export async function processVideo(videoPath, options = {}) {
  const startTime = Date.now();
  const clips = [];

  try {
    // Step 1: Validate video
    logger.info(`Processing video: ${videoPath}`);
    const duration = await getVideoDuration(videoPath);
    logger.info(`Video duration: ${duration}s`);

    // Step 2: Transcribe
    logger.info('Starting transcription...');
    const transcript = await transcribeAudio(videoPath);
    logger.info(`Transcription complete: ${transcript.text.length} chars`);

    // Step 3: Analyze for interesting moments
    logger.info('Analyzing for highlights...');
    const analysis = await analyzeForClips(transcript, {
      videoDuration: duration,
      ...options
    });

    // Step 4: Extract clips
    logger.info(`Extracting ${analysis.moments.length} clips...`);
    const extractedClips = await extractClips(videoPath, analysis.moments);

    // Return results
    const processingTime = (Date.now() - startTime) / 1000;
    logger.info(`Processing complete in ${processingTime}s`);

    return {
      success: true,
      clips: extractedClips,
      transcript,
      analysis,
      processingTime
    };
  } catch (error) {
    logger.error(error, 'Processing failed');
    throw error;
  }
}

/**
 * Batch process multiple videos
 */
export async function batchProcess(videoPaths, options = {}) {
  const results = [];

  for (const videoPath of videoPaths) {
    try {
      const result = await processVideo(videoPath, options);
      results.push({
        path: videoPath,
        success: true,
        data: result
      });
    } catch (error) {
      results.push({
        path: videoPath,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}
