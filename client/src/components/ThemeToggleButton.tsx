import { Sun, Moon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { iconBtnTap, sunMoonEnter, sunMoonExit } from '../lib/motionVariants';

interface ThemeToggleButtonProps {
  theme: string;
  toggleTheme: (e: React.MouseEvent) => void;
  className?: string;
}

export default function ThemeToggleButton({
  theme,
  toggleTheme,
  className,
}: ThemeToggleButtonProps) {
  return (
    <motion.button
      onClick={(e) => toggleTheme(e)}
      whileTap={iconBtnTap}
      className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 ${className ?? ''}`}
      title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label="Changer de thème"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'light' ? (
          <motion.span
            key="sun"
            initial={{ x: 24, y: 16, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1, transition: sunMoonEnter }}
            exit={{ x: -24, y: 16, opacity: 0, transition: sunMoonExit }}
            className="flex items-center justify-center text-amber-500"
          >
            <Sun size={18} />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ x: 24, y: 16, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1, transition: sunMoonEnter }}
            exit={{ x: -24, y: 16, opacity: 0, transition: sunMoonExit }}
            className="flex items-center justify-center text-violet-500"
          >
            <Moon size={18} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
