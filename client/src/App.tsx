import { useState, useEffect } from 'react';
import { Search, Users, LogOut, Loader2 } from 'lucide-react';
import UserCard, { type User } from './components/UserCard';
import PhotoUploadModal from './components/PhotoUploadModal';

export default function App() {
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

  // --- LOGIQUE DE CONNEXION ---
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
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
    setUsers([]); // On vide la liste des utilisateurs de la mémoire
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

        // On met à jour l'utilisateur dans le state local pour afficher la nouvelle photo immédiatement
        setUsers(users.map((u) => (u.id === userId ? { ...u, photoUrl: data.photoUrl } : u)));

        setIsModalOpen(false); // On ferme la modale en cas de succès
      } else {
        const errorData = await response.json();
        console.error('Erreur du serveur :', errorData.error);
      }
    } catch (error) {
      console.error("Erreur réseau lors de l'envoi :", error);
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
          handleLogout(); // Token expiré -> on déconnecte
          return;
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des agents', error);
      }
    };

    fetchUsers();
  }, [token]);

  // --- FILTRAGE ---
  const filteredUsers = users.filter((user) =>
    `${user.firstName} ${user.lastName} ${user.department}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // === RENDU : ÉCRAN DE CONNEXION ===
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 font-sans sm:px-6 lg:px-8 dark:bg-gray-900">
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
      <nav className="sticky top-0 z-20 border-b border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="bg-primary-600 flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm sm:h-10 sm:w-10">
              <Users size={20} className="sm:h-6 sm:w-6" />
            </div>
            <span className="hidden text-lg font-semibold text-gray-900 sm:inline dark:text-white">
              Trombinoscope
            </span>
          </div>

          <div className="flex w-full shrink-0 items-center justify-end gap-3 sm:w-auto">
            <div className="relative w-full sm:w-72">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Chercher un nom, un service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Bouton de déconnexion au lieu du "faux" bouton admin */}
            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-600 sm:w-auto sm:px-3 sm:py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-red-500"
              title="Se déconnecter"
            >
              <LogOut size={18} />
              <span className="ml-2 hidden sm:inline">Quitter</span>
            </button>
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isAdmin={isAdmin} // <-- C'est le vrai JWT qui gère ça maintenant !
                onEditPhoto={(id) => {
                  const u = users.find((usr) => usr.id === id);
                  if (u) {
                    setSelectedUser(u);
                    setIsModalOpen(true);
                  }
                }}
              />
            ))}
          </div>
        )}
      </main>

      <PhotoUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        onSave={handleSavePhoto}
      />
    </div>
  );
}
