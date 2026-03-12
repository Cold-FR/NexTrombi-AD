import { useState, useEffect, useCallback } from 'react';
import { type User } from '../components/UserCard';

interface UseUsersOptions {
  token: string | null;
  onLogout: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function useUsers({ token, onLogout, onSuccess, onError }: UseUsersOptions) {
  const [users, setUsers] = useState<User[]>([]);

  // Chargement initial
  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsers([]);
      return;
    }

    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/users`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          onLogout();
          onError('Session expirée, veuillez vous reconnecter.');
          return;
        }

        const data = await response.json();
        setUsers(data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        onError("Impossible de charger l'annuaire.");
      }
    };

    fetchUsers();

    return () => {
      controller.abort();
    };
  }, [token, onLogout, onError]);

  const handleSavePhoto = useCallback(
    async (userId: string, file: File) => {
      if (!token) return;

      const formData = new FormData();
      formData.append('photo', file);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/users/${userId}/photo`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, photoUrl: data.photoUrl } : u))
          );
          onSuccess('Photo mise à jour avec succès.');
          return true;
        } else {
          const errorData = await response.json().catch(() => ({}));
          onError(errorData.error ?? "Impossible d'enregistrer la photo.");
          return false;
        }
      } catch {
        onError("Erreur réseau lors de l'envoi de la photo.");
        return false;
      }
    },
    [token, onSuccess, onError]
  );

  const handleDeletePhoto = useCallback(
    async (userId: string) => {
      if (!token) return false;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/users/${userId}/photo`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, photoUrl: null } : u)));
          onSuccess('Photo supprimée avec succès.');
          return true;
        } else {
          const errorData = await response.json().catch(() => ({}));
          onError(errorData.error ?? 'Impossible de supprimer la photo.');
          return false;
        }
      } catch {
        onError('Erreur réseau lors de la suppression.');
        return false;
      }
    },
    [token, onSuccess, onError]
  );

  return { users, handleSavePhoto, handleDeletePhoto };
}
