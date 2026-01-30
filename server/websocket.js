import { WebSocketServer } from 'ws';
import { processVideo } from './processor.js';
import { resizeClipForPlatform, addCaptions } from './services/clip-extractor.js';
import pino from 'pino';
import { createServer } from 'http';

const logger = pino();

export function setupWebSocket(app) {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active processing sessions
  const sessions = new Map();

  wss.on('connection', (ws, req) => {
    const path = req.url;
    logger.info(`WebSocket connected: ${path}`);

    if (path.startsWith('/ws/process/')) {
      handleProcessing(ws, path);
    } else if (path === '/ws/export') {
      handleExport(ws);
    }
  });

  return httpServer;
}

/**
 * Handle video processing WebSocket
 */
function handleProcessing(ws, path) {
  const videoId = path.split('/').pop();
  let aborted = false;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.action === 'start') {
        logger.info(`Starting processing for video: ${videoId}`);

        // Mock progress updates (replace with actual processing)
        const steps = [
          { step: 'download', message: 'Downloading video...' },
          { step: 'transcribe', message: 'Transcribing audio...' },
          { step: 'analyze', message: 'Analyzing with AI...' },
          { step: 'extract', message: 'Extracting clips...' }
        ];

        for (let i = 0; i < steps.length; i++) {
          if (aborted) break;

          const step = steps[i];
          for (let progress = 0; progress <= 100; progress += 10) {
            if (aborted) break;

            ws.send(JSON.stringify({
              step: step.step,
              progress,
              message: step.message,
              complete: false
            }));

            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (!aborted) {
          // Send mock detected clips
          ws.send(JSON.stringify({
            step: 'complete',
            progress: 100,
            message: 'Processing complete',
            complete: true,
            clips: [
              {
                id: 'clip-1',
                start: 10,
                end: 35,
                reason: 'HUMOR',
                score: 0.95,
                hook: 'Wait for the punchline...'
              },
              {
                id: 'clip-2',
                start: 60,
                end: 90,
                reason: 'INSIGHT',
                score: 0.88,
                hook: 'Here\'s the key takeaway...'
              },
              {
                id: 'clip-3',
                start: 150,
                end: 180,
                reason: 'EMOTIONAL_PEAK',
                score: 0.92,
                hook: 'This moment will blow your mind...'
              }
            ]
          }));
        }
      } else if (data.action === 'cancel') {
        aborted = true;
        ws.close(1000, 'Processing cancelled');
      }
    } catch (error) {
      logger.error(error, 'WebSocket message error');
      ws.send(JSON.stringify({
        error: error.message
      }));
    }
  });

  ws.on('close', () => {
    aborted = true;
    logger.info(`Processing websocket closed: ${videoId}`);
  });

  ws.on('error', (error) => {
    logger.error(error, 'WebSocket error');
  });
}

/**
 * Handle clip export WebSocket
 */
function handleExport(ws) {
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.action === 'start-export') {
        const { clips, formats, settings } = data;

        logger.info(`Starting export for ${clips.length} clips in ${formats.length} formats`);

        // Mock export progress
        const totalWork = clips.length * formats.length;
        let completed = 0;

        for (const clip of clips) {
          for (const format of formats) {
            // Mock processing
            await new Promise(resolve => setTimeout(resolve, 1000));

            completed++;
            const progress = (completed / totalWork) * 100;

            ws.send(JSON.stringify({
              format,
              progress: Math.round(progress),
              message: `Exporting clip to ${format}...`,
              downloadUrl: `/downloads/${clip.id}-${format}.mp4`,
              complete: false
            }));
          }
        }

        // Final complete message
        ws.send(JSON.stringify({
          complete: true,
          message: 'All exports complete',
          progress: 100
        }));
      }
    } catch (error) {
      logger.error(error, 'Export websocket error');
      ws.send(JSON.stringify({
        error: error.message
      }));
    }
  });

  ws.on('close', () => {
    logger.info('Export websocket closed');
  });

  ws.on('error', (error) => {
    logger.error(error, 'Export WebSocket error');
  });
}

/**
 * Broadcast progress to all connected clients
 */
export function broadcastProgress(sessionId, progress) {
  // Implementation for broadcasting to multiple clients
}
