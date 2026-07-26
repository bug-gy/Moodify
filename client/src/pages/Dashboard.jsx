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
  const [error, setError] = useState(null);
  const [activeMood, setActiveMood] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const fetchTracksByMood = useCallback(async (mood) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const { data } = await api.get(`/api/mood/${mood}`);
      setTracks(data.tracks);
      setActiveMood(data.mood);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch recommendations');
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTracksByText = useCallback(async (prompt) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const { data } = await api.post('/api/mood/recommend', { prompt });
      setTracks(data.tracks);
      setActiveMood(data.parsed?.tags?.[0] || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch recommendations');
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
      fetchTracksByMood(initialMood);
    } else if (initialPrompt) {
      fetchTracksByText(initialPrompt);
    }
    fetchPlaylists();
  }, [initialMood, initialPrompt, fetchTracksByMood, fetchTracksByText, fetchPlaylists]);

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      fetchTracksByText(textInput.trim());
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
                onClick={() => fetchTracksByMood(m.mood)}
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
