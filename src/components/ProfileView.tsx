import React, { useMemo } from 'react';
import { type Ad, type Page, type AuthUser } from '../types';
import AdCard from './AdCard';
import { EmptyBoxIcon } from './icons/EmptyBoxIcon';
import { KeyIcon } from './icons/KeyIcon';


interface ProfileViewProps {
  ads: Ad[];
  viewAdDetails: (ad: Ad) => void;
  navigateTo: (page: Page) => void;
  currentUser: AuthUser;
}

const ProfileButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}> = ({ icon, label, onClick, disabled }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className="w-full flex items-center p-4 bg-tg-secondary-bg rounded-lg hover:bg-tg-secondary-bg-hover transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {icon}
        <span className="ml-4 font-semibold">{label}</span>
    </button>
);


const ProfileView: React.FC<ProfileViewProps> = ({ ads, viewAdDetails, navigateTo, currentUser }) => {

  const myAds = useMemo(() => {
    return ads.filter(ad => ad.sellerId === currentUser.id);
  }, [ads, currentUser]);
  
  const userAvatar = currentUser?.avatarUrl || `https://i.pravatar.cc/150?u=${currentUser?.id || 'default'}`;

  return (
    <div>
      <div className="flex flex-col items-center mb-8">
        <img src={userAvatar} alt="User Avatar" className="w-24 h-24 rounded-full mb-4 object-cover border-2 border-tg-border" />
        <h2 className="text-2xl font-bold">{currentUser.name}</h2>
        <p className="text-tg-hint">{currentUser.email}</p>
      </div>
      
      <div className="space-y-2 mb-8">
          <ProfileButton
              onClick={() => alert('Coming soon!')} // navigateTo('favorites')
              label="Обране"
              disabled={true}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-tg-hint" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>}
          />
          <ProfileButton
              onClick={() => alert('Coming soon!')} // navigateTo('savedSearches')
              label="Збережені пошуки"
              disabled={true}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-tg-hint" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>}
          />
           {currentUser.role === 'ADMIN' && (
             <ProfileButton
                onClick={() => navigateTo('admin')}
                label="Адмін Панель"
                icon={<KeyIcon />}
            />
           )}
      </div>

      <h3 className="text-xl font-bold mb-4 text-center">Мої оголошення</h3>
      
      {myAds.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {myAds.map((ad) => (
            <AdCard 
              key={ad.id} 
              ad={ad} 
              onClick={() => viewAdDetails(ad)} 
              isFavorite={false} // TODO: Implement favorites
              onToggleFavorite={() => {}} // TODO: Implement favorites
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