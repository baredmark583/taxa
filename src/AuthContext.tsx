import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { type AuthUser, type User } from './types';
import { telegramLogin as apiTelegramLogin } from './apiClient';
import apiClient from './apiClient';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const attemptAutoLogin = async () => {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('authUser');
        
        // The type for window.Telegram is not available by default, so we use 'any'
        const tg = (window as any).Telegram?.WebApp;
        if (tg && tg.initData) {
            try {
                const { data } = await apiTelegramLogin(tg.initData);
                handleAuthSuccess(data);
                if (tg.ready) tg.ready(); // Inform Telegram the app is ready
                return;
            } catch (e: any) {
                console.error("Telegram login failed", e);
                const errorMessage = e.response?.data?.message === 'Invalid Telegram data' 
                    ? 'Помилка валідації даних Telegram. Спробуйте повністю закрити та знову відкрити додаток.' 
                    : 'Не вдалося увійти через Telegram. Перевірте з\'єднання та спробуйте ще раз.';
                setAuthError(errorMessage);
                // Clear any potentially invalid stored data if TG auth fails
                localStorage.clear();
            }
        }
        
        // Fallback to existing token in localStorage if not in Telegram
        else if (token && userData) {
            try {
                const parsedUser: User = JSON.parse(userData);
                setUser({ ...parsedUser, token });
            } catch (e) {
                console.error("Failed to parse user data from storage", e);
                localStorage.clear();
            }
        }
        
        setIsLoading(false);
    };
    
    attemptAutoLogin();
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
    // Potentially reload to clear all state and force re-auth
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, authError }}>
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