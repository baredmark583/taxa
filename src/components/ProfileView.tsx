import React, { useMemo, useState, useRef, useEffect } from 'react';
import { type Ad, type Page, type AuthUser, AdStatus } from '../types';
import AdCard from './AdCard';
import { Icon } from '@iconify/react';


interface ProfileViewProps {
  ads: Ad[];
  viewAdDetails: (ad: Ad) => void;
  navigateTo: (page: Page) => void;
  currentUser: AuthUser;
  onUpdateAdStatus: (adId: string, status: AdStatus) => void;
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

const AdManagementDropdown: React.FC<{ ad: Ad, onUpdateStatus: (adId: string, status: AdStatus) => void }> = ({ ad, onUpdateStatus }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleStatusChange = (status: AdStatus) => {
        onUpdateStatus(ad.id, status);
        setIsOpen(false);
    }

    return (
        <div ref={dropdownRef} className="absolute top-2 right-2 z-10">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-black/40 rounded-full text-white hover:bg-black/60">
                <Icon icon="lucide:more-vertical" className="h-5 w-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-tg-secondary-bg-hover rounded-md shadow-lg py-1">
                    {ad.status !== 'sold' && <button onClick={() => handleStatusChange('sold')} className="block w-full text-left px-4 py-2 text-sm hover:bg-tg-bg">Позначити як продано</button>}
                    {ad.status !== 'archived' && <button onClick={() => handleStatusChange('archived')} className="block w-full text-left px-4 py-2 text-sm hover:bg-tg-bg">В архів</button>}
                    {ad.status !== 'active' && <button onClick={() => handleStatusChange('active')} className="block w-full text-left px-4 py-2 text-sm hover:bg-tg-bg">Активувати</button>}
                </div>
            )}
        </div>
    );
};


const ProfileView: React.FC<ProfileViewProps> = ({ ads, viewAdDetails, navigateTo, currentUser, onUpdateAdStatus }) => {

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
              onClick={() => navigateTo('favorites')}
              label="Обране"
              icon={<Icon icon="lucide:heart" className="h-6 w-6 text-tg-hint" />}
          />
          <ProfileButton
              onClick={() => alert('Coming soon!')} // navigateTo('savedSearches')
              label="Збережені пошуки"
              disabled={true}
              icon={<Icon icon="lucide:bookmark" className="h-6 w-6 text-tg-hint" />}
          />
           {currentUser.role === 'ADMIN' && (
             <ProfileButton
                onClick={() => navigateTo('admin')}
                label="Адмін Панель"
                icon={<Icon icon="lucide:key-round" className="h-6 w-6 text-tg-hint" />}
            />
           )}
      </div>

      <h3 className="text-xl font-bold mb-4 text-center">Мої оголошення</h3>
      
      {myAds.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {myAds.map((ad) => (
            <div key={ad.id} className="relative">
                <AdCard 
                  ad={ad} 
                  onClick={() => viewAdDetails(ad)} 
                  isFavorite={false} // Favorites are not relevant for own ads
                  onToggleFavorite={() => {}} 
                />
                <AdManagementDropdown ad={ad} onUpdateStatus={onUpdateAdStatus} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-tg-hint mt-12 flex flex-col items-center">
          <Icon icon="lucide:package-search" className="h-20 w-20 text-tg-border" />
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