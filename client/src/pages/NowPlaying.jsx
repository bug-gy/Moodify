import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../components/AudioPlayer';
import api from '../hooks/useApi';

const bgPresets = [
  { id: 'album', label: 'Album Art', bg: null },
  { id: 'midnight', label: 'Midnight', bg: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1a 70%, #000 100%)' },
  { id: 'gloom', label: 'Gloom', bg: 'radial-gradient(ellipse at center, #2d2a2e 0%, #1a181c 60%, #0d0c0f 100%)' },
  { id: 'peace', label: 'Peaceful', bg: 'radial-gradient(ellipse at center, #2a3b4c 0%, #1a2835 60%, #0e1a26 100%)' },
  { id: 'mist', label: 'Misty', bg: 'radial-gradient(ellipse at center, #3a3a3e 0%, #252528 60%, #18181a 100%)' },
  { id: 'forest', label: 'Forest', bg: 'radial-gradient(ellipse at center, #1e3a2a 0%, #142618 60%, #0b1a10 100%)' },
  { id: 'ocean', label: 'Deep Ocean', bg: 'radial-gradient(ellipse at center, #1a2a4a 0%, #0f1a30 60%, #060e1e 100%)' },
  { id: 'sunset', label: 'Sunset', bg: 'radial-gradient(ellipse at center, #3a1e2a 0%, #2a141e 60%, #1a0a12 100%)' },
  { id: 'warm', label: 'Cozy', bg: 'radial-gradient(ellipse at center, #3a2a1a 0%, #2a1e12 60%, #1a120a 100%)' },
];

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
  const [bgPreset, setBgPreset] = useState('album');

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

  const selectedPreset = bgPresets.find((p) => p.id === bgPreset);
  const bgStyle = selectedPreset?.bg
    ? { backgroundImage: selectedPreset.bg }
    : { backgroundImage: currentTrack.artworkUrl ? `url(${currentTrack.artworkUrl})` : 'none' };

  return (
    <div className="nowplaying-page">
      <div className="nowplaying-bg" style={bgStyle} />

      <button className="nowplaying-back" onClick={() => navigate(-1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <div className="np-sidebar-wrap">
        <div className="np-sidebar">
          <div className="np-sidebar-header">Backgrounds</div>
          <div className="np-sidebar-list">
            {bgPresets.map((preset) => (
              <button
                key={preset.id}
                className={`np-sidebar-item ${bgPreset === preset.id ? 'active' : ''}`}
                onClick={() => setBgPreset(preset.id)}
              >
                <span
                  className="np-sidebar-preview"
                  style={{
                    background: preset.bg || 'var(--bg-card)',
                  }}
                />
                <span className="np-sidebar-label">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="nowplaying-clock-large">{hours}:{minutes}:{seconds}</div>

      <div className="nowplaying-strip-wrap">
        <div className="nowplaying-strip">
          <div className="strip-track">
            <img src={currentTrack.artworkUrl} alt={currentTrack.title} className="strip-artwork" />
            <div className="strip-track-text">
              <span className="strip-title">{currentTrack.title}</span>
              <span className="strip-artist">{currentTrack.artist}</span>
            </div>
          </div>

          <div className="strip-progress" onClick={handleSeek}>
            <div className="strip-progress-bar">
              <div className="strip-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="strip-time">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || currentTrack.durationMs / 1000)}</span>
            </div>
          </div>

          <div className="strip-controls">
            <button className="strip-btn" onClick={playPrev} disabled={!hasPrev} title="Previous">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="19 20 9 12 19 4 19 20"/>
                <line x1="5" y1="4" x2="5" y2="20"/>
              </svg>
            </button>
            <button className="strip-btn strip-btn-play" onClick={togglePause}>
              {paused
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>}
            </button>
            <button className="strip-btn" onClick={playNext} disabled={!hasNext} title="Next">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 4 15 12 5 20 5 4"/>
                <line x1="19" y1="4" x2="19" y2="20"/>
              </svg>
            </button>
          </div>

          <div className="strip-volume">
            <button className="strip-btn strip-btn-vol" onClick={() => setVolume(volume > 0 ? 0 : 0.7)} title="Volume">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {volume === 0
                  ? <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
                  : <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>}
              </svg>
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="strip-volume-slider"
            />
          </div>

          <div className="strip-actions">
            <button className="strip-btn strip-btn-save" onClick={handleSaveToggle} disabled={saving} title={saved ? 'Remove from saved' : 'Save to playlist'}>
              {saving ? '...' : saved
                ? <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
            </button>
            <button className="strip-btn strip-btn-close" onClick={() => { stop(); navigate('/'); }} title="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {audioError && (
          <div className="nowplaying-error-row">
            <p className="player-error">Stream unavailable</p>
            <button className="btn btn-sm" onClick={retryAudio}>Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
