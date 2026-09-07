import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser } from '../types.js';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  demoLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check localStorage for saved session or default to demo user
    const saved = localStorage.getItem('gms_mcd_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        // Fallback default
        setUser({
          email: 'finishmcd@gmail.com',
          name: 'FINISH MCD',
          role: 'Warehouse MCD Manager',
          department: 'Finish Fabric Warehouse'
        });
      }
    } else {
      // Auto-initialize with default finishmcd credentials so user immediately sees full working app
      const defaultUser: AuthUser = {
        email: 'finishmcd@gmail.com',
        name: 'FINISH MCD',
        role: 'Warehouse MCD Manager',
        department: 'Finish Fabric Warehouse'
      };
      setUser(defaultUser);
      localStorage.setItem('gms_mcd_user', JSON.stringify(defaultUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem('gms_mcd_user', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Invalid credentials' };
      }
    } catch {
      // Offline fallback
      if (email === 'finishmcd@gmail.com' && pass === '290144') {
        const u = {
          email,
          name: 'FINISH MCD',
          role: 'Warehouse MCD Manager',
          department: 'Finish Fabric Warehouse'
        };
        setUser(u);
        localStorage.setItem('gms_mcd_user', JSON.stringify(u));
        return { success: true };
      }
      return { success: false, error: 'Network error. Try again.' };
    }
  };

  const demoLogin = async () => {
    await login('finishmcd@gmail.com', '290144');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gms_mcd_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        demoLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
