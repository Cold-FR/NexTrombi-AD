import { useState, useCallback } from 'react';

export interface AuthState {
  token: string | null;
  roles: string[];
  isAdmin: boolean;
  isLoading: boolean;
  loginError: string;
  handleLogin: (e: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
  handleLogout: () => void;
}

export function useAuth(): AuthState {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [roles, setRoles] = useState<string[]>(JSON.parse(localStorage.getItem('roles') || '[]'));
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('roles');
    setToken(null);
    setRoles([]);
  }, []);

  const handleLogin = useCallback(async (e: React.SubmitEvent<HTMLFormElement>) => {
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
  }, []);

  return {
    token,
    roles,
    isAdmin: roles.includes('ROLE_ADMIN'),
    isLoading,
    loginError,
    handleLogin,
    handleLogout,
  };
}
