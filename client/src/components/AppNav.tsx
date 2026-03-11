import { Search, Users, LogOut, X } from 'lucide-react';
import { motion } from 'motion/react';
import { btnHover, btnTap } from '../lib/motionVariants';
import ThemeToggleButton from './ThemeToggleButton';

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

function SearchInput({ value, onChange, className }: SearchInputProps) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pr-9 pl-9 text-sm text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        placeholder="Chercher un nom, un service..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <div
          className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 hover:opacity-75"
          onClick={() => onChange('')}
        >
          <X className="h-4 w-4 text-gray-400" />
        </div>
      )}
    </div>
  );
}

interface AppNavProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  theme: string;
  toggleTheme: () => void;
  onLogout: () => void;
}

export default function AppNav({
  searchTerm,
  onSearchChange,
  theme,
  toggleTheme,
  onLogout,
}: AppNavProps) {
  return (
    <nav className="relative z-10 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Ligne principale */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="bg-primary-600 flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm sm:h-9 sm:w-9">
            <Users size={18} className="sm:size-5" />
          </div>
          <span className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
            NexTrombi-AD
          </span>
        </div>

        {/* Actions droite */}
        <div className="flex shrink-0 items-center gap-3">
          {/* Recherche desktop */}
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            className="hidden sm:block sm:w-64 md:w-72 lg:w-80"
          />

          {/* Bouton thème */}
          <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />

          {/* Bouton déconnexion */}
          <motion.button
            onClick={onLogout}
            whileHover={btnHover}
            whileTap={btnTap}
            className="flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-red-500"
            title="Se déconnecter"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Quitter</span>
          </motion.button>
        </div>
      </div>

      {/* Recherche mobile */}
      <div className="px-4 pb-3 sm:hidden">
        <SearchInput value={searchTerm} onChange={onSearchChange} />
      </div>
    </nav>
  );
}
