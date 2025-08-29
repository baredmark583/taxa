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
    if (status === 'active' || status === 'in_delivery') return null;

    const styles: Record<string, string> = {
        reserved: 'bg-yellow-500/80',
        sold: 'bg-gray-600/80',
        archived: 'bg-blue-500/80'
    };
    
    const currentStatus = status as keyof typeof styles;

    return (
        <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-bold text-white rounded ${styles[currentStatus]}`}>
            {t(`adStatus.${status}`)}
        </div>
    )
}

const BoostBadge: React.FC = () => (
    <div className="absolute top-2 left-2 px-2 py-1 text-xs font-bold text-white rounded bg-gradient-to-r from-orange-500 to-red-600 shadow-lg">
        🔥 TOP
    </div>
);

const FavoriteButton: React.FC<{ isFavorite: boolean, onClick: (e: React.MouseEvent) => void }> = ({ isFavorite, onClick }) => {
  const { t } = useI18n();
  return (
    <button 
      onClick={onClick}
      className="absolute top-2 right-2 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors z-10"
      aria-label={isFavorite ? t('adCard.removeFromFavorites') : t('adCard.addToFavorites')}
    >
      <Icon icon="lucide:heart" className={`h-6 w-6 transition-colors ${isFavorite ? 'fill-current' : ''}`} />
    </button>
  );
};

const AdCard: React.FC<AdCardProps> = ({ ad, isFavorite, onToggleFavorite }) => {
  const { t } = useI18n();
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the favorite icon
    e.stopPropagation(); 
    onToggleFavorite(ad.id);
  };
  
  const imageUrl = ad.imageUrls && ad.imageUrls.length > 0
    ? resolveImageUrl(ad.imageUrls[0])
    : `https://placehold.co/400x300/18222d/b1c3d5?text=${encodeURIComponent(t('common.noPhoto'))}`;

  return (
    <div 
      className={`relative bg-tg-secondary-bg rounded-lg overflow-hidden shadow-lg transition-transform duration-200 flex flex-col ${ad.status === 'sold' || ad.status === 'archived' ? 'opacity-60' : 'cursor-pointer hover:scale-105'}`}
    >
      {ad.isBoosted ? <BoostBadge /> : <StatusBadge status={ad.status} />}
      <FavoriteButton isFavorite={isFavorite} onClick={handleFavoriteClick} />
      <div className="relative pt-[75%]"> {/* Aspect ratio 4:3 */}
        <img className="absolute top-0 left-0 w-full h-full object-cover" src={imageUrl} alt={ad.title} />
         {(ad.status === 'sold' || ad.status === 'archived') && <div className="absolute inset-0 bg-black/30"></div>}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg mb-1 truncate flex-grow">{ad.title}</h3>
        <div className="flex items-baseline gap-2">
            <p className="text-tg-text font-semibold text-xl mt-1">{formatPrice(ad.price)}</p>
            {ad.previousPrice && <p className="text-tg-hint text-sm line-through">{formatPrice(ad.previousPrice)}</p>}
        </div>
        <p className="text-tg-hint text-sm mt-2 truncate">{ad.location}</p>
      </div>
    </div>
  );
};

export default AdCard;