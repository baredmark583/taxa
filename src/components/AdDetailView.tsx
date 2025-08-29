import React, { useState } from 'react';
import { Ad, AuthUser } from '../types';
import { formatPrice, formatRelativeDate, resolveImageUrl } from '../utils/formatters';
import { Icon } from '@iconify/react';
import { useI18n } from '../I18nContext';
import { useAppContext } from '../AppContext';

interface AdDetailViewProps {
  ad: Ad;
  currentUser: AuthUser | null;
  showToast: (message: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (adId: string) => void;
  onViewSellerProfile: (sellerId: string) => void;
  onStartChat: (ad: Ad) => void;
  onEditAd: (ad: Ad) => void;
}

const AdDetailView: React.FC<AdDetailViewProps> = ({ ad, currentUser, showToast, isFavorite, onToggleFavorite, onViewSellerProfile, onStartChat, onEditAd }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { t } = useI18n();
  const { isWeb } = useAppContext();

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % ad.imageUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + ad.imageUrls.length) % ad.imageUrls.length);
  };

  const handleShare = async () => {
    const botUsername = 'taxaAIbot';
    const directLinkName = 'item';
    const shareUrl = `https://t.me/${botUsername}/${directLinkName}?startapp=${ad.id}`;
    const shareText = `${t('adDetail.shareText')} "${ad.title}" ${t('adDetail.sharePrice')} ${formatPrice(ad.price)}!`;
    const tg = (window as any).Telegram?.WebApp;

    if (tg) {
        const telegramShareUrl = new URL('https://t.me/share/url');
        telegramShareUrl.searchParams.set('url', shareUrl);
        telegramShareUrl.searchParams.set('text', shareText);
        tg.openTelegramLink(telegramShareUrl.toString());
        return;
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: `Taxa AI: ${ad.title}`, text: shareText, url: shareUrl });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(shareUrl).then(() => showToast(t('toast.linkCopied')));
        }
      }
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => showToast(t('toast.linkCopied')));
    }
  };


  const isMyAd = currentUser && ad.seller.id === currentUser.id;

  const ImageGallery = () => (
    <div className={`relative w-full aspect-square bg-tg-secondary-bg rounded-lg overflow-hidden ${isWeb ? 'sticky top-24' : ''}`}>
      {ad.imageUrls.length > 0 ? (
        <>
          <img src={resolveImageUrl(ad.imageUrls[currentImageIndex])} alt={ad.title} className="w-full h-full object-contain" />
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
          {t('common.noPhoto')}
        </div>
      )}
      <button onClick={handleShare} className="absolute top-2 right-2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors z-10">
          <Icon icon="lucide:share-2" className="h-6 w-6" />
      </button>
    </div>
  );

  const AdInfo = () => (
    <div className={`${isWeb ? '' : 'p-4'} space-y-4`}>
        <div>
          <h1 className="text-2xl font-bold">{ad.title}</h1>
          <p className="text-3xl font-bold mt-2 text-tg-link">{formatPrice(ad.price)}</p>
        </div>
        <div className="flex gap-2">
            {isMyAd ? (
                 <button onClick={() => onEditAd(ad)} className="w-full bg-tg-secondary-bg-hover text-tg-text font-bold py-3 px-6 rounded-lg transition-colors text-center">
                    {t('adDetail.edit')}
                </button>
            ) : (
                <>
                <button onClick={() => onStartChat(ad)} className="w-full bg-tg-button text-tg-button-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors text-center">
                    {t('adDetail.writeToSeller')}
                </button>
                 <button onClick={() => onToggleFavorite(ad.id)} className={`p-3 rounded-lg transition-colors ${isFavorite ? 'bg-red-500/20 text-red-400' : 'bg-tg-secondary-bg-hover'}`}>
                    <Icon icon="lucide:heart" className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                </>
            )}
        </div>
        <div>
            <h2 className="text-xl font-semibold mb-2">{t('adDetail.description')}</h2>
            <p className="text-tg-hint whitespace-pre-wrap">{ad.description}</p>
        </div>
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
        <div className="text-sm text-tg-hint border-t border-tg-border pt-4 mt-6">
            <div className="flex justify-between"><span>{t('adDetail.category')}:</span> <span className="text-tg-text">{ad.category}</span></div>
            <div className="flex justify-between mt-1"><span>{t('adDetail.location')}:</span> <span className="text-tg-text">{ad.location}</span></div>
            <div className="flex justify-between mt-1"><span>{t('adDetail.published')}:</span> <span className="text-tg-text">{formatRelativeDate(ad.createdAt, t)}</span></div>
        </div>
         <div className="border-t border-tg-border pt-4">
            <h2 className="text-xl font-semibold mb-2">{t('adDetail.seller')}</h2>
             <button onClick={() => onViewSellerProfile(ad.seller.id)} className="w-full flex items-center space-x-3 bg-tg-secondary-bg p-3 rounded-lg hover:bg-tg-secondary-bg-hover transition-colors text-left">
                 <img
                     src={resolveImageUrl(ad.seller.avatarUrl || `https://i.pravatar.cc/150?u=${ad.seller.id}`)}
                     alt={ad.seller.name}
                     className="w-12 h-12 rounded-full object-cover"
                 />
                 <div>
                     <p className="font-bold text-lg">{ad.seller.name}</p>
                 </div>
             </button>
        </div>
      </div>
  );

  if (isWeb) {
      return (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 xl:gap-12 animate-modal-fade-in">
              <div className="lg:col-span-3">
                  <ImageGallery />
              </div>
              <div className="lg:col-span-2">
                  <AdInfo />
              </div>
          </div>
      );
  }

  // Mobile View
  return (
    <div className="pb-24 animate-modal-fade-in">
      <ImageGallery />
      <AdInfo />
    </div>
  );
};

export default AdDetailView;
