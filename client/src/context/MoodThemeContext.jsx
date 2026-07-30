import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const MoodThemeContext = createContext(null);

const DEFAULT_MOOD = 'default';

export function MoodThemeProvider({ children }) {
  const [currentMood, setCurrentMoodState] = useState(DEFAULT_MOOD);

  const setMood = useCallback((mood) => {
    if (!mood) {
      setCurrentMoodState(DEFAULT_MOOD);
      return;
    }
    const normalized = mood.toLowerCase().trim();
    setCurrentMoodState(normalized);
  }, []);

  const resetMood = useCallback(() => {
    setCurrentMoodState(DEFAULT_MOOD);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const validMoods = [
      'chill', 'happy', 'sad', 'focused', 'sleepy', 'energetic',
      'romantic', 'nostalgic', 'rainy', 'cozy', 'anxious', 'angry',
    ];

    root.classList.remove(...validMoods.map((m) => `theme-${m}`));

    if (currentMood && currentMood !== DEFAULT_MOOD && validMoods.includes(currentMood)) {
      root.classList.add(`theme-${currentMood}`);
    }
  }, [currentMood]);

  useEffect(() => {
    const root = document.documentElement;
    const style = getComputedStyle(root);

    const vars = [
      '--mood-bg-primary', '--mood-bg-secondary', '--mood-bg-card',
      '--mood-bg-hover', '--mood-accent', '--mood-accent-light',
      '--mood-accent-dark', '--mood-glass', '--mood-glass-border', '--mood-glow',
    ];

    vars.forEach((v) => {
      const val = style.getPropertyValue(v).trim();
      if (val) {
        root.style.setProperty(v.replace('mood-', ''), val);
      }
    });
  }, [currentMood]);

  return (
    <MoodThemeContext.Provider value={{ currentMood, setMood, resetMood }}>
      {children}
    </MoodThemeContext.Provider>
  );
}

export function useMoodTheme() {
  const ctx = useContext(MoodThemeContext);
  if (!ctx) throw new Error('useMoodTheme must be used within MoodThemeProvider');
  return ctx;
}
