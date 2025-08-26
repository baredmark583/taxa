import React from 'react';
import { type Page } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { UserIcon } from './icons/UserIcon';
import { ChatIcon } from './icons/ChatIcon';

interface HeaderProps {
  currentPage: Page;
  goBack: () => void;
  navigateTo: (page: Page) => void;
  unreadMessagesCount: number;
}

const getPageTitle = (page: Page): string => {
  switch (page) {
    case 'home':
      return 'Оголошення';
    case 'create':
      return 'Створити оголошення';
    case 'profile':
      return 'Мій профіль';
    case 'detail':
      return 'Деталі';
    case 'favorites':
        return 'Обране';
    case 'chats':
        return 'Чати';
    default:
      return 'Taxa AI';
  }
};

const Header: React.FC<HeaderProps> = ({ currentPage, goBack, navigateTo, unreadMessagesCount }) => {
  const showBackButton = ['create', 'detail', 'profile', 'favorites', 'chats'].includes(currentPage);
  
  return (
    <header className="sticky top-0 z-20 bg-tg-secondary-bg/80 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between p-4 h-16">
        <div className="w-1/3">
          {showBackButton ? (
            <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-tg-secondary-bg-hover">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="w-6 h-6"></div>
          )}
        </div>
        <div className="w-1/3 text-center">
            <h1 className="text-xl font-bold truncate">{getPageTitle(currentPage)}</h1>
        </div>
        <div className="w-1/3 flex justify-end items-center space-x-1">
            <button onClick={() => navigateTo('home')} className={`p-2 rounded-full hover:bg-tg-secondary-bg-hover ${currentPage === 'home' ? 'text-tg-link' : ''}`}>
                <HomeIcon />
            </button>
            <button onClick={() => navigateTo('profile')} className={`p-2 rounded-full hover:bg-tg-secondary-bg-hover ${currentPage === 'profile' ? 'text-tg-link' : ''}`}>
                <UserIcon />
            </button>
            <button onClick={() => alert('Coming soon!')} className="p-2 rounded-full hover:bg-tg-secondary-bg-hover relative" disabled>
                <ChatIcon />
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
