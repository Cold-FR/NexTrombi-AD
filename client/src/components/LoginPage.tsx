import { Loader2, Sun, Moon, Users } from 'lucide-react';

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
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 font-sans sm:px-6 lg:px-8 dark:bg-gray-900">
      {/* Bouton thème coin haut droit */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        aria-label="Changer de thème"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="w-full max-w-md space-y-8 rounded-xl border border-gray-100 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="text-center">
          <div className="bg-primary-600 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm">
            <Users size={28} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Annuaire Interne
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Connectez-vous avec vos identifiants Windows
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Identifiant
              </label>
              <input
                name="username"
                type="text"
                required
                className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="jdupont"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mot de passe
              </label>
              <input
                name="password"
                type="password"
                required
                className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          {loginError && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-2 text-center text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 flex w-full justify-center rounded-lg border border-transparent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
