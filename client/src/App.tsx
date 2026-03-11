import { useState } from 'react';
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
import { useInfiniteScroll } from './hooks/useInfiniteScroll';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { toasts, success: toastSuccess, error: toastError, dismiss: toastDismiss } = useToast();
  const { token, isAdmin, isLoading, loginError, handleLogin, handleLogout } = useAuth();
  const { users, handleSavePhoto, handleDeletePhoto } = useUsers({
    token,
    onLogout: handleLogout,
    onSuccess: toastSuccess,
    onError: toastError,
  });

  // Recherche
  const [searchTerm, setSearchTerm] = useState('');
  const filteredUsers = users.filter((user) =>
    `${user.firstName} ${user.lastName} ${user.department}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Infinite scroll
  const { visibleUsers, hasMore, observerTarget } = useInfiniteScroll(filteredUsers, searchTerm);

  // État des modales
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openUpload = (id: string) => {
    const u = users.find((usr) => usr.id === id);
    if (u) {
      setSelectedUser(u);
      setIsUploadOpen(true);
    }
  };

  const openDelete = (id: string) => {
    const u = users.find((usr) => usr.id === id);
    if (u) {
      setUserToDelete(u);
      setIsDeleteOpen(true);
    }
  };

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

  if (!token) {
    return (
      <>
        <LoginPage
          onSubmit={handleLogin}
          isLoading={isLoading}
          loginError={loginError}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <ToastContainer toasts={toasts} onDismiss={toastDismiss} />
      </>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden font-sans text-gray-900 dark:text-gray-100">
      <AppNav
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
      />

      <div className="flex-1 overflow-x-clip overflow-y-auto">
        <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
          <UserGrid
            allUsers={users}
            visibleUsers={visibleUsers}
            filteredCount={filteredUsers.length}
            isAdmin={isAdmin}
            hasMore={hasMore}
            observerTarget={observerTarget}
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

      <ToastContainer toasts={toasts} onDismiss={toastDismiss} />
    </div>
  );
}
