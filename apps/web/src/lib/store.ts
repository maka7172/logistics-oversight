'use client';

import { create } from 'zustand';

type User = {
  id: string;
  phone: string;
  fullName: string;
  preferredLocale: string;
  isSuperAdmin: boolean;
  roles: { code: string; name: string }[];
  permissions: string[];
};

type AuthState = {
  token: string | null;
  user: User | null;
  locale: 'fa' | 'en';
  hydrated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setLocale: (locale: 'fa' | 'en') => void;
  hydrate: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  locale: 'fa',
  hydrated: false,
  setAuth: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('lo-user', JSON.stringify(user));
    }
    set({ token, user, locale: (user.preferredLocale as 'fa' | 'en') || 'fa' });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('lo-user');
    }
    set({ token: null, user: null });
  },
  setLocale: (locale) => set({ locale }),
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    const raw = localStorage.getItem('lo-user');
    let user: User | null = null;
    try {
      user = raw ? JSON.parse(raw) : null;
    } catch {
      user = null;
    }
    set({
      token,
      user,
      locale: (user?.preferredLocale as 'fa' | 'en') || 'fa',
      hydrated: true,
    });
  },
}));
