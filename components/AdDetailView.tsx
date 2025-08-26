
import React, { useState, useEffect } from 'react';
import { type Ad, type AdStatus, type TelegramUser } from '../types';
import { formatPrice, formatRelativeDate } from '../utils/formatters';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import AiAssistant from './AiAssistant';
import { getShareableText, getSimilarAds, updateAdStatus, reportAd, boostAd, startSecureDeal } from '../backend/api';
import AdCard from './AdCard';
import SkeletonAdCard from './SkeletonAdCard';
import Spinner from './Spinner';
import ReportModal from './ReportModal';
import PublicQnA from './PublicQnA';
import MakeOfferModal from './MakeOfferModal';

interface AdDetailViewProps {
  ad: Ad;
  ads: Ad[]; // Full list of ads for finding similar ones
  onEdit: (ad: Ad) => void;
  onDelete: (adId: string) => void;
  favoriteAdIds: Set<string>;
  onToggleFavorite: (adId: string) => void;
  currentUser: TelegramUser;
  webApp: any; // Telegram Web App object
  onViewSellerProfile: (seller: Ad['seller']) => void;
  viewAdDetails: (ad: Ad) => void; // For similar ads
  onStartChat: (ad: Ad) => void;
  showToast: (message: string) => void;
  refreshAds: () => void;
  followingSellerIds: Set<number>;
  onToggleFollow: (sellerId: number) => void;
}

const ImageCarousel: React.FC<{ images: string[], title: string, status: AdStatus }> = ({ images, title, status }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };
  
  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  }

  if (!images || images.length === 0) {
      return <div className="w-full h-64 bg-tg-secondary-bg-hover flex items-center justify-center text-tg-hint">Немає зображення</div>;
  }
  
  const statusTextMap = {
      sold: 'Продано',
      reserved: 'В резерві',
      archived: 'В архіві',
      in_delivery: 'Доставляється',
      active: '',
  };


  return (
    <div className="relative w-full h-64">
      {images.length > 1 && (
         <>
          <button onClick={goToPrevious} className="absolute top-1/2 left-2 z-30 -translate-y-1/2 bg-black/30 text-white rounded-full p-2 hover:bg-black/50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={goToNext} className="absolute top-1/2 right-2 z-30 -translate-y-1/2 bg-black/30 text-white rounded-full p-2 hover:bg-black/50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
      <div className="w-full h-full rounded-t-lg overflow-hidden relative">
         <img className="w-full h-full object-cover" src={images[currentIndex]} alt={`${title} - фото ${currentIndex + 1}`} />
         {status !== 'active' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-2xl font-bold uppercase tracking-widest">
                    {statusTextMap[status]}
                </span>
            </div>
         )}
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
            {images.map((_, slideIndex) => (
                <button key={slideIndex} onClick={() => goToSlide(slideIndex)} className={`h-2 w-2 rounded-full ${currentIndex === slideIndex ? 'bg-white' : 'bg-white/50'}`}></button>
            ))}
        </div>
      )}
    </div>
  );
};

const ActionButton: React.FC<{ onClick: (e: React.MouseEvent) => void; children: React.ReactNode; 'aria-label': string, disabled?: boolean }> = (props) => (
    <button 
        onClick={props.onClick}
        disabled={props.disabled}
        className="p-2 rounded-full text-tg-hint hover:text-tg-text hover:bg-tg-secondary-bg-hover transition-colors disabled:opacity-50"
        aria-label={props['aria-label']}
    >
        {props.children}
    </button>
);

