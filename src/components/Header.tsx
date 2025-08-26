import React from 'react';
import { type Page } from '../types';

interface HeaderProps {
  currentPage: Page;
  goBack: () => void;
  navigateTo: (page: Page) => void;
  unreadMessagesCount: number;
}

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} className="absolute left-4 p-2 rounded-full hover:bg-tg-secondary-bg-hover transition-colors" aria-label="Назад">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
);

const ProfileButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="p-2 rounded-full hover:bg-tg-secondary-bg-hover transition-colors" aria-label="Профіль">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </button>
);

const FavoritesButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="p-2 rounded-full hover:bg-tg-secondary-bg-hover transition-colors" aria-label="Обране">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
      </svg>
    </button>
);

const ChatButton: React.FC<{ onClick: () => void, unreadCount: number }> = ({ onClick, unreadCount }) => (
    <button onClick={onClick} className="relative p-2 rounded-full hover:bg-tg-secondary-bg-hover transition-colors" aria-label="Чати">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white ring-2 ring-tg-secondary-bg">
              {unreadCount}
          </span>
      )}
    </button>
);


const Header: React.FC<HeaderProps> = ({ currentPage, goBack, navigateTo, unreadMessagesCount }) => {
  const showBackButton = currentPage !== 'home';
  const showActionButtons = currentPage === 'home';
  
  return (
    <header className="sticky top-0 z-10 bg-tg-secondary-bg/80 backdrop-blur-md h-16 flex items-center justify-center shadow-md">
      {showBackButton && <BackButton onClick={goBack} />}
      <h1 className="text-xl font-bold text-tg-text">AI Оголошення</h1>
      {showActionButtons && (
        <div className="absolute right-4 flex items-center space-x-2">
            <ChatButton onClick={() => navigateTo('chats')} unreadCount={unreadMessagesCount} />
            <FavoritesButton onClick={() => navigateTo('favorites')} />
            <ProfileButton onClick={() => navigateTo('profile')} />
        </div>
      )}
    </header>
  );
};

export default Header;
