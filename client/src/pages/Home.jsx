import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MoodCard from '../components/MoodCard';

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
  { mood: 'anxious', label: 'Anxious' },
  { mood: 'angry', label: 'Angry' },
];

export default function Home() {
  const [textInput, setTextInput] = useState('');
  const navigate = useNavigate();

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      navigate(`/dashboard?prompt=${encodeURIComponent(textInput.trim())}`);
    }
  };

  return (
    <div className="page home">
      <section className="hero">
        <h1 className="hero-title">Moodify</h1>
        <p className="hero-subtitle">Lo-Fi music that matches your mood</p>
        <p className="hero-desc">
          Select a mood or describe how you feel — we'll curate the perfect lo-fi playlist for you.
        </p>
        <form className="text-input-form" onSubmit={handleTextSubmit}>
          <input
            type="text"
            placeholder="How are you feeling? (e.g., 'studying on a rainy night')"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="text-input"
          />
          <button type="submit" className="btn btn-primary">Get Recommendations</button>
        </form>
      </section>

      <section className="mood-grid-section">
        <h2 className="section-title">Pick Your Vibe</h2>
        <div className="mood-grid">
          {moods.map((m) => (
            <MoodCard key={m.mood} mood={m.mood} label={m.label} />
          ))}
        </div>
      </section>
    </div>
  );
}
