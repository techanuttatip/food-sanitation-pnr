import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  currentRole: UserRole;
  isLoading: boolean;
  loginWithPassword: (email: string, pass: string) => Promise<void>;
  signUp: (params: {
    email: string;
    pass: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    phone_number?: string;
  }) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const u = await authService.getCurrentUser();
        setUser(u);
      } catch (err) {
        console.error('Failed to load user', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const currentRole: UserRole = user?.roles?.[0] || 'OFFICER';

  const loginWithPassword = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const u = await authService.loginWithPassword(email, pass);
      setUser(u);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (params: {
    email: string;
    pass: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    phone_number?: string;
  }) => {
    setIsLoading(true);
    try {
      const u = await authService.signUp(params);
      setUser(u);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const updatedUser = await authService.switchDemoRole(role);
      setUser(updatedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user || !user.roles) return false;
    if (user.roles.includes('SUPER_ADMIN') || user.roles.includes('ADMIN')) return true;
    return roles.some((r) => user.roles?.includes(r));
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setIsLoading(true);
    try {
      const updated = await authService.updateProfile(updates);
      setUser(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, currentRole, isLoading, loginWithPassword, signUp, switchRole, hasRole, updateProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
