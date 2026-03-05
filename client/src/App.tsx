import { useState } from 'react';
import { Search, Shield, ShieldOff, Users } from 'lucide-react';
import UserCard, { type User } from './components/UserCard';
import PhotoUploadModal from './components/PhotoUploadModal';

const mockUsers: User[] = [
    { id: '1', firstName: 'Jean', lastName: 'Dupont', jobTitle: 'Développeur Fullstack', department: 'DSI', email: 'jean.dupont@mairie.fr', phone: '01 23 45 67 89', photoUrl: 'https://i.pravatar.cc/150?u=1' },
    { id: '2', firstName: 'Marie', lastName: 'Martin', jobTitle: 'Responsable RH', department: 'Ressources Humaines', email: 'marie.martin@mairie.fr', phone: '01 23 45 67 90', photoUrl: null },
    { id: '3', firstName: 'Lucas', lastName: 'Bernard', jobTitle: 'Technicien Support', department: 'DSI', email: 'lucas.bernard@mairie.fr', phone: '01 23 45 67 91', photoUrl: 'https://i.pravatar.cc/150?u=3' },
    { id: '4', firstName: 'Sophie', lastName: 'Lefebvre', jobTitle: 'Chargée de communication', department: 'Communication', email: 'sophie.lefebvre@mairie.fr', phone: '', photoUrl: 'https://i.pravatar.cc/150?u=4' }
];

function App() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const filteredUsers = mockUsers.filter(user =>
        `${user.firstName} ${user.lastName} ${user.department}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditPhoto = (id: string) => {
        const user = mockUsers.find(u => u.id === id);
        if (user) {
            setSelectedUser(user);
            setIsModalOpen(true);
        }
    };

    return (
        <div className="min-h-screen flex flex-col font-sans text-gray-900 dark:text-gray-100">

            {/* NAVBAR (Réplique exacte de _navbar.html.twig de formulaire-ad) */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">

                    {/* Gauche : Logo / Titre */}
                    <div className="flex items-center gap-2 sm:gap-3 group shrink-0">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 text-white rounded-lg shadow-sm">
                            <Users size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <span className="hidden sm:inline text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
              Trombinoscope
            </span>
                    </div>

                    {/* Droite : Actions (Recherche + Admin) */}
                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">

                        {/* Barre de recherche HTML Native Flowbite */}
                        <div className="relative w-full sm:w-72">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 transition-colors"
                                placeholder="Chercher un nom, un service..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Bouton Admin */}
                        <button
                            onClick={() => setIsAdmin(!isAdmin)}
                            className={`flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3 sm:py-2 border rounded-lg text-sm font-medium transition-colors ${
                                isAdmin
                                    ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-500'
                                    : 'bg-white border-gray-200 text-gray-500 hover:text-primary-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700'
                            }`}
                            title={isAdmin ? "Désactiver le mode admin" : "Activer le mode admin"}
                        >
                            {isAdmin ? <ShieldOff size={18} /> : <Shield size={18} />}
                            <span className="hidden sm:inline ml-2">{isAdmin ? "Admin Actif" : "Admin"}</span>
                        </button>
                    </div>

                </div>
            </nav>

            {/* CONTENU PRINCIPAL */}
            <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-dashed">
                        <Users size={48} className="mb-4 text-gray-400" />
                        <p className="text-lg font-medium">Aucun collaborateur trouvé.</p>
                        <p className="text-sm">Essayez de modifier votre recherche.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredUsers.map(user => (
                            <UserCard
                                key={user.id}
                                user={user}
                                isAdmin={isAdmin}
                                onEditPhoto={handleEditPhoto}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* MODALE */}
            <PhotoUploadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={selectedUser}
                onSave={(id, file) => console.log(`Envoi API : ${id} -> ${file.name}`)}
            />
        </div>
    );
}

export default App;