import { useState, useEffect, useCallback, useMemo } from 'react';
import { type User } from './components/UserCard';
import LoginPage from './components/LoginPage';
import AppNav from './components/AppNav';
import AppFooter from './components/AppFooter';
import UserGrid from './components/UserGrid';
import PhotoUploadModal from './components/PhotoUploadModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import ToastContainer from './components/ToastContainer';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';
import { useAuth } from './hooks/useAuth';
import { useUsers } from './hooks/useUsers';
import { AnimatePresence, motion, type Transition } from 'motion/react';

const pageVariants = {
  initial: { opacity: 0, scale: 0.96, filter: 'blur(6px)' },
  in: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  out: { opacity: 0, scale: 1.04, filter: 'blur(6px)' },
};

const pageTransition: Transition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.45,
};

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { toasts, success: toastSuccess, error: toastError, dismiss: toastDismiss } = useToast();
  const { token, isAdmin, username, isLoading, loginError, handleLogin, handleLogout } = useAuth();
  const { users, handleSavePhoto, handleDeletePhoto } = useUsers({
    token,
    onLogout: handleLogout,
    onSuccess: toastSuccess,
    onError: toastError,
  });

  // Recherche avec debounce pour le skeleton
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const isSearching = searchTerm !== debouncedSearch;

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        `${user.firstName} ${user.lastName} ${user.department}`
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase())
      ),
    [users, debouncedSearch]
  );

  // État des modales
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openUpload = useCallback(
    (id: string) => {
      const u = users.find((usr) => usr.id === id);
      if (u) {
        setSelectedUser(u);
        setIsUploadOpen(true);
      }
    },
    [users]
  );

  const openDelete = useCallback(
    (id: string) => {
      const u = users.find((usr) => usr.id === id);
      if (u) {
        setUserToDelete(u);
        setIsDeleteOpen(true);
      }
    },
    [users]
  );

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    const ok = await handleDeletePhoto(userToDelete.id);
    setIsDeleting(false);
    if (ok) {
      setIsDeleteOpen(false);
      setUserToDelete(null);
    }
  };

  const savePhoto = async (userId: string, file: File) => {
    const ok = await handleSavePhoto(userId, file);
    if (ok) setIsUploadOpen(false);
  };

  return (
    <div className="relative h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {!token ? (
          <motion.div
            key="login"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="absolute inset-0 min-h-screen w-full overflow-y-auto"
          >
            <LoginPage
              onSubmit={handleLogin}
              isLoading={isLoading}
              loginError={loginError}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="absolute inset-0 flex h-screen w-full flex-col overflow-hidden font-sans text-gray-900 dark:text-gray-100"
          >
            <AppNav
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              theme={theme}
              toggleTheme={toggleTheme}
              onLogout={handleLogout}
            />

            <div className="scrollbar-overlay flex-1">
              <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
                <UserGrid
                  allUsers={users}
                  visibleUsers={filteredUsers}
                  filteredCount={filteredUsers.length}
                  isAdmin={isAdmin}
                  loggedUsername={username}
                  isSearching={isSearching}
                  onEditPhoto={openUpload}
                  onDeletePhoto={openDelete}
                />
              </main>
            </div>

            <AppFooter />

            <ConfirmDeleteModal
              isOpen={isDeleteOpen}
              onClose={() => {
                setIsDeleteOpen(false);
                setUserToDelete(null);
              }}
              onConfirm={confirmDelete}
              user={userToDelete}
              isLoading={isDeleting}
            />

            <PhotoUploadModal
              isOpen={isUploadOpen}
              onClose={() => setIsUploadOpen(false)}
              user={selectedUser}
              onSave={savePhoto}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ToastContainer hors AnimatePresence pour ne pas être affecté par les transitions */}
      <ToastContainer toasts={toasts} onDismiss={toastDismiss} />
    </div>
  );
}
