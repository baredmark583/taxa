
import { useState, useEffect } from 'react';
import { type TelegramUser } from '../types';

// Extend the Window interface to include the Telegram object
declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

const getTelegram = () => {
    if (typeof window !== 'undefined' && window.Telegram) {
        return window.Telegram.WebApp;
    }
    return null;
}

// Mock user data for development outside of Telegram
const mockUser: TelegramUser = {
  id: 123456789,
  first_name: "Тестовый",
  last_name: "Пользователь",
  username: "testuser",
  photo_url: "https://i.pravatar.cc/150?u=123456789"
};

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<any>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    const tg = getTelegram();
    if (tg) {
      setWebApp(tg);
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      } else {
        // Fallback to mock data if user is not available in a Telegram-like environment (e.g. web version with no user session)
        console.warn("Telegram user data not found, using mock data.");
        setUser(mockUser);
      }
    } else {
      console.warn("Telegram WebApp script not loaded, using mock data for development.");
      setUser(mockUser);
    }
  }, []);

  return { webApp, user };
};
