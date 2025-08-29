import React from 'react';
import { type Page } from '../types';
import { Icon } from '@iconify/react';
import { useI18n } from '../I18nContext';

interface HeaderProps {
  currentPage: Page;
  goBack: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, goBack }) => {
  const { t } = useI18n();
  const showBackButton = ['create', 'detail', 'profile', 'favorites', 'chats', 'admin', 'auth', 'sellerProfile', 'chatThread'].includes(currentPage);

  const getPageTitle = (page: Page): string => {
      const pageKey = page.charAt(0).toLowerCase() + page.slice(1);
      return t(`header.${pageKey}`);
  };
  
  return (
    <header className="sticky top-0 z-20 bg-tg-secondary-bg/80 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between p-4 h-16">
        <div className="w-1/4">
          {showBackButton && (
            <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-tg-secondary-bg-hover">
              <Icon icon="lucide:arrow-left" className="h-6 w-6" />
            </button>
          )}
        </div>
        <div className="w-1/2 text-center">
            <h1 className="text-xl font-bold truncate">{getPageTitle(currentPage)}</h1>
        </div>
        <div className="w-1/4">
            {/* Right side is empty, navigation is in BottomNav */}
        </div>
      </div>
    </header>
  );
};

export default Header;
