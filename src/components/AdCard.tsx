import React from 'react';
import { type Ad, type AdStatus } from '../types';
import { formatPrice, resolveImageUrl } from '../utils/formatters';
import { Icon } from '@iconify/react';
import { useI18n } from '../I18nContext';

interface AdCardProps {
  ad: Ad;
  isFavorite: boolean;
  onToggleFavorite: (adId: string) => void;
}

const StatusBadge: React.FC<{ status: AdStatus }> = ({ status }) => {
    const { t } = useI18n();
    if (status === 'active') return null;

    const styles: Record<string, string> = {
        reserved: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        sold: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        archived: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    };
    
    const currentStatus = status as keyof typeof styles;

    return (
        <div className={`absolute top-3 left-3 px-2 py-1 text-xs font-bold rounded-full ${styles[currentStatus]}`}>
            {t(`adStatus.${status}`)}
        </div>
    )
}

const BoostBadge: React.FC = () => (
    <div className="absolute top-3 left-3 px-2 py-1 text-xs font-bold text-white rounded-full bg-gradient-to-r from-orange-500 to-red-600 shadow-lg flex items-center gap-1">
        <Icon icon="lucide:flame" />
        TOP
    </div>
);

const FavoriteButton: React.FC<{ isFavorite: boolean, onClick: (e: React.MouseEvent) => void }> = ({ isFavorite, onClick }) => {
  const { t } = useI18n();
  return (
    <button 
      onClick={onClick}
      className="absolute top-3 right-3 p-2 bg-white/70 dark:bg-black/40 rounded-full text-foreground dark:text-white hover:bg-white dark:hover:bg-black/60 backdrop-blur-sm transition-all z-10"
      aria-label={isFavorite ? t('adCard.removeFromFavorites') : t('adCard.addToFavorites')}
    >
      <Icon icon="lucide:heart" className={`h-5 w-5 transition-colors ${isFavorite ? 'text-red-500 fill-current' : 'text-inherit'}`} />
    </button>
  );
};

const AdCard: React.FC<AdCardProps> = ({ ad, isFavorite, onToggleFavorite }) => {
  const { t } = useI18n();
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    onToggleFavorite(ad.id);
  };
  
  const imageUrl = ad.imageUrls && ad.imageUrls.length > 0
    ? resolveImageUrl(ad.imageUrls[0])
    : `https://placehold.co/400x300/e5e5ea/6b7280?text=${encodeURIComponent(t('common.noPhoto'))}`;

  return (
    <div 
      className={`relative bg-transparent group overflow-hidden flex flex-col ${ad.status === 'sold' || ad.status === 'archived' ? 'opacity-70' : 'cursor-pointer'}`}
    >
        <div className="relative w-full overflow-hidden rounded-xl aspect-[4/3]">
            <img 
                className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                src={imageUrl} 
                alt={ad.title} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
             {(ad.status === 'sold' || ad.status === 'archived') && <div className="absolute inset-0 bg-white/30 dark:bg-black/30"></div>}
            
            {ad.isBoosted ? <BoostBadge /> : <StatusBadge status={ad.status} />}
            <FavoriteButton isFavorite={isFavorite} onClick={handleFavoriteClick} />
        </div>
      
      <div className="pt-3 flex flex-col flex-grow">
        <h3 className="font-semibold text-base mb-1 truncate flex-grow text-foreground dark:text-dark-foreground">{ad.title}</h3>
        <p className="text-muted-foreground dark:text-dark-muted-foreground text-sm truncate">{ad.location}</p>
        <div className="flex items-baseline gap-2 mt-1">
            <p className="text-foreground dark:text-dark-foreground font-bold text-lg">{formatPrice(ad.price)}</p>
            {ad.previousPrice && <p className="text-muted-foreground dark:text-dark-muted-foreground text-sm line-through">{formatPrice(ad.previousPrice)}</p>}
        </div>
      </div>
    </div>
  );
};

export default AdCard;