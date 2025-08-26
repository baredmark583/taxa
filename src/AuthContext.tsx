import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { type AuthUser, type User } from './types';
import apiClient from './apiClient';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('authUser');
    if (token && userData) {
      try {
        const parsedUser: User = JSON.parse(userData);
        setUser({ ...parsedUser, token });
      } catch (e) {
        console.error("Failed to parse user data from storage", e);
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);
  
  const handleAuthSuccess = (data: { token: string; user: User }) => {
      const authUser: AuthUser = { ...data.user, token: data.token };
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      setUser(authUser);
  };

  const login = async (credentials: any) => {
    const { data } = await apiClient.post('/auth/login', credentials);
    handleAuthSuccess(data);
  };

  const register = async (credentials: any) => {
    const { data } = await apiClient.post('/auth/register', credentials);
    handleAuthSuccess(data);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
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