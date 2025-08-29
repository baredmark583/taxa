import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { type AuthUser, type User } from './types';
import { telegramLogin as apiTelegramLogin, loginUser, registerUser, redeemWebCode as apiRedeemWebCode } from './apiClient';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  redeemCode: (code: string) => Promise<void>;
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
      setAuthError(null);
      try {
        // The type for window.Telegram is not available by default, so we use 'any'
        const tg = (window as any).Telegram?.WebApp;
        
        // FIX: Use a clear if/else block to separate Telegram auth from localStorage fallback.
        // This prevents a fall-through bug where both could execute.
        if (tg && tg.initData) {
            // Path 1: User is in the Telegram app context.
            try {
                const { data } = await apiTelegramLogin(tg.initData);
                handleAuthSuccess(data);
                if (tg.ready) tg.ready(); // Inform Telegram the app is ready
            } catch (e: any) {
                console.error("Telegram login failed", e);
                const errorMessage = e.response?.data?.message === 'Invalid Telegram data' 
                    ? 'Помилка валідації даних Telegram. Спробуйте повністю закрити та знову відкрити додаток.' 
                    : 'Не вдалося увійти через Telegram. Перевірте з\'єднання та спробуйте ще раз.';
                setAuthError(errorMessage);
                localStorage.clear(); // Clear any potentially invalid stored data
            }
        } else {
            // Path 2: User is not in Telegram, try to use existing token from storage.
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
        }
      } finally {
        // This block guarantees that isLoading is set to false after all login attempts are finished.
        setIsLoading(false);
      }
    };
    
    attemptAutoLogin();
  }, []);
  
  const handleAuthSuccess = (data: { token: string; user: User }) => {
      const authUser: AuthUser = { ...data.user, token: data.token };
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      setUser(authUser);
      setAuthError(null);
  };

  const login = async (credentials: any) => {
    const { data } = await loginUser(credentials);
    handleAuthSuccess(data);
  };

  const register = async (credentials: any) => {
    const { data } = await registerUser(credentials);
    handleAuthSuccess(data);
  };

  const redeemCode = async (code: string) => {
    const { data } = await apiRedeemWebCode(code);
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
    <AuthContext.Provider value={{ user, isLoading, login, register, redeemCode, logout, authError }}>
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
