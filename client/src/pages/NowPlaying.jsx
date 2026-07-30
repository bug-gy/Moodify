import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../components/AudioPlayer';
import api from '../hooks/useApi';

export default function NowPlaying() {
  const {
    currentTrack, paused, progress, currentTime, duration, volume, audioError,
    togglePause, setVolume, stop, audioRef,
    playNext, playPrev, hasNext, hasPrev, retryAudio,
  } = usePlayer();
  const navigate = useNavigate();
  const [clock, setClock] = useState(new Date());
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentTrack?.externalApiId) return;
    api.get(`/api/track/check-saved/${currentTrack.externalApiId}`)
      .then(({ data }) => setSaved(data.saved))
      .catch(() => {});
  }, [currentTrack?.externalApiId]);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentTrack) {
    return (
      <div className="nowplaying-page">
        <div className="nowplaying-empty">
          <p>No track playing</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  const hours = clock.getHours().toString().padStart(2, '0');
  const minutes = clock.getMinutes().toString().padStart(2, '0');
  const seconds = clock.getSeconds().toString().padStart(2, '0');

  const formatTime = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    if (audioRef.current) {
      audioRef.current.currentTime = pct * (audioRef.current.duration || 0);
    }
  };

  const handleSaveToggle = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (!saved) {
        await api.post('/api/track/save', {
          externalApiId: currentTrack.externalApiId,
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album,
          artworkUrl: currentTrack.artworkUrl,
          durationMs: currentTrack.durationMs,
          apiSource: currentTrack.apiSource || 'youtube_music',
        });
        setSaved(true);
      } else {
        await api.post('/api/track/unsave', {
          externalApiId: currentTrack.externalApiId,
          apiSource: currentTrack.apiSource || 'youtube_music',
        });
        setSaved(false);
      }
    } catch {}
    setSaving(false);
  };

  return (
    <div className="nowplaying-page">
      <div
        className="nowplaying-bg"
        style={{ backgroundImage: currentTrack.artworkUrl ? `url(${currentTrack.artworkUrl})` : 'none' }}
      />

      <button className="nowplaying-back" onClick={() => navigate(-1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>

      <div className="nowplaying-content">
        <div className="nowplaying-clock-wrap">
          <div className="nowplaying-clock-glass">
            <div className="nowplaying-clock">{hours}:{minutes}:{seconds}</div>
          </div>
        </div>

        <div className="nowplaying-track">
          <img src={currentTrack.artworkUrl} alt={currentTrack.title} className="nowplaying-artwork" />
          <h2 className="nowplaying-title">{currentTrack.title}</h2>
          <p className="nowplaying-artist">{currentTrack.artist}</p>
        </div>

        <div className="nowplaying-progress" onClick={handleSeek}>
          <div className="nowplaying-progress-bar">
            <div className="nowplaying-progress-fill" style={{ width: `${progress}%` }} />
            <div className="nowplaying-progress-thumb" style={{ left: `${progress}%` }} />
          </div>
          <div className="nowplaying-time">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || currentTrack.durationMs / 1000)}</span>
          </div>
        </div>

        <div className="nowplaying-controls">
          <button className="nowplaying-btn nowplaying-btn-save" onClick={handleSaveToggle} disabled={saving}>
            {saving ? '...' : saved
              ? <svg key="heart-filled" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              : <svg key="heart-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
          </button>
          <button className="nowplaying-btn nowplaying-btn-prev" onClick={playPrev} disabled={!hasPrev}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
              <polygon points="19 20 9 12 19 4 19 20"/>
              <line x1="5" y1="4" x2="5" y2="20"/>
            </svg>
          </button>
          <button className="nowplaying-btn nowplaying-btn-play" onClick={togglePause}>
            {paused
              ? <svg key="play" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              : <svg key="pause" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>}
          </button>
          <button className="nowplaying-btn nowplaying-btn-next" onClick={playNext} disabled={!hasNext}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
              <polygon points="5 4 15 12 5 20 5 4"/>
              <line x1="19" y1="4" x2="19" y2="20"/>
            </svg>
          </button>
          <button className="nowplaying-btn nowplaying-btn-stop" onClick={() => { stop(); navigate('/'); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
            </svg>
          </button>
        </div>

        <div className="nowplaying-volume">
          <span className="volume-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="volume-slider"
          />
          <span className="volume-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          </span>
        </div>
        {audioError && (
          <div className="nowplaying-error-row">
            <p className="player-error">Stream unavailable</p>
            <button className="btn btn-sm" onClick={retryAudio} style={{ marginLeft: 12 }}>Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
