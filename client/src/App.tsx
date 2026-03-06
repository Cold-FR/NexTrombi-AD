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
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

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
        } catch (error) {
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

    // --- RÉCUPÉRATION DES DONNÉES (Se lance quand on a un token) ---
    useEffect(() => {
        if (!token) return;

        const fetchUsers = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/users`, {
                    // On injecte le token JWT ici !
                    headers: { 'Authorization': `Bearer ${token}` }
                });

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
    const filteredUsers = users.filter(user =>
        `${user.firstName} ${user.lastName} ${user.department}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // === RENDU : ÉCRAN DE CONNEXION ===
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
                <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-xl shadow-sm mb-4">
                            <Users size={28} />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Annuaire Interne</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Connectez-vous avec vos identifiants Windows</p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Identifiant</label>
                                <input name="username" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors" placeholder="jdupont" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe</label>
                                <input name="password" type="password" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors" placeholder="••••••••" />
                            </div>
                        </div>

                        {loginError && (
                            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
                                {loginError}
                            </div>
                        )}

                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors">
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Se connecter'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // === RENDU : APPLICATION SÉCURISÉE (Trombinoscope) ===
    return (
        <div className="min-h-screen flex flex-col font-sans text-gray-900 dark:text-gray-100">
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 text-white rounded-lg shadow-sm">
                            <Users size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <span className="hidden sm:inline text-lg font-semibold text-gray-900 dark:text-white">Trombinoscope</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
                        <div className="relative w-full sm:w-72">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-4 h-4 text-gray-500" />
                            </div>
                            <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors" placeholder="Chercher un nom, un service..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>

                        {/* Bouton de déconnexion au lieu du "faux" bouton admin */}
                        <button onClick={handleLogout} className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3 sm:py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:text-red-600 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-red-500" title="Se déconnecter">
                            <LogOut size={18} />
                            <span className="hidden sm:inline ml-2">Quitter</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                {users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Loader2 size={48} className="animate-spin text-primary-600 mb-4" />
                        <p>Chargement de l'annuaire depuis l'Active Directory...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">Aucun collaborateur trouvé pour cette recherche.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredUsers.map(user => (
                            <UserCard
                                key={user.id}
                                user={user}
                                isAdmin={isAdmin} // <-- C'est le vrai JWT qui gère ça maintenant !
                                onEditPhoto={(id) => {
                                    const u = users.find(usr => usr.id === id);
                                    if (u) { setSelectedUser(u); setIsModalOpen(true); }
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
                onSave={async () => {
                    // L'envoi API sécurisé se fera ici avec le Token
                    console.log("Prêt à envoyer avec le token :", token);
                }}
            />
        </div>
    );
}