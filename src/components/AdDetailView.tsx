import React, { useState } from 'react';
import { Ad, AuthUser } from '../types';
import { formatPrice, formatRelativeDate } from '../utils/formatters';

interface AdDetailViewProps {
  ad: Ad;
  currentUser: AuthUser;
}

const AdDetailView: React.FC<AdDetailViewProps> = ({ ad, currentUser }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % ad.imageUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + ad.imageUrls.length) % ad.imageUrls.length);
  };

  const isMyAd = ad.seller.id === currentUser.id;

  return (
    <div className="pb-24 animate-modal-fade-in">
      {/* Image Gallery */}
      <div className="relative w-full aspect-square bg-tg-secondary-bg rounded-lg overflow-hidden">
        {ad.imageUrls.length > 0 ? (
          <>
            <img src={ad.imageUrls[currentImageIndex]} alt={ad.title} className="w-full h-full object-contain" />
            {ad.imageUrls.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors">
                  &#10094;
                </button>
                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors">
                  &#10095;
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {currentImageIndex + 1} / {ad.imageUrls.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-tg-hint">
            Немає фото
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Title and Price */}
        <div>
          <h1 className="text-2xl font-bold">{ad.title}</h1>
          <p className="text-3xl font-bold mt-2 text-tg-link">{formatPrice(ad.price)}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
            {isMyAd ? (
                 <button className="w-full bg-tg-secondary-bg-hover text-tg-text font-bold py-3 px-6 rounded-lg transition-colors text-center" disabled>
                    Редагувати
                </button>
            ) : (
                <>
                <button className="w-full bg-tg-button text-tg-button-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors text-center" disabled>
                    Написати продавцю
                </button>
                 <button className="p-3 bg-tg-secondary-bg-hover rounded-lg" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>
                </button>
                </>
            )}
        </div>
        
        {/* Description */}
        <div>
            <h2 className="text-xl font-semibold mb-2">Опис</h2>
            <p className="text-tg-hint whitespace-pre-wrap">{ad.description}</p>
        </div>

        {/* Tags */}
        {ad.tags && ad.tags.length > 0 && (
            <div>
                <div className="flex flex-wrap gap-2">
                    {ad.tags.map((tag, index) => (
                        <span key={index} className="bg-tg-secondary-bg px-3 py-1 rounded-full text-sm text-tg-hint">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        )}

        {/* Ad Info */}
        <div className="text-sm text-tg-hint border-t border-tg-border pt-4 mt-6">
            <div className="flex justify-between"><span>Категорія:</span> <span className="text-tg-text">{ad.category}</span></div>
            <div className="flex justify-between mt-1"><span>Місцезнаходження:</span> <span className="text-tg-text">{ad.location}</span></div>
            <div className="flex justify-between mt-1"><span>Опубліковано:</span> <span className="text-tg-text">{formatRelativeDate(ad.createdAt)}</span></div>
        </div>

        {/* Seller Info */}
         <div className="border-t border-tg-border pt-4">
            <h2 className="text-xl font-semibold mb-2">Продавець</h2>
             <div className="flex items-center space-x-3 bg-tg-secondary-bg p-3 rounded-lg">
                 <img
                     src={ad.seller.avatarUrl || `https://i.pravatar.cc/150?u=${ad.seller.id}`}
                     alt={ad.seller.name}
                     className="w-12 h-12 rounded-full object-cover"
                 />
                 <div>
                     <p className="font-bold text-lg">{ad.seller.name}</p>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default AdDetailView;
