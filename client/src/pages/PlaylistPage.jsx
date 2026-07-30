import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '../components/AudioPlayer';
import TrackCard from '../components/TrackCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../hooks/useApi';

export default function PlaylistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { play, currentTrack } = usePlayer();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlaylist = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/api/playlist/${id}`);
      setPlaylist(data.playlist);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlaylist(); }, [id]);

  const handlePlay = (track) => {
    const others = playlist.tracks.filter((t) => t._id !== track._id);
    play(track, others);
  };

  const handlePlaySaved = async (track) => {
    if (track._id && !track.streamUrl) {
      try {
        const { data } = await api.get(`/api/track/${track._id}/stream`);
        track.streamUrl = data.streamUrl;
      } catch {}
    }
    play(track, []);
  };

  const handleDeleteTrack = async (trackId) => {
    try {
      const { data } = await api.put(`/api/playlist/${id}/track`, { trackId });
      setPlaylist(data.playlist);
    } catch {}
  };

  const handleDeletePlaylist = async () => {
    if (!confirm('Delete this playlist?')) return;
    try {
      await api.delete(`/api/playlist/${id}`);
      navigate('/dashboard');
    } catch {}
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="page">
        <p className="error-msg">{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  if (!playlist) return null;

  return (
    <div className="page playlist-detail-page">
      <div className="playlist-detail-header">
        <button className="btn btn-sm" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
        <div className="playlist-detail-info">
          <h2>{playlist.title}</h2>
          {playlist.description && <p>{playlist.description}</p>}
          <span className="playlist-count">{playlist.tracks?.length || 0} tracks</span>
        </div>
        <button className="btn btn-sm btn-danger" onClick={handleDeletePlaylist}>Delete Playlist</button>
      </div>

      <div className="playlist-detail-tracks">
        {playlist.tracks?.length > 0 ? (
          playlist.tracks.map((track) => (
            <TrackCard
              key={track._id}
              track={track}
              onPlay={handlePlay}
              isPlaying={currentTrack?._id === track._id || currentTrack?.externalApiId === track.externalApiId}
              showSave={false}
            />
          ))
        ) : (
          <p className="empty-msg">No tracks in this playlist</p>
        )}
      </div>
    </div>
  );
}