const SimilarAdsSection: React.FC<{ currentAd: Ad; allAds: Ad[]; viewAdDetails: (ad: Ad) => void; favoriteAdIds: Set<string>; onToggleFavorite: (adId: string) => void; }> = ({ currentAd, allAds, viewAdDetails, favoriteAdIds, onToggleFavorite }) => {
    const [similarAds, setSimilarAds] = useState<Ad[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSimilarAds = async () => {
            setIsLoading(true);
            try {
                // Filter out non-active ads from being recommended
                const activeAds = allAds.filter(ad => ad.status === 'active');
                const similarAdIds = await getSimilarAds(currentAd, activeAds);
                const foundAds = activeAds.filter(ad => similarAdIds.includes(ad.id));
                setSimilarAds(foundAds);
            } catch (error) {
                console.error("Failed to fetch similar ads:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSimilarAds();
    }, [currentAd.id, allAds]);

    if (isLoading) {
        return (
            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Схожі оголошення</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <SkeletonAdCard />
                    <SkeletonAdCard />
                </div>
            </div>
        )
    }

    if (similarAds.length === 0) {
        return null; // Don't show the section if no similar ads found
    }

    return (
        <div className="mt-6 border-t border-tg-border pt-6">
            <h2 className="text-xl font-semibold mb-4">Схожі оголошення</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {similarAds.map(ad => (
                    <AdCard 
                        key={ad.id} 
                        ad={ad} 
                        onClick={() => viewAdDetails(ad)}
                        isFavorite={favoriteAdIds.has(ad.id)}
                        onToggleFavorite={onToggleFavorite}
                    />
                ))}
            </div>
        </div>
    );
};

const SellerRating: React.FC<{ seller: Ad['seller'] }> = ({ seller }) => (
    <div className="flex items-center gap-1 text-sm text-tg-hint">
        {seller.isVerified && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-tg-link" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className="font-bold text-tg-text">{seller.rating.toFixed(1)}</span>
        <span>({seller.reviewsCount} {seller.reviewsCount === 1 ? 'відгук' : 'відгуків'})</span>
    </div>
);


const AdDetailView: React.FC<AdDetailViewProps> = ({ ad, ads, onEdit, onDelete, favoriteAdIds, onToggleFavorite, currentUser, webApp, onViewSellerProfile, viewAdDetails, onStartChat, showToast, refreshAds, followingSellerIds, onToggleFollow }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [currentAd, setCurrentAd] = useState(ad);
  
  const isOwner = currentUser ? currentAd.seller.id === currentUser.id : false;
  const isFavorite = favoriteAdIds.has(currentAd.id);
  const isFollowing = followingSellerIds.has(currentAd.seller.id);

  useEffect(() => {
    setCurrentAd(ad); // Update local state if the prop changes
  }, [ad]);

  const handleStatusChange = async (newStatus: AdStatus) => {
      try {
          const updatedAd = await updateAdStatus(currentAd.id, newStatus);
          setCurrentAd(updatedAd);
          refreshAds(); // Notify App.tsx to refetch all ads
      } catch (error) {
          console.error("Failed to update ad status", error);
      }
  };
  
  const handleBoostAd = async () => {
    try {
        const updatedAd = await boostAd(currentAd.id);
        setCurrentAd(updatedAd);
        refreshAds();
        showToast("Оголошення просувається!");
    } catch(e) {
        showToast("Не вдалося просунути оголошення");
    }
  }
  
  const handleShare = async () => {
    if (!webApp) return;
    setIsSharing(true);
    try {
        const text = await getShareableText(currentAd);
        webApp.openLink(`https://t.me/share/url?url= &text=${encodeURIComponent(text)}`);
    } catch (error) {
        console.error("Failed to generate share text", error);
        const fallbackText = `Дивись, яке оголошення я знайшов:\n\n*${currentAd.title}*\nЦіна: ${formatPrice(currentAd.price)}`;
        webApp.openLink(`https://t.me/share/url?url= &text=${encodeURIComponent(fallbackText)}`);
    } finally {
        setIsSharing(false);
    }
  };
  
  const handleSecureDeal = async () => {
      try {
          await startSecureDeal(currentAd.id, currentUser.id);
          refreshAds();
          showToast("Безпечна угода розпочата! Перевірте чат.");
          onStartChat(currentAd);
      } catch (error: any) {
          showToast(error.message);
      }
  };

  const handleDeleteRequest = () => setIsDeleteModalOpen(true);
  const handleReportRequest = () => setIsReportModalOpen(true);
  const handleOfferRequest = () => setIsOfferModalOpen(true);
  
  const handleReportSubmit = async (reason: string) => {
      try {
          await reportAd(currentAd.id, reason, currentUser?.id || 0);
          showToast("Дякуємо! Вашу скаргу надіслано.");
      } catch (e) {
          showToast("Не вдалося надіслати скаргу.");
      }
      setIsReportModalOpen(false);
  }

  const confirmDelete = () => {
    onDelete(currentAd.id);
    setIsDeleteModalOpen(false);
  };

  return (
    <>
    <div className="max-w-2xl mx-auto bg-tg-secondary-bg rounded-lg overflow-hidden shadow-xl pb-6">
      <ImageCarousel images={currentAd.imageUrls} title={currentAd.title} status={currentAd.status} />
      <div className="px-6 pt-6">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm text-tg-hint font-semibold uppercase">{currentAd.category} · {formatRelativeDate(currentAd.createdAt)}</p>
                <h1 className="text-3xl font-bold mt-1">{currentAd.title}</h1>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                <div className="flex items-baseline gap-2">
                    {currentAd.previousPrice && <p className="text-lg text-tg-hint line-through">{formatPrice(currentAd.previousPrice)}</p>}
                    <p className="text-3xl font-bold text-tg-link">{formatPrice(currentAd.price)}</p>
                </div>
                <div className="flex items-center">
                    <ActionButton onClick={handleShare} aria-label="Поділитися" disabled={isSharing}>
                         {isSharing ? <Spinner size="sm" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>}
                    </ActionButton>
                    <ActionButton 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(currentAd.id); }}
                        aria-label={isFavorite ? 'Видалити з обраного' : 'Додати в обране'}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24" stroke="currentColor" strokeWidth={2} fill={isFavorite ? 'currentColor' : 'none'}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                         </svg>
                    </ActionButton>
                     <ActionButton onClick={handleReportRequest} aria-label="Поскаржитись">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                    </ActionButton>
                </div>
            </div>
        </div>
        
        <div className="flex items-center text-tg-hint text-sm mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>{currentAd.location}</span>
        </div>
        
        {!isOwner && currentAd.status === 'active' && (
            <div className="mt-6 space-y-2">
                 <button 
                    onClick={handleSecureDeal}
                    className="w-full bg-tg-button text-tg-button-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Купити з доставкою
                </button>
                <div className="flex gap-2">
                    {currentAd.allowOffers && (
                         <button onClick={handleOfferRequest} className="flex-1 bg-tg-secondary-bg-hover text-tg-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors">
                            Запропонувати ціну
                        </button>
                    )}
                    <button 
                        onClick={() => onStartChat(currentAd)}
                        className="flex-1 bg-tg-secondary-bg-hover text-tg-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                        Написати продавцю
                    </button>
                </div>
            </div>
        )}

        <div className="my-6 border-t border-tg-border"></div>

        <h2 className="text-xl font-semibold mb-2">Опис</h2>
        <p className="text-tg-hint whitespace-pre-wrap">{currentAd.description}</p>
        
        {currentAd.tags && currentAd.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
                {currentAd.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 text-sm bg-tg-secondary-bg-hover rounded-full text-tg-hint">
                        {tag}
                    </span>
                ))}
            </div>
        )}

        <div className="my-6 border-t border-tg-border"></div>
        
        <div 
          className="flex items-center justify-between p-3 -m-3 rounded-lg hover:bg-tg-secondary-bg-hover transition-colors group"
          onClick={!isOwner ? () => onViewSellerProfile(currentAd.seller) : undefined}
          style={{ cursor: isOwner ? 'default' : 'pointer' }}
          role={isOwner ? undefined : 'button'}
          aria-label={isOwner ? undefined : 'Перейти в профіль продавця'}
        >
            <div className="flex items-center">
                <img className="w-12 h-12 rounded-full mr-4 object-cover" src={currentAd.seller.avatarUrl} alt={currentAd.seller.name} />
                <div>
                    <p className="font-bold group-hover:text-tg-link transition-colors">{currentAd.seller.name}</p>
                    <SellerRating seller={currentAd.seller} />
                </div>
            </div>
            {!isOwner && (
              <button 
                  onClick={(e) => { e.stopPropagation(); onToggleFollow(currentAd.seller.id); }}
                  className={`${isFollowing ? 'bg-tg-border text-tg-hint' : 'bg-tg-link text-white'} font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors`}
              >
                  {isFollowing ? 'Відстежується' : 'Стежити'}
              </button>
            )}
            {isOwner && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onEdit(currentAd)}
                  className="bg-tg-link text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Редагувати
                </button>
                <button
                  onClick={handleDeleteRequest}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Видалити
                </button>
              </div>
            )}
        </div>
        {isOwner && (
            <div className="mt-4 border-t border-tg-border pt-4">
                <div className="p-4 bg-tg-bg rounded-lg mb-4">
                    <p className="text-sm font-semibold mb-2 text-center text-tg-hint">Статистика оголошення</p>
                    <div className="flex justify-around text-center">
                        <div>
                            <p className="text-2xl font-bold">{currentAd.stats.views}</p>
                            <p className="text-xs text-tg-hint">Переглядів</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{currentAd.stats.favorites}</p>
                            <p className="text-xs text-tg-hint">В обраному</p>
                        </div>
                    </div>
                </div>
                {!currentAd.isBoosted && (
                     <button onClick={handleBoostAd} className="w-full bg-yellow-500/20 text-yellow-400 font-semibold py-2 px-3 rounded-lg mb-4 hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>
                        Просунути оголошення
                    </button>
                )}
                <p className="text-sm font-semibold mb-2 text-center text-tg-hint">Керування статусом</p>
                <div className="flex justify-center gap-2">
                    <button onClick={() => handleStatusChange('active')} disabled={currentAd.status === 'active'} className="flex-1 bg-green-600/20 text-green-400 font-semibold py-2 px-3 rounded-lg disabled:bg-green-600 disabled:text-white transition-colors">Активно</button>
                    <button onClick={() => handleStatusChange('reserved')} disabled={currentAd.status === 'reserved'} className="flex-1 bg-yellow-500/20 text-yellow-400 font-semibold py-2 px-3 rounded-lg disabled:bg-yellow-500 disabled:text-white transition-colors">В резерві</button>
                    <button onClick={() => handleStatusChange('sold')} disabled={currentAd.status === 'sold'} className="flex-1 bg-red-500/20 text-red-400 font-semibold py-2 px-3 rounded-lg disabled:bg-red-600 disabled:text-white transition-colors">Продано</button>
                    <button onClick={() => handleStatusChange('archived')} disabled={currentAd.status === 'archived'} className="flex-1 bg-gray-500/20 text-gray-400 font-semibold py-2 px-3 rounded-lg disabled:bg-gray-600 disabled:text-white transition-colors">Приховати</button>
                </div>
            </div>
        )}
        </div>
        <div className="px-6">
            {!isOwner && <PublicQnA ad={currentAd} currentUser={currentUser} />}
            {!isOwner && currentAd.status === 'active' && <AiAssistant ad={currentAd} />}
            {!isOwner && <SimilarAdsSection currentAd={currentAd} allAds={ads} viewAdDetails={viewAdDetails} favoriteAdIds={favoriteAdIds} onToggleFavorite={onToggleFavorite} />}
        </div>
    </div>
    <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
    />
     <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportSubmit}
      />
      {currentUser && (
        <MakeOfferModal
            isOpen={isOfferModalOpen}
            onClose={() => setIsOfferModalOpen(false)}
            ad={currentAd}
            currentUser={currentUser}
            showToast={showToast}
            onOfferMade={() => onStartChat(currentAd)}
        />
      )}
    </>
  );
};

export default AdDetailView;
