import React from 'react';
import { type Ad, type AdStatus } from '../types';
import { formatPrice } from '../utils/formatters';

interface AdCardProps {
  ad: Ad;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: (adId: string) => void;
}

const StatusBadge: React.FC<{ status: AdStatus }> = ({ status }) => {
    if (status === 'active' || status === 'in_delivery') return null;

    const styles = {
        reserved: 'bg-yellow-500/80',
        sold: 'bg-gray-600/80',
        archived: 'bg-blue-500/80'
    };
    const text = {
        reserved: 'В резерві',
        sold: 'Продано',
        archived: 'В архіві'
    }

    const currentStatus = status as keyof typeof styles;

    return (
        <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-bold text-white rounded ${styles[currentStatus]}`}>
            {text[currentStatus]}
        </div>
    )
}

const BoostBadge: React.FC = () => (
    <div className="absolute top-2 left-2 px-2 py-1 text-xs font-bold text-white rounded bg-gradient-to-r from-orange-500 to-red-600 shadow-lg">
        🔥 TOP
    </div>
);

const FavoriteButton: React.FC<{ isFavorite: boolean, onClick: (e: React.MouseEvent) => void }> = ({ isFavorite, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="absolute top-2 right-2 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors z-10"
      aria-label={isFavorite ? 'Видалити з обраного' : 'Додати в обране'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill={isFavorite ? 'currentColor' : 'none'}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
      </svg>
    </button>
  );
};

const AdCard: React.FC<AdCardProps> = ({ ad, onClick, isFavorite, onToggleFavorite }) => {
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    onToggleFavorite(ad.id);
  };
  
  const imageUrl = ad.imageUrls && ad.imageUrls.length > 0 ? ad.imageUrls[0] : 'https://placehold.co/400x300/18222d/b1c3d5?text=Немає+фото';

  return (
    <div 
      className={`relative bg-tg-secondary-bg rounded-lg overflow-hidden shadow-lg transition-transform duration-200 flex flex-col ${ad.status === 'sold' || ad.status === 'archived' ? 'opacity-60' : 'cursor-pointer hover:scale-105'}`}
      onClick={ad.status !== 'sold' && ad.status !== 'archived' ? onClick : undefined}
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