import { useCallback, useEffect, useState, type ReactNode } from "react";
import { api, setAuthToken, setUnauthorizedHandler } from "../lib/api";
import type { User } from "../lib/types";
import { AuthContext } from "./authContext";

const STORAGE_KEY = "hesabu.auth";
export const SESSION_EXPIRED_KEY = "hesabu.sessionExpired";

interface StoredAuth {
  token: string;
  user: User;
}

function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // localStorage is synchronous, so hydrating auth state doesn't need an effect —
  // the lazy initializer runs once, before first paint, with no loading flicker.
  const [user, setUser] = useState<User | null>(() => {
    const stored = loadStoredAuth();
    if (stored) setAuthToken(stored.token);
    return stored?.user ?? null;
  });
  const isLoading = false;

  const persist = useCallback((token: string, nextUser: User) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: nextUser }));
    setAuthToken(token);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api.post<{ access_token: string; user: User }>("/auth/login", {
        email,
        password,
      });
      persist(result.access_token, result.user);
    },
    [persist],
  );

  const register = useCallback(
    async (email: string, password: string, fullName: string, phone?: string) => {
      const result = await api.post<{ access_token: string; user: User }>("/auth/register", {
        email,
        password,
        full_name: fullName,
        phone: phone || undefined,
      });
      persist(result.access_token, result.user);
    },
    [persist],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  // A stored session outlives its token: the user object sits in localStorage, so
  // the header still shows a name while every request 401s. Tear the session down
  // as soon as the API rejects it, and leave a note so the login screen can say
  // why the user landed back there.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (localStorage.getItem(STORAGE_KEY)) {
        sessionStorage.setItem(SESSION_EXPIRED_KEY, "1");
      }
      logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
