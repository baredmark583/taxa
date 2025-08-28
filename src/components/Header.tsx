import React, { useState, useRef, useEffect } from 'react';
import { type Page, type AuthUser } from '../types';
import { Icon } from '@iconify/react';
import { useI18n } from '../I18nContext';

interface HeaderProps {
  currentPage: Page;
  goBack: () => void;
  navigateTo: (page: Page) => void;
  unreadMessagesCount: number;
  user: AuthUser | null;
}

const LanguageSwitcher: React.FC = () => {
    const { locale, setLocale } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const switcherRef = useRef<HTMLDivElement>(null);

    const handleSetLocale = (lang: 'uk' | 'en' | 'ru') => {
        setLocale(lang);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={switcherRef} className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-tg-secondary-bg-hover">
                <Icon icon="lucide:globe" className="h-6 w-6" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-tg-secondary-bg-hover rounded-md shadow-lg py-1 z-30">
                    <button onClick={() => handleSetLocale('uk')} className={`block w-full text-left px-4 py-2 text-sm hover:bg-tg-bg ${locale === 'uk' ? 'font-bold text-tg-link' : ''}`}>Українська</button>
                    <button onClick={() => handleSetLocale('en')} className={`block w-full text-left px-4 py-2 text-sm hover:bg-tg-bg ${locale === 'en' ? 'font-bold text-tg-link' : ''}`}>English</button>
                    <button onClick={() => handleSetLocale('ru')} className={`block w-full text-left px-4 py-2 text-sm hover:bg-tg-bg ${locale === 'ru' ? 'font-bold text-tg-link' : ''}`}>Русский</button>
                </div>
            )}
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ currentPage, goBack, navigateTo, unreadMessagesCount, user }) => {
  const { t } = useI18n();
  const showBackButton = ['create', 'detail', 'profile', 'favorites', 'chats', 'admin', 'auth', 'sellerProfile', 'chatThread'].includes(currentPage);

  const getPageTitle = (page: Page): string => {
      const pageKey = page.charAt(0).toLowerCase() + page.slice(1);
      return t(`header.${pageKey}`);
  };
  
  return (
    <header className="sticky top-0 z-20 bg-tg-secondary-bg/80 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between p-4 h-16">
        <div className="w-1/3">
          {showBackButton ? (
            <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-tg-secondary-bg-hover">
              <Icon icon="lucide:arrow-left" className="h-6 w-6" />
            </button>
          ) : (
            <LanguageSwitcher />
          )}
        </div>
        <div className="w-1/3 text-center">
            <h1 className="text-xl font-bold truncate">{getPageTitle(currentPage)}</h1>
        </div>
        <div className="w-1/3 flex justify-end items-center space-x-1">
            <button onClick={() => navigateTo('home')} className={`p-2 rounded-full hover:bg-tg-secondary-bg-hover ${currentPage === 'home' ? 'text-tg-link' : ''}`}>
                <Icon icon="lucide:home" className="h-6 w-6" />
            </button>
            <button onClick={() => navigateTo('profile')} className={`p-2 rounded-full hover:bg-tg-secondary-bg-hover ${currentPage === 'profile' ? 'text-tg-link' : ''}`}>
                <Icon icon="lucide:user-round" className="h-6 w-6" />
            </button>
            <button onClick={() => navigateTo('chats')} className={`p-2 rounded-full hover:bg-tg-secondary-bg-hover relative ${currentPage === 'chats' || currentPage === 'chatThread' ? 'text-tg-link' : ''}`}>
                <Icon icon="lucide:message-square" className="h-6 w-6" />
                {unreadMessagesCount > 0 && (
                     <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                        {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                )}
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;