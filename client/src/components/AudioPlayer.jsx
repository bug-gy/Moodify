import { useState, useRef, useEffect, createContext, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'moodify_player';

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return {
      currentTrack: data.currentTrack || null,
      queue: data.queue || [],
      history: data.history || [],
      volume: typeof data.volume === 'number' ? data.volume : 0.7,
    };
  } catch {
    return {};
  }
}

function saveSession(currentTrack, queue, history, volume) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentTrack,
      queue,
      history,
      volume,
    }));
  } catch {}
}

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const initial = loadSession();

  const [currentTrack, setCurrentTrack] = useState(initial.currentTrack || null);
  const [queue, setQueue] = useState(initial.queue || []);
  const [history, setHistory] = useState(initial.history || []);
  const [isPlaying, setIsPlaying] = useState(false);
  const [paused, setPaused] = useState(true);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(typeof initial.volume === 'number' ? initial.volume : 0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  const [audioError, setAudioError] = useState(false);

  // persist to localStorage on state changes
  useEffect(() => {
    saveSession(currentTrack, queue, history, volume);
  }, [currentTrack, queue, history, volume]);

  const [audioRetryKey, setAudioRetryKey] = useState(0);

  useEffect(() => {
    setAudioError(false);
  }, [currentTrack?.externalApiId, audioRetryKey]);

  const getAudioUrl = useCallback((track) => {
    if (!track) return '';
    if (track.externalApiId) {
      return `/api/proxy/audio/${track.externalApiId}`;
    }
    return track.streamUrl || '';
  }, []);

  const retryAudio = useCallback(() => {
    setAudioError(false);
    setAudioRetryKey((k) => k + 1);
  }, []);

  const hasPrev = history.length > 0;
  const hasNext = queue.length > 0;

  const play = useCallback((track, trackQueue = []) => {
    setHistory((prev) => (currentTrack ? [...prev, currentTrack] : prev));
    setCurrentTrack(track);
    setQueue(trackQueue);
    setIsPlaying(true);
    setPaused(false);
    setProgress(0);
    setCurrentTime(0);
    setAudioError(false);
  }, [currentTrack]);

  const playNext = useCallback(() => {
    if (queue.length === 0) return;
    setHistory((prev) => [...prev, currentTrack]);
    const [next, ...rest] = queue;
    setCurrentTrack(next);
    setQueue(rest);
    setProgress(0);
    setCurrentTime(0);
    setAudioError(false);
  }, [queue, currentTrack]);

  const playPrev = useCallback(() => {
    if (history.length === 0) return;
    const prevTrack = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setQueue((prev) => [currentTrack, ...prev]);
    setCurrentTrack(prevTrack);
    setProgress(0);
    setCurrentTime(0);
    setAudioError(false);
  }, [history, currentTrack]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTrack(null);
    setQueue([]);
    setHistory([]);
    setPaused(true);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  const togglePause = useCallback(() => {
    setPaused((p) => !p);
  }, []);

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const removeFromQueue = useCallback((idx) => {
    setQueue((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    if (currentTrack?.externalApiId) {
      if (!paused) {
        audioRef.current.play().catch(() => {
          setAudioError(true);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentTrack, paused, audioRetryKey]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (currentTrack) togglePause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 5);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, togglePause]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
    }
  };

  const handleAudioError = () => {
    setAudioError(true);
  };

  const ctx = {
    currentTrack, queue, history, isPlaying, paused, progress, volume, currentTime, duration,
    hasPrev, hasNext, showQueue, audioError,
    play, playNext, playPrev, stop, togglePause, setVolume,
    removeFromQueue, clearQueue, setShowQueue,
    audioRef, navigate, retryAudio, getAudioUrl,
  };

  return (
    <PlayerContext.Provider value={ctx}>
      {currentTrack && currentTrack.externalApiId && (
        <audio
          key={audioRetryKey}
          ref={audioRef}
          src={getAudioUrl(currentTrack)}
          onTimeUpdate={handleTimeUpdate}
          onEnded={playNext}
          onError={handleAudioError}
          autoPlay
          crossOrigin="anonymous"
        />
      )}
      {children}
      {currentTrack && <AudioPlayerBar />}
      {currentTrack && showQueue && <QueuePanel />}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

function QueuePanel() {
  const { queue, setShowQueue, removeFromQueue, clearQueue } = usePlayer();

  return (
    <div className="queue-panel-overlay" onClick={() => setShowQueue(false)}>
      <div className="queue-panel" onClick={(e) => e.stopPropagation()}>
        <div className="queue-panel-header">
          <h3>Up Next ({queue.length})</h3>
          <button className="queue-panel-close" onClick={() => setShowQueue(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {queue.length === 0 ? (
          <p className="queue-empty">Queue is empty</p>
        ) : (
          <>
            <button className="btn btn-sm queue-clear" onClick={clearQueue}>Clear Queue</button>
            <div className="queue-list">
              {queue.map((track, i) => (
                <div key={`${track.externalApiId}-${i}`} className="queue-item">
                  <img src={track.artworkUrl} alt={track.title} className="queue-artwork" />
                  <div className="queue-item-info">
                    <span className="queue-item-title">{track.title}</span>
                    <span className="queue-item-artist">{track.artist}</span>
                  </div>
                  <button className="queue-item-remove" onClick={() => removeFromQueue(i)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AudioPlayerBar() {
  const {
    currentTrack, paused, progress, currentTime, duration, hasPrev, hasNext,
    togglePause, playNext, playPrev, stop, navigate, setShowQueue, queue, audioError, retryAudio,
    audioRef,
  } = usePlayer();

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

  return (
    <div className="audio-player-wrap">
      <div className="audio-player">
        <div className="player-track-info">
          <img src={currentTrack.artworkUrl} alt={currentTrack.title} className="player-artwork" />
          <div className="player-text">
            <span className="player-title">{currentTrack.title}</span>
            <span className="player-artist">{currentTrack.artist}</span>
          </div>
        </div>
        <div className="player-controls">
          <button className="player-btn" onClick={playPrev} disabled={!hasPrev} title="Previous">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="19 20 9 12 19 4 19 20"/>
              <line x1="5" y1="4" x2="5" y2="20"/>
            </svg>
          </button>
          <button className="player-btn player-btn-play" onClick={togglePause}>
            {paused
              ? <svg key="play" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              : <svg key="pause" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>}
          </button>
          <button className="player-btn" onClick={playNext} disabled={!hasNext} title="Next">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"/>
              <line x1="19" y1="4" x2="19" y2="20"/>
            </svg>
          </button>
        </div>
        <div className="player-progress">
          <span>{formatTime(currentTime)}</span>
          <div className="progress-bar" onClick={handleSeek}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
        {audioError && (
          <>
            <span className="player-error" title="Stream unavailable">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </span>
            <button className="player-btn player-btn-retry" onClick={retryAudio} title="Retry">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>
          </>
        )}
        <button className="player-btn player-queue-btn" onClick={() => setShowQueue(true)} title="Queue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          {queue.length > 0 ? <span className="queue-badge">{queue.length}</span> : null}
        </button>
        <button className="player-btn player-expand" onClick={() => navigate('/now-playing')} title="Now Playing">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9"/>
            <polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/>
            <line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
        </button>
        <button className="player-btn player-close" onClick={stop}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
