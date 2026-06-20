'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (name: string, email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'kasflow_user';
const USERS_KEY = 'kasflow_users';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    await new Promise(r => setTimeout(r, 800)); // simulate network
    try {
      const usersRaw = localStorage.getItem(USERS_KEY);
      const users: Array<{ name: string; email: string; password: string }> = usersRaw ? JSON.parse(usersRaw) : [];
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!found) return { error: 'Invalid email or password.' };
      const userData: User = {
        name: found.name,
        email: found.email,
        avatar: found.name.charAt(0).toUpperCase(),
      };
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred.' };
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<{ error: string | null }> => {
    await new Promise(r => setTimeout(r, 800));
    try {
      const usersRaw = localStorage.getItem(USERS_KEY);
      const users: Array<{ name: string; email: string; password: string }> = usersRaw ? JSON.parse(usersRaw) : [];
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { error: 'An account with this email already exists.' };
      }
      const newUsers = [...users, { name, email, password }];
      localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
      const userData: User = { name, email, avatar: name.charAt(0).toUpperCase() };
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred.' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
