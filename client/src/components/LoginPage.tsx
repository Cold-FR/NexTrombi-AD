import { Loader2, Eye, EyeOff, Users } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { btnHover, btnTap, iconBtnTap } from '../lib/motionVariants';
import ThemeToggleButton from './ThemeToggleButton';
import { LegalNoticesModal } from './LegalNoticesModal';

interface LoginPageProps {
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
  loginError: string;
  theme: string;
  toggleTheme: () => void;
}

export default function LoginPage({
  onSubmit,
  isLoading,
  loginError,
  theme,
  toggleTheme,
}: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 font-sans sm:px-6 lg:px-8 dark:bg-gray-900">
      {/* Bouton thème coin haut droit */}
      <ThemeToggleButton
        theme={theme}
        toggleTheme={toggleTheme}
        className="fixed top-4 right-4 shadow-sm"
      />

      <div className="w-full max-w-md space-y-4 rounded-xl border border-gray-100 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="text-center">
          <div className="bg-primary-600 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm">
            <Users size={28} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">NexTrombi-AD</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Connectez-vous avec vos identifiants Windows
          </p>
        </div>

        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Identifiant
              </label>
              <input
                name="username"
                type="text"
                required
                className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors placeholder:text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500"
                placeholder="dupont.j"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 transition-colors placeholder:text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500"
                  placeholder="••••••••"
                />
                <motion.button
                  type="button"
                  onMouseDown={() => setShowPassword(true)}
                  onMouseUp={() => setShowPassword(false)}
                  onMouseLeave={() => setShowPassword(false)}
                  onTouchStart={() => setShowPassword(true)}
                  onTouchEnd={() => setShowPassword(false)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={iconBtnTap}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={-1}
                  aria-label="Maintenir pour afficher le mot de passe"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </motion.button>
              </div>
            </div>
          </div>

          {loginError && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-2 text-center text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
              {loginError}
            </div>
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={isLoading ? {} : btnHover}
            whileTap={isLoading ? {} : btnTap}
            className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 flex w-full justify-center rounded-lg border border-transparent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              'Accéder au trombinoscope'
            )}
          </motion.button>
        </form>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2 text-xs text-gray-400 sm:flex-row sm:gap-4 dark:text-gray-500">
        <span>
          © {new Date().getFullYear()}{' '}
          <span className="font-medium text-gray-500 dark:text-gray-400">
            {import.meta.env.VITE_APP_COMPANY_NAME || 'Mon organisation'}
          </span>
        </span>

        <span className="hidden sm:inline">·</span>

        <button
          onClick={() => setIsLegalModalOpen(true)}
          className="cursor-pointer transition-colors hover:text-blue-600 dark:hover:text-blue-400"
        >
          Mentions Légales & RGPD
        </button>

        <span className="hidden sm:inline">·</span>

        <a
          href="https://github.com/Cold-FR/NexTrombi-AD"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          NexTrombi-AD
        </a>
      </div>

      <LegalNoticesModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} />
    </div>
  );
}
