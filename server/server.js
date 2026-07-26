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
