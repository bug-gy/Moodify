import { useNavigate } from 'react-router-dom';

const moodIcons = {
  chill: '🍃',
  happy: '☀️',
  sad: '🌧️',
  focused: '🎯',
  sleepy: '🌙',
  energetic: '⚡',
  romantic: '💕',
  nostalgic: '📸',
  rainy: '🌊',
  cozy: '🛋️',
  anxious: '🌪️',
  angry: '🔥',
};

export default function MoodCard({ mood, label, onClick }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(mood);
    } else {
      navigate(`/dashboard?mood=${mood}`);
    }
  };

  return (
    <button className="mood-card" onClick={handleClick}>
      <span className="mood-icon">{moodIcons[mood] || '🎵'}</span>
      <span className="mood-label">{label || mood}</span>
    </button>
  );
}
