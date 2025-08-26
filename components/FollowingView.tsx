import React, { useMemo } from 'react';
import { type Ad, type TelegramUser } from '../types';
import AdCard from './AdCard';

interface FollowingViewProps {
  ads: Ad[];
  viewAdDetails: (ad: Ad) => void;
  favoriteAdIds: Set<string>;
  onToggleFavorite: (adId: string) => void;
  followingSellerIds: Set<number>;
  currentUser: TelegramUser;
}

const FollowingView: React.FC<FollowingViewProps> = ({ ads, viewAdDetails, favoriteAdIds, onToggleFavorite, followingSellerIds }) => {

  const followedAds = useMemo(() => {
    if (followingSellerIds.size === 0) return [];
    return ads
      .filter(ad => followingSellerIds.has(ad.seller.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [ads, followingSellerIds]);
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center">Мої підписки</h2>
      
      {followedAds.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {followedAds.map((ad) => (
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
          <p className="text-lg mt-4 mb-4">Нових оголошень від продавців, за якими ви стежите, немає.</p>
        </div>
      )}
    </div>
  );
};

export default FollowingView;