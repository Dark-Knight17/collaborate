import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';
import type { User } from '../appTypes';

interface AuthContextType {
  user: User | null;
  isLoadingAuth: boolean;
  loginUser: (userData: any, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  updateUserPreferences: (prefs: Partial<User['preferences']>) => void;
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Initial Auth Check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingAuth(false);
      return;
    }

    api.getMe()
      .then(userData => {
        setUser({ ...userData, preferences: { theme: 'light', notifications: true } });
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => {
        setIsLoadingAuth(false);
      });
  }, []);

  useEffect(() => {
    if (user) {
      document.documentElement.setAttribute('data-theme', user.preferences.theme);
    }
  }, [user?.preferences.theme]);

  const loginUser = (userData: any, token: string) => {
    localStorage.setItem('token', token);
    setUser({ ...userData, preferences: { theme: 'light', notifications: true } });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? ({ ...prev, ...updates }) : prev);
  };

  const updateUserPreferences = (prefs: Partial<User['preferences']>) => {
    if (user) setUser(prev => prev ? ({ ...prev, preferences: { ...prev.preferences, ...prefs } }) : prev);
  };

  const toggleTheme = () => {
    if (user) updateUserPreferences({ theme: user.preferences.theme === 'light' ? 'dark' : 'light' });
  };

  return (
    <AuthContext.Provider value={{ 
      user, isLoadingAuth, loginUser, logout, updateUser, updateUserPreferences, toggleTheme 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
