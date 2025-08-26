import React, { useMemo } from 'react';
import { type Ad, type Page, type TelegramUser } from '../types';
import AdCard from './AdCard';
import { EmptyBoxIcon } from './icons/EmptyBoxIcon';

interface ProfileViewProps {
  ads: Ad[];
  viewAdDetails: (ad: Ad) => void;
  navigateTo: (page: Page) => void;
  favoriteAdIds: Set<string>;
  onToggleFavorite: (adId: string) => void;
  currentUser: TelegramUser | null;
  newSavedSearchMatches: number;
}

const ProfileButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    badgeCount?: number;
}> = ({ icon, label, onClick, badgeCount }) => (
    <button onClick={onClick} className="w-full flex items-center p-4 bg-tg-secondary-bg rounded-lg hover:bg-tg-secondary-bg-hover transition-colors relative">
        {icon}
        <span className="ml-4 font-semibold">{label}</span>
        {badgeCount !== undefined && badgeCount > 0 && (
             <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-tg-link text-xs font-medium text-white">
              {badgeCount}
          </span>
        )}
    </button>
);


const ProfileView: React.FC<ProfileViewProps> = ({ ads, viewAdDetails, navigateTo, favoriteAdIds, onToggleFavorite, currentUser, newSavedSearchMatches }) => {

  const myAds = useMemo(() => {
    if (!currentUser) return [];
    return ads.filter(ad => ad.seller.id === currentUser.id);
  }, [ads, currentUser]);
  
  const userName = currentUser ? [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') : 'Гість';
  const userAvatar = currentUser?.photo_url || `https://i.pravatar.cc/150?u=${currentUser?.id || 'default'}`;

  return (
    <div>
      <div className="flex flex-col items-center mb-8">
        <img src={userAvatar} alt="User Avatar" className="w-24 h-24 rounded-full mb-4 object-cover border-2 border-tg-border" />
        <h2 className="text-2xl font-bold">{userName}</h2>
        {currentUser?.username && <p className="text-tg-hint">@{currentUser.username}</p>}
      </div>
      
      <div className="space-y-2 mb-8">
          <ProfileButton
              onClick={() => navigateTo('favorites')}
              label="Обране"
              badgeCount={favoriteAdIds.size}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-tg-hint" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>}
          />
          <ProfileButton
              onClick={() => navigateTo('savedSearches')}
              label="Збережені пошуки"
              badgeCount={newSavedSearchMatches}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-tg-hint" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>}
          />
          <ProfileButton
              onClick={() => navigateTo('following')}
              label="Мої підписки"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-tg-hint" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
          />
      </div>

      <h3 className="text-xl font-bold mb-4 text-center">Мої оголошення</h3>
      
      {myAds.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {myAds.map((ad) => (
            <AdCard 
              key={ad.id} 
              ad={ad} 
              onClick={() => viewAdDetails(ad)} 
              isFavorite={favoriteAdIds.has(ad.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-tg-hint mt-12 flex flex-col items-center">
          <EmptyBoxIcon />
          <p className="text-lg mt-4 mb-4">У вас поки немає активних оголошень.</p>
          <button
            onClick={() => navigateTo('create')}
            className="bg-tg-button text-tg-button-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Створити перше оголошення
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileView;