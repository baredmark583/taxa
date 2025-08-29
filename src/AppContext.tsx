import React, { createContext, useContext, useMemo } from 'react';

export interface AppContextType {
  isTelegram: boolean;
  isWeb: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const contextValue = useMemo(() => {
    // A more robust check for Telegram environment to avoid false positives in browsers.
    const tg = (window as any).Telegram?.WebApp;
    const isTelegram = tg && tg.initData && tg.initData !== '';
    return {
      isTelegram,
      isWeb: !isTelegram,
    };
  }, []);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};