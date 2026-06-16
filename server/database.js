import sqlite3Pkg from 'sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const sqlite3 = sqlite3Pkg.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '..', 'fitness-data');
const dbPath = path.join(dataDir, 'fitness.sqlite');

let db = null;

export async function initDatabase() {
  await mkdir(dataDir, { recursive: true });

  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        return reject(err);
      }

      db.run('PRAGMA foreign_keys = ON');

      db.serialize(() => {
        db.run(`
          CREATE TABLE IF NOT EXISTS app_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            state_json TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS uploaded_videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            url TEXT NOT NULL,
            created_at TEXT NOT NULL
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS health_measurements (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            weight REAL NOT NULL,
            waist REAL,
            hips REAL,
            arms REAL,
            thighs REAL,
            chest REAL,
            timestamp TEXT NOT NULL
          )
        `);

        resolve();
      });
    });
  });
}

export function getAppState() {
  return new Promise((resolve, reject) => {
    db.get('SELECT state_json FROM app_state WHERE id = 1', (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);
      try {
        resolve(JSON.parse(row.state_json));
      } catch (parseErr) {
        reject(parseErr);
      }
    });
  });
}

export function saveAppState(state) {
  const jsonStr = JSON.stringify(state);
  const updatedAt = new Date().toISOString();

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO app_state (id, state_json, updated_at)
       VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         state_json = excluded.state_json,
         updated_at = excluded.updated_at`,
      [jsonStr, updatedAt],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function syncMeasurements(progressArray) {
  if (!Array.isArray(progressArray) || progressArray.length === 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      try {
        const stmt = db.prepare(`
          INSERT INTO health_measurements (id, date, weight, waist, hips, arms, thighs, chest, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            date = excluded.date,
            weight = excluded.weight,
            waist = excluded.waist,
            hips = excluded.hips,
            arms = excluded.arms,
            thighs = excluded.thighs,
            chest = excluded.chest,
            timestamp = excluded.timestamp
        `);

        for (const entry of progressArray) {
          const id = entry.id;
          const date = entry.date;
          const weight = parseFloat(entry.weight) || 0;
          const waist = entry.waist && entry.waist !== '' ? parseFloat(entry.waist) : null;
          const hips = entry.hips && entry.hips !== '' ? parseFloat(entry.hips) : null;
          const arms = entry.arms && entry.arms !== '' ? parseFloat(entry.arms) : null;
          const thighs = entry.thighs && entry.thighs !== '' ? parseFloat(entry.thighs) : null;
          const chest = entry.chest && entry.chest !== '' ? parseFloat(entry.chest) : null;
          const timestamp = entry.timestamp || new Date().toISOString();

          stmt.run(id, date, weight, waist, hips, arms, thighs, chest, timestamp);
        }

        stmt.finalize();

        db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      } catch (err) {
        db.run('ROLLBACK');
        reject(err);
      }
    });
  });
}

export function saveUploadedVideo(fileName, originalName, mimeType, url) {
  const createdAt = new Date().toISOString();
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO uploaded_videos (file_name, original_name, mime_type, url, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [fileName, originalName, mimeType, url, createdAt],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}
