require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const connectDB = require('./config/db');
require('./config/passport');

const authRoutes = require('./routes/auth');
const moodRoutes = require('./routes/mood');
const playlistRoutes = require('./routes/playlist');
const trackRoutes = require('./routes/track');
const { execFile } = require('child_process');
const { Readable } = require('stream');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/playlist', playlistRoutes);
app.use('/api/track', trackRoutes);

app.get('/api/proxy/audio/:videoId', async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || videoId.length < 5) {
    return res.status(400).json({ error: 'Invalid videoId' });
  }
  try {
    const pyScript = path.join(__dirname, 'services', 'music_api.py');
    const result = await new Promise((resolve, reject) => {
      execFile('python3', [pyScript, 'stream', videoId], { timeout: 15000 }, (err, stdout) => {
        if (err) return reject(new Error(stderr?.trim() || err.message));
        try { resolve(JSON.parse(stdout.trim())); }
        catch (e) { reject(new Error('Failed to parse stream response')); }
      });
    });
    const streamUrl = result?.streamUrl;
    if (!streamUrl) {
      return res.status(404).json({ error: 'No stream URL available' });
    }
    const controller = new AbortController();
    req.on('close', () => controller.abort());
    const response = await fetch(streamUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://music.youtube.com',
        'Origin': 'https://music.youtube.com',
      },
    });
    if (!response.ok) {
      return res.status(502).json({ error: `Audio source returned ${response.status}` });
    }
    const contentType = response.headers.get('content-type') || 'audio/webm';
    res.set('Content-Type', contentType);
    res.set('Accept-Ranges', 'bytes');
    if (response.body) {
      Readable.fromWeb(response.body)
        .on('error', () => { if (!res.headersSent) res.status(502).end(); })
        .pipe(res);
    } else {
      res.status(502).json({ error: 'No response body' });
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.error('Audio proxy error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Audio playback unavailable' });
    }
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const publicDir = path.join(__dirname, 'public');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
