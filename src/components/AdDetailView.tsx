import React, { useState } from 'react';
import { Ad, AuthUser, Page } from '../types';
import { formatPrice, formatRelativeDate } from '../utils/formatters';
import { Icon } from '@iconify/react';

interface AdDetailViewProps {
  ad: Ad;
  currentUser: AuthUser | null;
  navigateTo: (page: Page) => void;
  showToast: (message: string) => void;
}

const AdDetailView: React.FC<AdDetailViewProps> = ({ ad, currentUser, navigateTo, showToast }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % ad.imageUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + ad.imageUrls.length) % ad.imageUrls.length);
  };

  const handleShare = async () => {
    // IMPORTANT: Replace 'taxaAIbot' with your bot's username, and 'item' with the direct link name from BotFather.
    const botUsername = 'taxaAIbot';
    const directLinkName = 'item';
    const shareUrl = `https://t.me/${botUsername}/${directLinkName}?startapp=${ad.id}`;
    const tg = (window as any).Telegram?.WebApp;

    // Inside Telegram, navigator.share is unreliable. We default to copying the link.
    if (tg) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Посилання для поширення скопійовано!');
        if (tg.HapticFeedback?.impactOccurred) {
          tg.HapticFeedback.impactOccurred('light');
        }
      });
      return;
    }

    // Outside Telegram, try the Web Share API first.
    if (navigator.share) {
      const shareData = {
        title: `Taxa AI: ${ad.title}`,
        text: `Подивіться, що я знайшов на Taxa AI: "${ad.title}" за ${formatPrice(ad.price)}!`,
        url: shareUrl,
      };
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Don't show an error if the user just closed the share dialog.
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
          // Fallback to clipboard
          navigator.clipboard.writeText(shareUrl).then(() => showToast('Посилання скопійовано!'));
        }
      }
    } else {
      // Fallback for browsers without Web Share API.
      navigator.clipboard.writeText(shareUrl).then(() => showToast('Посилання скопійовано!'));
    }
  };


  const isMyAd = currentUser && ad.seller.id === currentUser.id;

  return (
    <div className="pb-24 animate-modal-fade-in">
      {/* Image Gallery */}
      <div className="relative w-full aspect-square bg-tg-secondary-bg rounded-lg overflow-hidden">
        {ad.imageUrls.length > 0 ? (
          <>
            <img src={ad.imageUrls[currentImageIndex]} alt={ad.title} className="w-full h-full object-contain" />
            {ad.imageUrls.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors z-10">
                  &#10094;
                </button>
                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors z-10">
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
         {/* Share button on top of the image */}
        <button onClick={handleShare} className="absolute top-2 right-2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors z-10">
            <Icon icon="lucide:share-2" className="h-6 w-6" />
        </button>
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
            ) : currentUser ? (
                <>
                <button className="w-full bg-tg-button text-tg-button-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors text-center" disabled>
                    Написати продавцю
                </button>
                 <button className="p-3 bg-tg-secondary-bg-hover rounded-lg" disabled>
                    <Icon icon="lucide:heart" className="h-6 w-6" />
                </button>
                </>
            ) : (
                 <button onClick={() => navigateTo('auth')} className="w-full bg-tg-button text-tg-button-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors text-center">
                    Увійдіть, щоб написати
                </button>
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