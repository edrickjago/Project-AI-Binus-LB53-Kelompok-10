'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';

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
  loginWithGoogle: () => Promise<{ error: string | null }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'kasflow_user';
const USERS_KEY = 'kasflow_users';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Try to get the active Supabase session (this will wait for OAuth callbacks to parse)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          avatar: session.user.user_metadata?.avatar_url || (session.user.email ? session.user.email.charAt(0).toUpperCase() : 'U'),
        });
      } else {
        // 2. Fallback to local storage if no Supabase user
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            setUser(JSON.parse(stored));
          } else {
            setUser(null);
          }
        } catch {}
      }
      setIsLoading(false);
    };

    initializeAuth();

    // Listen to Supabase Auth state changes for subsequent logins/logouts
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          avatar: session.user.user_metadata?.avatar_url || (session.user.email ? session.user.email.charAt(0).toUpperCase() : 'U'),
        });
        setIsLoading(false);
      } else {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (!stored) setUser(null);
        } catch {}
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      return { error: error?.message || null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred.' };
    }
  };

  const login = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    await new Promise(r => setTimeout(r, 800)); // simulate network
    try {
      // First try Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (!error && data?.user) return { error: null };

      // Fallback to local dummy auth
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
      // Try Supabase Auth first
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: name } }
      });

      if (!error && data?.user) {
        // Automatically handle if email confirmation is disabled
        return { error: null };
      }

      // Fallback to local dummy auth
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

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
