import { useState } from 'react';
import api from '../hooks/useApi';

export default function TrackCard({ track, onPlay, isPlaying, onSaved, showSave = true }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const formatDuration = (ms) => {
    if (!ms) return '--:--';
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (saving || saved) return;
    setSaving(true);
    try {
      await api.post('/api/track/save', {
        externalApiId: track.externalApiId,
        title: track.title,
        artist: track.artist,
        album: track.album,
        artworkUrl: track.artworkUrl,
        durationMs: track.durationMs,
        apiSource: track.apiSource || 'youtube_music',
      });
      setSaved(true);
      onSaved?.();
    } catch {
      setSaving(false);
    }
  };

  const handlePlay = async () => {
    if (track._id && !track.streamUrl) {
      try {
        const { data } = await api.get(`/api/track/${track._id}/stream`);
        track.streamUrl = data.streamUrl;
      } catch {}
    }
    onPlay?.(track);
  };

  return (
    <div className="track-card">
      <div className="track-artwork">
        <img src={track.artworkUrl} alt={track.title} />
        {track.externalApiId ? (
          <button className="track-play-btn" onClick={handlePlay}>
            {isPlaying
              ? <svg key="pause" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              : <svg key="play" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><polygon points="6 3 20 12 6 21 6 3"/></svg>}
          </button>
        ) : null}
      </div>
      <div className="track-info">
        <span className="track-title">{track.title}</span>
        <span className="track-artist">{track.artist}</span>
      </div>
      {showSave && !saved ? (
        <button className={`btn-save ${saving ? 'saving' : ''}`} onClick={handleSave} disabled={saving}>
          {saving ? '...' : '+ Save'}
        </button>
      ) : null}
      <span className="track-duration">{formatDuration(track.durationMs)}</span>
    </div>
  );
}
