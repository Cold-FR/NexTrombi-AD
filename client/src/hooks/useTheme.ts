import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const isDark = theme === 'dark';

    // Si le navigateur ne supporte pas l'API (vieux navigateurs), on fait le changement classique
    if (!document.startViewTransition) {
      setTheme(isDark ? 'light' : 'dark');
      return;
    }

    document.startViewTransition(() => {
      setTheme(isDark ? 'light' : 'dark');
    });
  };

  return { theme, toggleTheme };
}
