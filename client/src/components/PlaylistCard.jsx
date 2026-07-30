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
          <div className="playlist-card-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
        )}
      </div>
      <div className="playlist-card-info">
        <h3>{playlist.title}</h3>
        {playlist.description && <p>{playlist.description}</p>}
        <span className="playlist-count">{playlist.tracks?.length || 0} tracks</span>
      </div>
      <button className="btn-icon" onClick={handleDelete} disabled={deleting}>
        {deleting ? '...' : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        )}
      </button>
    </div>
  );
}
