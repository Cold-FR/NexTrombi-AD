import { useState, useEffect, useCallback } from 'react';
import { type User } from '../components/UserCard';
import { type CustomUserFormData } from '../components/CustomUserModal';
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

const apiBase = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/** Met à jour le cache sessionStorage et retourne la liste mise à jour */
function updateCache(updated: User[]): User[] {
  sessionStorage.setItem(
    USERS_CACHE_KEY,
    JSON.stringify({ data: updated, timestamp: Date.now() } satisfies CachedUsers)
  );
  return updated;
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

  // Chargement initial
  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsers([]);
      sessionStorage.removeItem(USERS_CACHE_KEY);
      return;
    }

    const cached = sessionStorage.getItem(USERS_CACHE_KEY);
    if (cached) {
      const { timestamp } = JSON.parse(cached) as CachedUsers;
      if (Date.now() - timestamp < USERS_CACHE_TTL) return;
    }

    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        const response = await fetch(`${apiBase()}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (response.status === 401) {
          onLogout();
          onError('Session expirée, veuillez vous reconnecter.');
          return;
        }

        const data: User[] = await response.json();
        setUsers(data);
        updateCache(data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        onError("Impossible de charger l'annuaire.");
      }
    };

    fetchUsers();
    return () => controller.abort();
  }, [token, onLogout, onError]);

  const handleSavePhoto = useCallback(
    async (userId: string, file: File) => {
      if (!token) return false;

      const formData = new FormData();
      formData.append('photo', file);

      try {
        const response = await fetch(`${apiBase()}/api/users/${userId}/photo`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const oldUser = users.find((u) => u.id === userId);
          if (oldUser?.photoUrl) clearImageCache(oldUser.photoUrl);

          setUsers((prev) =>
            updateCache(prev.map((u) => (u.id === userId ? { ...u, photoUrl: data.photoUrl } : u)))
          );
          onSuccess('Photo mise à jour avec succès.');
          return true;
        }
        if (response.status === 401) {
          onLogout();
          onError('Session expirée, veuillez vous reconnecter.');
          return false;
        }
        const err = await response.json().catch(() => ({}));
        onError(err.error ?? "Impossible d'enregistrer la photo.");
        return false;
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
        const response = await fetch(`${apiBase()}/api/users/${userId}/photo`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const oldUser = users.find((u) => u.id === userId);
          if (oldUser?.photoUrl) clearImageCache(oldUser.photoUrl);

          setUsers((prev) =>
            updateCache(prev.map((u) => (u.id === userId ? { ...u, photoUrl: null } : u)))
          );
          onSuccess('Photo supprimée avec succès.');
          return true;
        }
        if (response.status === 401) {
          onLogout();
          onError('Session expirée, veuillez vous reconnecter.');
          return false;
        }
        const err = await response.json().catch(() => ({}));
        onError(err.error ?? 'Impossible de supprimer la photo.');
        return false;
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
        const response = await fetch(`${apiBase()}/api/users/${userId}/ignore`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = (await response.json()) as { hidden: boolean };
          setUsers((prev) =>
            updateCache(prev.map((u) => (u.id === userId ? { ...u, hidden: data.hidden } : u)))
          );
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
    async (userData: CustomUserFormData): Promise<boolean> => {
      if (!token) return false;

      try {
        const response = await fetch(`${apiBase()}/api/custom-users`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });

        if (response.ok) {
          const data = await response.json();

          setUsers((prev) =>
            updateCache([
              ...prev,
              {
                id: data.userId,
                firstName: userData.firstName,
                lastName: userData.lastName,
                jobTitle: userData.jobTitle === '' ? 'Agent' : userData.jobTitle,
                department: userData.department === '' ? 'Non renseigné' : userData.department,
                email: userData.email,
                phone: userData.phone,
                photoUrl: null,
              } as User,
            ])
          );
          onSuccess(data.message);
          return true;
        }
        if (response.status === 401) {
          onLogout();
          onError('Session expirée, veuillez vous reconnecter.');
          return false;
        }
        const err = await response.json().catch(() => ({}));
        onError(err.error ?? 'Impossible de créer le collaborateur.');
        return false;
      } catch {
        onError('Erreur réseau.');
        return false;
      }
    },
    [token, onSuccess, onError, onLogout]
  );

  const handleUpdateCustomUser = useCallback(
    async (userId: string, userData: CustomUserFormData): Promise<boolean> => {
      if (!token) return false;

      try {
        const response = await fetch(
          `${apiBase()}/api/custom-users/${userId.replace('custom_', '')}`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          }
        );

        if (response.ok) {
          const data = await response.json();

          setUsers((prev) =>
            updateCache(
              prev.map((u) =>
                u.id === userId
                  ? {
                      ...u,
                      firstName: userData.firstName,
                      lastName: userData.lastName,
                      jobTitle: userData.jobTitle === '' ? 'Agent' : userData.jobTitle,
                      department:
                        userData.department === '' ? 'Non renseigné' : userData.department,
                      email: userData.email,
                      phone: userData.phone,
                    }
                  : u
              )
            )
          );
          onSuccess(data.message);
          return true;
        }
        if (response.status === 401) {
          onLogout();
          onError('Session expirée, veuillez vous reconnecter.');
          return false;
        }
        const err = await response.json().catch(() => ({}));
        onError(err.error ?? 'Impossible de mettre à jour le collaborateur.');
        return false;
      } catch {
        onError('Erreur réseau.');
        return false;
      }
    },
    [token, onSuccess, onError, onLogout]
  );

  const handleDeleteCustomUser = useCallback(
    async (userId: string): Promise<boolean> => {
      if (!token) return false;

      try {
        const response = await fetch(
          `${apiBase()}/api/custom-users/${userId.replace('custom_', '')}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }
        );

        if (response.ok) {
          const data = await response.json();

          setUsers((prev) => updateCache(prev.filter((u) => u.id !== userId)));
          onSuccess(data.message);
          return true;
        }
        if (response.status === 401) {
          onLogout();
          onError('Session expirée, veuillez vous reconnecter.');
          return false;
        }
        const err = await response.json().catch(() => ({}));
        onError(err.error ?? 'Impossible de supprimer le collaborateur.');
        return false;
      } catch {
        onError('Erreur réseau.');
        return false;
      }
    },
    [token, onSuccess, onError, onLogout]
  );

  return {
    users,
    handleSavePhoto,
    handleDeletePhoto,
    handleToggleHidden,
    handleCreateCustomUser,
    handleUpdateCustomUser,
    handleDeleteCustomUser,
  };
}
