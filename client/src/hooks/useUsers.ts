import { useState, useEffect, useCallback } from 'react';
import { type User } from '../components/UserCard';
import { clearImageCache } from '../lib/imageCache';

const USERS_CACHE_KEY = 'trombinoscope_users_cache';
const USERS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface UseUsersOptions {
  token: string | null;
  onLogout: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

interface CachedUsers {
  data: User[];
  timestamp: number;
}

export function useUsers({ token, onLogout, onSuccess, onError }: UseUsersOptions) {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const cached = sessionStorage.getItem(USERS_CACHE_KEY);
      if (!cached) return [];
      const { data } = JSON.parse(cached) as CachedUsers;
      return data;
    } catch {
      return [];
    }
  });

  const fetchUsers = useCallback(
    async (signal?: AbortSignal, forceRefresh = false) => {
      if (!token) return;

      // Si on ne force pas le rafraîchissement, on vérifie le cache
      if (!forceRefresh) {
        const cached = sessionStorage.getItem(USERS_CACHE_KEY);
        if (cached) {
          const { timestamp } = JSON.parse(cached) as CachedUsers;
          if (Date.now() - timestamp < USERS_CACHE_TTL) return;
        }
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/users`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal,
          }
        );

        if (response.status === 401) {
          onLogout();
          onError('Session expirée, veuillez vous reconnecter.');
          return;
        }

        const data: User[] = await response.json();
        setUsers(data);
        sessionStorage.setItem(
          USERS_CACHE_KEY,
          JSON.stringify({ data, timestamp: Date.now() } satisfies CachedUsers)
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        onError("Impossible de charger l'annuaire.");
      }
    },
    [token, onLogout, onError]
  );

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsers([]);
      sessionStorage.removeItem(USERS_CACHE_KEY);
      return;
    }

    const controller = new AbortController();
    fetchUsers(controller.signal);

    return () => {
      controller.abort();
    };
  }, [token, fetchUsers]);

  const handleSavePhoto = useCallback(
    async (userId: string, file: File) => {
      if (!token) return false;

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
          const oldUser = users.find((u) => u.id === userId);
          if (oldUser?.photoUrl) clearImageCache(oldUser.photoUrl);

          setUsers((prev) => {
            const updated = prev.map((u) =>
              u.id === userId ? { ...u, photoUrl: data.photoUrl } : u
            );
            sessionStorage.setItem(
              USERS_CACHE_KEY,
              JSON.stringify({ data: updated, timestamp: Date.now() } satisfies CachedUsers)
            );
            return updated;
          });
          onSuccess('Photo mise à jour avec succès.');
          return true;
        } else if (response.status === 401) {
          onLogout();
          onError('Session expirée, veuillez vous reconnecter.');
          return false;
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
    [token, users, onSuccess, onError, onLogout]
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
          const oldUser = users.find((u) => u.id === userId);
          if (oldUser?.photoUrl) clearImageCache(oldUser.photoUrl);

          setUsers((prev) => {
            const updated = prev.map((u) => (u.id === userId ? { ...u, photoUrl: null } : u));
            sessionStorage.setItem(
              USERS_CACHE_KEY,
              JSON.stringify({ data: updated, timestamp: Date.now() } satisfies CachedUsers)
            );
            return updated;
          });
          onSuccess('Photo supprimée avec succès.');
          return true;
        } else if (response.status === 401) {
          onLogout();
          onError('Session expirée, veuillez vous reconnecter.');
          return false;
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
    [token, users, onSuccess, onError, onLogout]
  );

  const handleToggleHidden = useCallback(
    async (userId: string) => {
      if (!token) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/users/${userId}/ignore`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = (await response.json()) as { hidden: boolean };

          setUsers((prev) => {
            const updated = prev.map((u) => (u.id === userId ? { ...u, hidden: data.hidden } : u));
            sessionStorage.setItem(
              USERS_CACHE_KEY,
              JSON.stringify({ data: updated, timestamp: Date.now() } satisfies CachedUsers)
            );
            return updated;
          });

          onSuccess(data.hidden ? 'Utilisateur masqué.' : 'Utilisateur visible à nouveau.');
        } else if (response.status === 401) {
          onLogout();
          onError('Session expirée, veuillez vous reconnecter.');
        } else {
          onError("Impossible de modifier la visibilité de l'utilisateur.");
        }
      } catch {
        onError('Erreur réseau.');
      }
    },
    [token, onSuccess, onError, onLogout]
  );

  const handleCreateCustomUser = useCallback(
    async (userData: unknown) => {
      if (!token) return false;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/custom-users`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          }
        );

        if (response.ok) {
          onSuccess('Utilisateur créé avec succès.');

          await fetchUsers(undefined, true);
          return true;
        } else if (response.status === 401) {
          onLogout();
          onError('Session expirée, veuillez vous reconnecter.');
          return false;
        } else {
          onError("Impossible de créer l'utilisateur.");
          return false;
        }
      } catch {
        onError('Erreur réseau.');
        return false;
      }
    },
    [token, onSuccess, onError, onLogout, fetchUsers]
  );

  return { users, handleSavePhoto, handleDeletePhoto, handleToggleHidden, handleCreateCustomUser };
}
