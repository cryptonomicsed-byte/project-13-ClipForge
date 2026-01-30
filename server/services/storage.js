import pino from 'pino';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const logger = pino();

/**
 * File storage service
 * Handles uploads, temp files, and cleanup
 */
export class StorageService {
  constructor(uploadsDir = './uploads', clipsDir = './clips') {
    this.uploadsDir = uploadsDir;
    this.clipsDir = clipsDir;
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.clipsDir, { recursive: true });
      logger.info('Storage directories initialized');
    } catch (error) {
      logger.error(error, 'Failed to initialize storage');
    }
  }

  /**
   * Save uploaded file
   */
  async saveUpload(file) {
    try {
      const id = uuidv4();
      const ext = this.getFileExtension(file.originalname);
      const filename = `${id}${ext}`;
      const filepath = join(this.uploadsDir, filename);

      await fs.writeFile(filepath, file.buffer);

      logger.info(`File saved: ${filename}`);
      return { id, filename, filepath };
    } catch (error) {
      logger.error(error, 'Failed to save file');
      throw error;
    }
  }

  /**
   * Get file size
   */
  async getFileSize(filepath) {
    try {
      const stats = await fs.stat(filepath);
      return stats.size;
    } catch (error) {
      logger.error(error, `Failed to get file size: ${filepath}`);
      return 0;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filepath) {
    try {
      await fs.unlink(filepath);
      logger.info(`File deleted: ${filepath}`);
    } catch (error) {
      logger.error(error, `Failed to delete file: ${filepath}`);
    }
  }

  /**
   * Clean up old files (older than 24 hours)
   */
  async cleanup(maxAge = 24 * 60 * 60 * 1000) {
    try {
      const now = Date.now();
      const files = await fs.readdir(this.uploadsDir);

      for (const file of files) {
        const filepath = join(this.uploadsDir, file);
        const stats = await fs.stat(filepath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          await this.deleteFile(filepath);
          logger.info(`Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      logger.error(error, 'Cleanup failed');
    }
  }

  /**
   * List clips
   */
  async listClips() {
    try {
      const files = await fs.readdir(this.clipsDir);
      return files.map(file => ({
        name: file,
        path: join(this.clipsDir, file)
      }));
    } catch (error) {
      logger.error(error, 'Failed to list clips');
      return [];
    }
  }

  /**
   * Get file extension
   */
  getFileExtension(filename) {
    const match = filename.match(/\.[^.]+$/);
    return match ? match[0] : '';
  }

  /**
   * Validate file
   */
  validateFile(file) {
    const validTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'audio/aac',
      'video/x-msvideo',
      'video/x-matroska'
    ];

    if (!validTypes.some(t => file.mimetype.startsWith(t.split('/')[0]))) {
      throw new Error('Invalid file type');
    }

    if (file.size > 10 * 1024 * 1024 * 1024) {
      throw new Error('File too large (max 10GB)');
    }

    return true;
  }

  /**
   * Get storage stats
   */
  async getStats() {
    try {
      const uploadFiles = await fs.readdir(this.uploadsDir);
      const clipFiles = await fs.readdir(this.clipsDir);

      let uploadSize = 0;
      for (const file of uploadFiles) {
        const size = await this.getFileSize(join(this.uploadsDir, file));
        uploadSize += size;
      }

      let clipSize = 0;
      for (const file of clipFiles) {
        const size = await this.getFileSize(join(this.clipsDir, file));
        clipSize += size;
      }

      return {
        uploads: {
          count: uploadFiles.length,
          size: uploadSize,
          sizeGB: (uploadSize / (1024 * 1024 * 1024)).toFixed(2)
        },
        clips: {
          count: clipFiles.length,
          size: clipSize,
          sizeGB: (clipSize / (1024 * 1024 * 1024)).toFixed(2)
        },
        total: {
          size: uploadSize + clipSize,
          sizeGB: ((uploadSize + clipSize) / (1024 * 1024 * 1024)).toFixed(2)
        }
      };
    } catch (error) {
      logger.error(error, 'Failed to get storage stats');
      return null;
    }
  }
}

// Export singleton instance
export const storage = new StorageService(
  process.env.UPLOADS_DIR || './uploads',
  process.env.CLIPS_DIR || './clips'
);
