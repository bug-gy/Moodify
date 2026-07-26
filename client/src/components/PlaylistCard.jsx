import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../hooks/useApi';

export default function PlaylistCard({ playlist, onDeleted }) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm('Delete this playlist?')) return;
    setDeleting(true);
    try {
      await api.delete(`/api/playlist/${playlist._id}`);
      onDeleted?.();
    } catch {
      setDeleting(false);
    }
  };

  const artworkUrl = playlist.tracks?.find((t) => t.artworkUrl)?.artworkUrl;

  return (
    <div className="playlist-card" onClick={() => navigate(`/playlist/${playlist._id}`)}>
      <div className="playlist-card-artwork">
        {artworkUrl ? (
          <img src={artworkUrl} alt={playlist.title} />
        ) : (
          <div className="playlist-card-placeholder">♪</div>
        )}
      </div>
      <div className="playlist-card-info">
        <h3>{playlist.title}</h3>
        {playlist.description && <p>{playlist.description}</p>}
        <span className="playlist-count">{playlist.tracks?.length || 0} tracks</span>
      </div>
      <button className="btn-icon" onClick={handleDelete} disabled={deleting}>
        {deleting ? '...' : '🗑'}
      </button>
    </div>
  );
}
