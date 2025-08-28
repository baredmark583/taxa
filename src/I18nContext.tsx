import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { type Locale } from './types';
import uk from './i18n/uk.json';
import en from './i18n/en.json';
import ru from './i18n/ru.json';

type Translations = Record<string, string>;

const translations: Record<Locale, Translations> = { uk, en, ru };

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const storedLocale = localStorage.getItem('locale');
    // Basic browser language detection as a fallback
    const browserLang = navigator.language.split('-')[0];
    if (storedLocale && ['uk', 'en', 'ru'].includes(storedLocale)) {
        return storedLocale as Locale;
    }
    if (['uk', 'en', 'ru'].includes(browserLang)) {
        return browserLang as Locale;
    }
    return 'uk';
  });

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem('locale', newLocale);
    setLocaleState(newLocale);
  };
  
  const t = useCallback((key: string): string => {
      return translations[locale][key] || key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};