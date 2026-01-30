import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import pino from 'pino';

const logger = pino();

/**
 * Initialize SQLite database with schema
 */
export async function initializeDatabase(dbPath = './data/clipforge.db') {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        logger.error(err, 'Failed to open database');
        reject(err);
        return;
      }

      logger.info('Database connected');

      // Create tables
      db.serialize(() => {
        // Videos table
        db.run(`
          CREATE TABLE IF NOT EXISTS videos (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            filepath TEXT NOT NULL,
            size INTEGER,
            duration REAL,
            mime_type TEXT,
            source_url TEXT,
            transcript TEXT,
            analysis TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) logger.error(err, 'Failed to create videos table');
        });

        // Clips table
        db.run(`
          CREATE TABLE IF NOT EXISTS clips (
            id TEXT PRIMARY KEY,
            video_id TEXT NOT NULL,
            start_time REAL NOT NULL,
            end_time REAL NOT NULL,
            duration REAL,
            reason TEXT,
            score REAL,
            hook TEXT,
            filepath TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (video_id) REFERENCES videos(id)
          )
        `, (err) => {
          if (err) logger.error(err, 'Failed to create clips table');
        });

        // Exports table
        db.run(`
          CREATE TABLE IF NOT EXISTS exports (
            id TEXT PRIMARY KEY,
            clip_id TEXT NOT NULL,
            format TEXT NOT NULL,
            quality TEXT,
            filepath TEXT,
            filesize INTEGER,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (clip_id) REFERENCES clips(id)
          )
        `, (err) => {
          if (err) logger.error(err, 'Failed to create exports table');
        });

        // Processing queue table
        db.run(`
          CREATE TABLE IF NOT EXISTS queue (
            id TEXT PRIMARY KEY,
            video_id TEXT NOT NULL,
            priority INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pending',
            progress INTEGER DEFAULT 0,
            error TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            started_at DATETIME,
            completed_at DATETIME,
            FOREIGN KEY (video_id) REFERENCES videos(id)
          )
        `, (err) => {
          if (err) logger.error(err, 'Failed to create queue table');
        });

        // Create indexes
        db.run('CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at)');
        db.run('CREATE INDEX IF NOT EXISTS idx_clips_video_id ON clips(video_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_exports_format ON exports(format)');
        db.run('CREATE INDEX IF NOT EXISTS idx_queue_status ON queue(status)');

        logger.info('Database schema initialized');
      });

      db.close((err) => {
        if (err) {
          logger.error(err, 'Failed to close database');
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  });
}

/**
 * Database helper functions
 */
export function getDatabase(dbPath = './data/clipforge.db') {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

/**
 * Run query
 */
export function runQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Get one row
 */
export function getOne(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * Get all rows
 */
export function getAll(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

/**
 * Close database
 */
export function closeDatabase(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
