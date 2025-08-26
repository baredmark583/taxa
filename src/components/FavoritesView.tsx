import React, { useMemo } from 'react';
import { type Ad, type Page } from '../types';
import AdCard from './AdCard';
import { EmptyHeartIcon } from './icons/EmptyHeartIcon';
import { formatPrice } from '../utils/formatters';

interface FavoritesViewProps {
  ads: Ad[];
  viewAdDetails: (ad: Ad) => void;
  navigateTo: (page: Page) => void;
  favoriteAdIds: Set<string>;
  onToggleFavorite: (adId: string) => void;
}

const FavoritesView: React.FC<FavoritesViewProps> = ({ ads, viewAdDetails, navigateTo, favoriteAdIds, onToggleFavorite }) => {

  const favoriteAds = useMemo(() => {
    return ads.filter(ad => favoriteAdIds.has(ad.id));
  }, [ads, favoriteAdIds]);
  
  const priceDropAds = useMemo(() => {
    return favoriteAds.filter(ad => ad.previousPrice && parseInt(ad.price, 10) < parseInt(ad.previousPrice, 10));
  }, [favoriteAds]);

  const otherFavoriteAds = useMemo(() => {
    const priceDropIds = new Set(priceDropAds.map(ad => ad.id));
    return favoriteAds.filter(ad => !priceDropIds.has(ad.id));
  }, [favoriteAds, priceDropAds]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center">Обране</h2>

      {priceDropAds.length > 0 && (
        <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-green-400 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" /></svg>
                Ціни знижено
            </h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {priceDropAds.map((ad) => (
                    <AdCard 
                    key={ad.id} 
                    ad={ad} 
                    onClick={() => viewAdDetails(ad)}
                    isFavorite={true}
                    onToggleFavorite={onToggleFavorite}
                    />
                ))}
            </div>
        </div>
      )}
      
      {otherFavoriteAds.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {otherFavoriteAds.map((ad) => (
            <AdCard 
              key={ad.id} 
              ad={ad} 
              onClick={() => viewAdDetails(ad)}
              isFavorite={true} // It's always a favorite on this page
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : priceDropAds.length === 0 ? (
        <div className="text-center text-tg-hint mt-12 flex flex-col items-center">
          <EmptyHeartIcon />
          <p className="text-lg mt-4 mb-4">Тут будуть оголошення, які ви збережете.</p>
          <button
            onClick={() => navigateTo('home')}
            className="bg-tg-button text-tg-button-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Знайти оголошення
          </button>
        </div>
      ) : null }
    </div>
  );
};

export default FavoritesView;
