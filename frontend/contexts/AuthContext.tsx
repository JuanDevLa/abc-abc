'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const REFRESH_TOKEN_KEY = 'jr_refresh_token';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const tryRefresh = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('jr_token', data.token);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        setToken(data.token);
        return true;
      } else {
        // Refresh token inválido o expirado — logout completo
        localStorage.removeItem('jr_token');
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        setToken(null);
        setUser(null);
        return false;
      }
    } catch {
      return false;
    }
  }, []);

  const refreshUser = useCallback(async (savedToken?: string) => {
    const t = savedToken ?? token;
    if (!t) return;
    try {
      const res = await fetch(`${API}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else if (res.status === 401 || res.status === 403) {
        // Token expirado — intentar refresh
        const refreshed = await tryRefresh();
        if (refreshed) {
          // Reintentar /me con el nuevo token
          const newToken = localStorage.getItem('jr_token');
          if (newToken) {
            const retryRes = await fetch(`${API}/api/v1/auth/me`, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
            if (retryRes.ok) {
              const data = await retryRes.json();
              setUser(data);
            } else {
              setUser(null);
            }
          }
        } else {
          setUser(null);
        }
      } else {
        // Otro error
        localStorage.removeItem('jr_token');
        setToken(null);
        setUser(null);
      }
    } catch {
      // ignore — sin conexión
    }
  }, [token, tryRefresh]);

  // Restaurar sesión al montar
  useEffect(() => {
    const saved = localStorage.getItem('jr_token');
    if (saved) {
      setToken(saved);
      refreshUser(saved).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    const data = await res.json();
    localStorage.setItem('jr_token', data.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    setToken(data.token);
    setUser(data.user);
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await fetch(`${API}/api/v1/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: credential }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error al iniciar sesión con Google');
    }

    const data = await res.json();
    localStorage.setItem('jr_token', data.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    const t = token;
    // Intentar invalidar refresh token en backend (best effort)
    if (t) {
      try {
        await fetch(`${API}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${t}` },
        });
      } catch {
        // ignore — error de red o servidor
      }
    }
    localStorage.removeItem('jr_token');
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
