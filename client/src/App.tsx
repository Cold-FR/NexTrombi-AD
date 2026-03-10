import { useState, useEffect, useRef } from 'react';
import { Search, Users, LogOut, Loader2, Sun, Moon } from 'lucide-react';
import UserCard, { type User } from './components/UserCard';
import PhotoUploadModal from './components/PhotoUploadModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import ToastContainer from './components/ToastContainer';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';

export default function App() {
  // --- THÈME ---
  const { theme, toggleTheme } = useTheme();

  // --- TOASTS ---
  const { toasts, success: toastSuccess, error: toastError, dismiss: toastDismiss } = useToast();

  // --- ÉTATS D'AUTHENTIFICATION ---
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [roles, setRoles] = useState<string[]>(JSON.parse(localStorage.getItem('roles') || '[]'));

  const isAdmin = roles.includes('ROLE_ADMIN');

  // --- ÉTATS DES DONNÉES ---
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // États de la modale d'upload
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // États de la modale de confirmation de suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- ÉTATS POUR L'INFINITE SCROLL ---
  const [displayedCount, setDisplayedCount] = useState(24); // On affiche 24 cartes au début
  const observerTarget = useRef<HTMLDivElement>(null); // La "balise" invisible en bas de page

  // --- FILTRAGE ET PAGINATION ---
  const filteredUsers = users.filter((user) =>
    `${user.firstName} ${user.lastName} ${user.department}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // On découpe la liste pour n'afficher que ce qui est permis
  const visibleUsers = filteredUsers.slice(0, displayedCount);

  // Si on tape une recherche, on réinitialise l'affichage à 24
  useEffect(() => {
    setDisplayedCount(24);
  }, [searchTerm]);

  // --- LOGIQUE DE L'INFINITE SCROLL ---
  useEffect(() => {
    // On fige l'élément actuel dans une constante
    const currentElement = observerTarget.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Si on voit la balise et qu'il reste des utilisateurs à afficher, on en rajoute 24 !
          setDisplayedCount((prevCount) => prevCount + 24);
        }
      },
      { threshold: 0.1 } // Se déclenche dès qu'on voit 10% de la balise
    );

    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      // Lors du nettoyage, on utilise notre constante figée (qui contient toujours la balise)
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [observerTarget, visibleUsers.length, filteredUsers.length]);

  // --- LOGIQUE DE CONNEXION ---
  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // On sauvegarde le token et les rôles
        localStorage.setItem('token', data.token);
        localStorage.setItem('roles', JSON.stringify(data.roles));
        setToken(data.token);
        setRoles(data.roles);
      } else {
        setLoginError(data.error || 'Identifiants incorrects');
      }
    } catch {
      setLoginError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('roles');
    setToken(null);
    setRoles([]);
    setUsers([]);
  };

  const handleDeletePhoto = (userId: string) => {
    const u = users.find((usr) => usr.id === userId);
    if (u) {
      setUserToDelete(u);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!token || !userToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/users/${userToDelete.id}/photo`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setUsers(users.map((u) => (u.id === userToDelete.id ? { ...u, photoUrl: null } : u)));
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        toastSuccess('Photo supprimée avec succès.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toastError(errorData.error ?? 'Impossible de supprimer la photo.');
      }
    } catch (error) {
      console.error('Erreur réseau lors de la suppression :', error);
      toastError('Erreur réseau lors de la suppression.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePhoto = async (userId: string, file: File) => {
    if (!token) return;

    const formData = new FormData();
    formData.append('photo', file); // 'photo' doit correspondre au nom attendu par le backend

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/users/${userId}/photo`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // Attention : Ne PAS mettre de 'Content-Type': 'multipart/form-data' ici.
            // Fetch s'en occupe tout seul quand on lui passe un FormData !
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(users.map((u) => (u.id === userId ? { ...u, photoUrl: data.photoUrl } : u)));
        setIsModalOpen(false);
        toastSuccess('Photo mise à jour avec succès.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toastError(errorData.error ?? "Impossible d'enregistrer la photo.");
      }
    } catch (error) {
      console.error("Erreur réseau lors de l'envoi :", error);
      toastError("Erreur réseau lors de l'envoi de la photo.");
    }
  };

  // --- RÉCUPÉRATION DES DONNÉES (Se lance quand on a un token) ---
  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/users`,
          {
            // On injecte le token JWT ici !
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 401) {
          handleLogout();
          toastError('Session expirée, veuillez vous reconnecter.');
          return;
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des agents', error);
        toastError("Impossible de charger l'annuaire.");
      }
    };

    fetchUsers();
  }, [toastError, token]);

  // === RENDU : ÉCRAN DE CONNEXION ===
  if (!token) {
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

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
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

  // === RENDU : APPLICATION SÉCURISÉE (Trombinoscope) ===
  return (
    <div className="flex min-h-screen flex-col font-sans text-gray-900 dark:text-gray-100">
      <nav className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {/* Ligne principale : logo + actions */}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Logo + Nom */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="bg-primary-600 flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm sm:h-9 sm:w-9">
              <Users size={18} className="sm:size-5" />
            </div>
            <span className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
              NexTrombi-AD
            </span>
          </div>

          {/* Actions (droite) */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Barre de recherche : visible seulement sur sm+ ici, sinon en 2e ligne */}
            <div className="relative hidden sm:block sm:w-64 md:w-72 lg:w-80">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pr-3 pl-9 text-sm text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                placeholder="Chercher un nom, un service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Bouton de changement de thème */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label="Changer de thème"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Bouton de déconnexion */}
            <button
              onClick={handleLogout}
              className="flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-red-500"
              title="Se déconnecter"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        </div>

        {/* Ligne de recherche mobile (visible uniquement sur xs) */}
        <div className="border-t border-gray-100 px-4 pb-3 sm:hidden dark:border-gray-700">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pr-3 pl-9 text-sm text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              placeholder="Chercher un nom, un service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 size={48} className="text-primary-600 mb-4 animate-spin" />
            <p>Chargement de l'annuaire...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            Aucun collaborateur trouvé pour cette recherche.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {visibleUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isAdmin={isAdmin}
                  onEditPhoto={(id) => {
                    const u = users.find((usr) => usr.id === id);
                    if (u) {
                      setSelectedUser(u);
                      setIsModalOpen(true);
                    }
                  }}
                  onDeletePhoto={handleDeletePhoto}
                />
              ))}
            </div>

            {/* --- BALISE SENTINELLE POUR L'INFINITE SCROLL --- */}
            {/* On ne l'affiche que s'il reste des utilisateurs à charger */}
            {displayedCount < filteredUsers.length && (
              <div ref={observerTarget} className="mt-4 flex w-full justify-center py-10">
                <Loader2 className="animate-spin text-gray-400" size={32} />
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mt-auto border-t border-gray-200 bg-white py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-gray-400 sm:flex-row sm:px-6 dark:text-gray-500">
          <span>
            © {new Date().getFullYear()}{' '}
            <span className="font-medium text-gray-500 dark:text-gray-400">
              {import.meta.env.VITE_APP_COMPANY_NAME || 'Mon organisation'}
            </span>
            {' — '}
            {import.meta.env.VITE_APP_TITLE || 'Annuaire des agents'}
          </span>
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
      </footer>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        user={userToDelete}
        isLoading={isDeleting}
      />

      <PhotoUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        onSave={handleSavePhoto}
      />

      <ToastContainer toasts={toasts} onDismiss={toastDismiss} />
    </div>
  );
}
