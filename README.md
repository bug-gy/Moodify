# Moodify

Lo-fi AI mood-based music recommendation app. Describe your vibe and get real YouTube Music tracks — no manual searching.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Vite, Axios |
| Backend | Node.js, Express, Passport.js |
| Database | MongoDB + Mongoose |
| Auth | Google OAuth 2.0 (JWT) |
| AI | Google Gemini (`gemini-2.0-flash`) |
| Music | YouTube Music (via sigma67/ytmusicapi) + yt-dlp fallback |

## Prerequisites

- **Node.js** >= 18
- **Python** >= 3.8 (for ytmusicapi)
- **MongoDB** running locally or a cloud URI (MongoDB Atlas)
- **Google Cloud Console** project with OAuth 2.0 credentials
- **Gemini API key** from [Google AI Studio](https://aistudio.google.com/)

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url> && cd Moodify
npm install                # root (just concurrently)
npm install --prefix server
npm install --prefix client
```

### 2. Python setup (music API)

```bash
pip install ytmusicapi yt-dlp
```

Then run the auth setup to export your YouTube Music browser cookies:

```bash
cd server/services
python setup_ytmusic.py   # Follow prompts to paste cookies
```

This creates `server/services/ytmusic_headers.json`. Without this file the backend cannot search YouTube Music.

### 3. Environment variables

Copy the example env file and fill in the values:

```bash
cp server/.env.example server/.env
```

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Random secret for signing tokens |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Must be `http://localhost:5000/api/auth/google/callback` |
| `GEMINI_API_KEY` | API key from Google AI Studio |
| `CLIENT_URL` | Frontend URL (`http://localhost:5173`) |

### 4. Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → **APIs & Services** → **Credentials**
3. Create an **OAuth 2.0 Client ID** (Web application)
4. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
5. Copy the Client ID and Client Secret into `.env`

### 5. Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Get an API key for Gemini
3. Add it to `.env` as `GEMINI_API_KEY`

### 6. Run the app

```bash
npm run dev
```

This starts both the server (`:5000`) and client (`:5173`) concurrently.

## Project Structure

```
Moodify/
├── client/                   # React frontend
│   └── src/
│       ├── App.jsx           # Routes (/, /login, /dashboard, /playlist/:id, /now-playing)
│       ├── components/       # AudioPlayer (context+bar+queue), TrackCard, PlaylistCard, etc.
│       ├── pages/            # Home, Login, Dashboard, NowPlaying, PlaylistPage
│       ├── context/          # AuthContext (Google OAuth + JWT)
│       ├── hooks/            # Axios instance with auth interceptor
│       └── styles/           # Global CSS
├── server/                   # Express backend
│   ├── config/               # Passport strategy + MongoDB connection
│   ├── controllers/          # Route handlers (mood, playlist, user, auth)
│   ├── middleware/            # JWT auth middleware
│   ├── models/               # User, Track, Playlist schemas
│   ├── routes/               # auth, mood, playlist, track
│   ├── services/             # aiService (Gemini), musicApi + music_api.py (ytmusicapi bridge), setup_ytmusic.py
│   └── seeds/                # Legacy seed data (unused)
└── .specify/                 # Project memory / constitution
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/google` | Initiate Google OAuth |
| `GET` | `/api/auth/google/callback` | OAuth callback (returns JWT) |
| `GET` | `/api/auth/me` | Get current user |
| `GET` | `/api/mood/:mood` | Get recommendations by mood label |
| `POST` | `/api/mood/recommend` | Get recommendations by text prompt |
| `GET` | `/api/playlist` | List user playlists |
| `POST` | `/api/playlist` | Create playlist |
| `GET` | `/api/playlist/:id` | Get playlist with tracks |
| `DELETE` | `/api/playlist/:id` | Delete playlist |
| `PUT` | `/api/playlist/:id/track` | Remove track from playlist |
| `POST` | `/api/track/save` | Save track to "Liked Songs" |
| `POST` | `/api/track/unsave` | Remove track from "Liked Songs" |
| `GET` | `/api/track/check-saved/:externalApiId` | Check if track is saved |
| `GET` | `/api/track/:id/stream` | Get playable stream URL |
| `GET` | `/api/health` | Health check |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` | Seek back 5s |
| `→` | Seek forward 5s |

## Notes

- The app requires a stable internet connection to stream from YouTube Music.
- Stream URLs expire — the app re-fetches them as needed.
- Playback state (current track, queue, volume) persists across page refreshes via `localStorage`.
- If a stream fails, the ⚠ icon appears — skip to the next track.
