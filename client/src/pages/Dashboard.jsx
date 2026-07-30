import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../components/AudioPlayer';
import TrackCard from '../components/TrackCard';
import PlaylistCard from '../components/PlaylistCard';
import MoodCard from '../components/MoodCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../hooks/useApi';

const moods = [
  { mood: 'chill', label: 'Chill' },
  { mood: 'happy', label: 'Happy' },
  { mood: 'sad', label: 'Sad' },
  { mood: 'focused', label: 'Focused' },
  { mood: 'sleepy', label: 'Sleepy' },
  { mood: 'energetic', label: 'Energetic' },
  { mood: 'romantic', label: 'Romantic' },
  { mood: 'nostalgic', label: 'Nostalgic' },
  { mood: 'rainy', label: 'Rainy' },
  { mood: 'cozy', label: 'Cozy' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { play, currentTrack } = usePlayer();
  const [searchParams] = useSearchParams();

  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [activeMood, setActiveMood] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [lastQuery, setLastQuery] = useState(null);
  const [lastSearchType, setLastSearchType] = useState(null);

  const fetchTracksByMood = useCallback(async (mood, page = 0, append = false) => {
    if (page === 0) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    if (page === 0) setHasSearched(true);
    try {
      const { data } = await api.get(`/api/mood/${mood}?page=${page}`);
      if (append) {
        setTracks((prev) => [...prev, ...data.tracks]);
      } else {
        setTracks(data.tracks);
      }
      setActiveMood(data.mood);
      setCurrentPage(page);
      setHasMore(data.hasMore);
      setLastQuery(mood);
      setLastSearchType('mood');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch recommendations');
      if (!append) setTracks([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchTracksByText = useCallback(async (prompt, page = 0, append = false) => {
    if (page === 0) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    if (page === 0) setHasSearched(true);
    try {
      const { data } = await api.post(`/api/mood/recommend?page=${page}`, { prompt });
      if (append) {
        setTracks((prev) => [...prev, ...data.tracks]);
      } else {
        setTracks(data.tracks);
      }
      setActiveMood(data.parsed?.tags?.[0] || null);
      setCurrentPage(page);
      setHasMore(data.hasMore);
      setLastQuery(prompt);
      setLastSearchType('text');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch recommendations');
      if (!append) setTracks([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = currentPage + 1;
    if (lastSearchType === 'mood') {
      fetchTracksByMood(lastQuery, nextPage, true);
    } else if (lastSearchType === 'text') {
      fetchTracksByText(lastQuery, nextPage, true);
    }
  };

  const fetchPlaylists = useCallback(async () => {
    try {
      const { data } = await api.get('/api/playlist');
      setPlaylists(data.playlists);
    } catch {}
  }, []);

  const initialMood = searchParams.get('mood');
  const initialPrompt = searchParams.get('prompt');

  useEffect(() => {
    if (initialMood) {
      fetchTracksByMood(initialMood, 0, false);
    } else if (initialPrompt) {
      fetchTracksByText(initialPrompt, 0, false);
    }
    fetchPlaylists();
  }, [initialMood, initialPrompt, fetchTracksByMood, fetchTracksByText, fetchPlaylists]);

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      fetchTracksByText(textInput.trim(), 0, false);
    }
  };

  const handlePlay = (track) => {
    play(track, tracks.filter((t) => t.externalApiId !== track.externalApiId));
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

  const handleSaved = () => {
    fetchPlaylists();
  };

  return (
    <div className="page dashboard-page">
      <div className="dashboard-sidebar">
        <div className="sidebar-section">
          <h3>Pick a Mood</h3>
          <div className="sidebar-moods">
            {moods.map((m) => (
              <MoodCard
                key={m.mood}
                mood={m.mood}
                label={m.label}
                onClick={() => fetchTracksByMood(m.mood, 0, false)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        {!hasSearched && !loading ? (
          <section className="welcome-section">
            <h2>How are you feeling?</h2>
            <p>Pick a mood from the sidebar, or describe your vibe below.</p>
            <form className="text-input-form" onSubmit={handleTextSubmit}>
              <input
                type="text"
                placeholder="e.g., 'studying on a rainy night'"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="text-input"
              />
              <button type="submit" className="btn btn-primary">Get Recommendations</button>
            </form>
          </section>
        ) : null}

        {loading ? <LoadingSpinner /> : null}

        {error ? <p className="error-msg">{error}</p> : null}

        {!loading && hasSearched && tracks.length === 0 && !error ? (
          <p className="empty-msg">No tracks found. Try a different mood.</p>
        ) : null}

        {!loading && tracks.length > 0 ? (
          <section className="recommendations-section">
            <div className="section-header">
              <h2>{activeMood ? `${activeMood.charAt(0).toUpperCase() + activeMood.slice(1)} Recommendations` : 'Recommendations'}</h2>
            </div>
            <div className="track-list">
              {tracks.map((track) => (
                <TrackCard
                  key={track.externalApiId}
                  track={track}
                  onPlay={handlePlay}
                  isPlaying={currentTrack?.externalApiId === track.externalApiId}
                  onSaved={handleSaved}
                />
              ))}
            </div>
            {hasMore ? (
              <div className="load-more-wrap">
                <button
                  className="btn btn-secondary load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="playlists-section">
          <h2>Your Playlists</h2>
          {playlists.length === 0 ? (
            <p className="empty-msg">No saved playlists yet. Save some tracks!</p>
          ) : (
            <div className="playlist-list">
              {playlists.map((pl) => (
                <PlaylistCard key={pl._id} playlist={pl} onDeleted={handleSaved} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
