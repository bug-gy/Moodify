import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../components/AudioPlayer';
import api from '../hooks/useApi';

export default function NowPlaying() {
  const {
    currentTrack, paused, progress, currentTime, duration, volume, audioError,
    togglePause, setVolume, stop, audioRef,
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

      <button className="nowplaying-back" onClick={() => navigate(-1)}>← Back</button>

      <div className="nowplaying-content">
        <div className="nowplaying-clock">{hours}:{minutes}:{seconds}</div>

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
            {saving ? '...' : saved ? '♥' : '♡'}
          </button>
          <button className="nowplaying-btn nowplaying-btn-play" onClick={togglePause}>
            {paused ? '▶' : '⏸'}
          </button>
          <button className="nowplaying-btn nowplaying-btn-stop" onClick={() => { stop(); navigate('/'); }}>⏹</button>
        </div>

        <div className="nowplaying-volume">
          <span className="volume-icon">🔈</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="volume-slider"
          />
          <span className="volume-icon">🔊</span>
        </div>
        {audioError && <p className="player-error">Stream unavailable — try skipping to next track</p>}
      </div>
    </div>
  );
}
