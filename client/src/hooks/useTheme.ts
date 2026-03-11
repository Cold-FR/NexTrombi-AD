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

  const toggleTheme = (event?: React.MouseEvent) => {
    const isDark = theme === 'dark';

    // On capture la position de la souris (ou le centre par défaut)
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;

    // On passe ces coordonnées au CSS via des variables
    document.documentElement.style.setProperty('--x', `${x}px`);
    document.documentElement.style.setProperty('--y', `${y}px`);

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
