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

  useEffect(() => {
    setAudioError(false);
  }, [currentTrack?.streamUrl]);

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
  }, [currentTrack]);

  const playNext = useCallback(() => {
    if (queue.length === 0) return;
    setHistory((prev) => [...prev, currentTrack]);
    const [next, ...rest] = queue;
    setCurrentTrack(next);
    setQueue(rest);
    setProgress(0);
    setCurrentTime(0);
  }, [queue, currentTrack]);

  const playPrev = useCallback(() => {
    if (history.length === 0) return;
    const prevTrack = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setQueue((prev) => [currentTrack, ...prev]);
    setCurrentTrack(prevTrack);
    setProgress(0);
    setCurrentTime(0);
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
    if (currentTrack?.streamUrl) {
      if (!paused) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentTrack, paused]);

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
    audioRef, navigate,
  };

  return (
    <PlayerContext.Provider value={ctx}>
      {currentTrack?.streamUrl && (
        <audio
          ref={audioRef}
          src={currentTrack.streamUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={playNext}
          onError={handleAudioError}
          autoPlay
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
          <button className="queue-panel-close" onClick={() => setShowQueue(false)}>✕</button>
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
                  <button className="queue-item-remove" onClick={() => removeFromQueue(i)}>✕</button>
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
    togglePause, playNext, playPrev, stop, navigate, setShowQueue, queue, audioError,
  } = usePlayer();

  const formatTime = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-player">
      <div className="player-track-info">
        <img src={currentTrack.artworkUrl} alt={currentTrack.title} className="player-artwork" />
        <div className="player-text">
          <span className="player-title">{currentTrack.title}</span>
          <span className="player-artist">{currentTrack.artist}</span>
        </div>
      </div>
      <div className="player-controls">
        <button className="player-btn" onClick={playPrev} disabled={!hasPrev} title="Previous">⏮</button>
        <button className="player-btn player-btn-play" onClick={togglePause}>
          {paused ? '▶' : '⏸'}
        </button>
        <button className="player-btn" onClick={playNext} disabled={!hasNext} title="Next">⏭</button>
      </div>
      <div className="player-progress">
        <span>{formatTime(currentTime)}</span>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span>{formatTime(duration)}</span>
      </div>
      {audioError && <span className="player-error" title="Stream unavailable">⚠</span>}
      <button className="player-btn player-queue-btn" onClick={() => setShowQueue(true)} title="Queue">
        ☰{queue.length > 0 ? <span className="queue-badge">{queue.length}</span> : null}
      </button>
      <button className="player-btn player-expand" onClick={() => navigate('/now-playing')} title="Now Playing">
        ⛶
      </button>
      <button className="player-btn player-close" onClick={stop}>✕</button>
    </div>
  );
}
