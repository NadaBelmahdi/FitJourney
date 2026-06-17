import cors from 'cors';
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import {
  initDatabase,
  getAppState,
  saveAppState,
  syncMeasurements,
  saveUploadedVideo,
} from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const uploadsDir = path.join(rootDir, 'uploads');
const distDir = path.join(rootDir, 'dist');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await mkdir(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    } catch (err) {
      cb(err, null);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const fileName = `workout-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // limit 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/uploads', express.static(uploadsDir));

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.get('/api/fitness', async (req, res) => {
  try {
    const state = await getAppState();
    if (!state) {
      return res.json({
        profile: null,
        progress: [],
        meals: {},
        workouts: {},
        weekPlan: {},
        aiEstimate: null,
        videos: [],
        activeTab: 'dashboard',
      });
    }
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fitness', async (req, res) => {
  try {
    const state = req.body;
    if (!state || typeof state !== 'object') {
      return res.status(400).json({ error: 'Invalid state object' });
    }

    await saveAppState(state);

    if (state.progress && Array.isArray(state.progress)) {
      await syncMeasurements(state.progress);
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload-video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const fileUrl = `uploads/${req.file.filename}`;
    const videoId = await saveUploadedVideo(
      req.file.filename,
      req.file.originalname,
      req.file.mimetype,
      fileUrl
    );

    res.json({
      ok: true,
      url: '/' + fileUrl,
      videoId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static(distDir));

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await initDatabase();
    if (process.env.VERCEL !== '1') {
      app.listen(PORT, () => {
        console.log(`FitJourney Server running on http://localhost:${PORT}`);
      });
    }
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;
