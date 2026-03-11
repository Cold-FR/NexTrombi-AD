import { Loader2, Eye, EyeOff, Users } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { btnHover, btnTap, iconBtnTap } from '../lib/motionVariants';
import ThemeToggleButton from './ThemeToggleButton';

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 font-sans sm:px-6 lg:px-8 dark:bg-gray-900">
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
    </div>
  );
}
