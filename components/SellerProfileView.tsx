import React, { useState, useEffect, useMemo } from 'react';
import { type Ad, type Review, type TelegramUser } from '../types';
import AdCard from './AdCard';
import { getReviewsForSeller, addReview } from '../backend/api';
import Spinner from './Spinner';
import LeaveReviewModal from './LeaveReviewModal';

interface SellerProfileViewProps {
  seller: Ad['seller'];
  ads: Ad[];
  viewAdDetails: (ad: Ad) => void;
  favoriteAdIds: Set<string>;
  onToggleFavorite: (adId: string) => void;
  currentUser: TelegramUser;
  showToast: (message: string) => void;
  followingSellerIds: Set<number>;
  onToggleFollow: (sellerId: number) => void;
}

const SellerRating: React.FC<{ rating: number, reviewsCount: number }> = ({ rating, reviewsCount }) => (
    <div className="flex items-center gap-1 text-sm text-tg-hint mt-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className="font-bold text-tg-text">{rating.toFixed(1)}</span>
        <span>({reviewsCount} {reviewsCount === 1 ? 'відгук' : 'відгуків'})</span>
    </div>
);

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex">
        {[1, 2, 3, 4, 5].map(star => (
            <svg key={star} xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);


const SellerProfileView: React.FC<SellerProfileViewProps> = ({ seller, ads, viewAdDetails, favoriteAdIds, onToggleFavorite, currentUser, showToast, followingSellerIds, onToggleFollow }) => {
  const [activeTab, setActiveTab] = useState<'ads' | 'reviews'>('ads');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentSeller, setCurrentSeller] = useState(seller);
  
  const isFollowing = followingSellerIds.has(currentSeller.id);

  useEffect(() => {
    setIsLoadingReviews(true);
    getReviewsForSeller(currentSeller.id)
        .then(setReviews)
        .finally(() => setIsLoadingReviews(false));
  }, [currentSeller.id]);
  
  const handleReviewSubmit = async (data: { rating: number; text: string }) => {
    try {
        const { newReview, updatedSeller } = await addReview({
            sellerId: currentSeller.id,
            ...data
        }, currentUser);

        // Optimistically update UI
        setReviews(prev => [newReview, ...prev]);
        setCurrentSeller(updatedSeller);
        
        setIsReviewModalOpen(false);
        showToast("Дякуємо за ваш відгук!");
    } catch (error) {
        console.error("Failed to submit review", error);
        showToast("Не вдалося надіслати відгук.");
    }
  };

  const sellerAds = useMemo(() => {
    return ads.filter(ad => ad.seller.id === currentSeller.id && ad.status !== 'archived');
  }, [ads, currentSeller.id]);
  
  const isOwnProfile = currentUser.id === currentSeller.id;

  return (
    <>
      <div>
        <div className="flex flex-col items-center mb-6">
          <img src={currentSeller.avatarUrl} alt="Seller Avatar" className="w-24 h-24 rounded-full mb-4 object-cover border-2 border-tg-border" />
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{currentSeller.name}</h2>
            {currentSeller.isVerified && (
                <div title="Перевірений продавець">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-tg-link" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
          </div>
          <SellerRating rating={currentSeller.rating} reviewsCount={currentSeller.reviewsCount} />
          {!isOwnProfile && (
              <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={() => onToggleFollow(currentSeller.id)}
                    className={`${isFollowing ? 'bg-tg-border text-tg-hint' : 'bg-tg-link text-white'} font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors`}
                  >
                      {isFollowing ? 'Відстежується' : 'Стежити'}
                  </button>
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="bg-tg-link/20 text-tg-link font-semibold py-2 px-4 rounded-lg hover:bg-tg-link/30 transition-colors flex items-center gap-2"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <span>Залишити відгук</span>
                  </button>
              </div>
          )}
        </div>

        <div className="flex justify-center border-b border-tg-border mb-6">
          <button onClick={() => setActiveTab('ads')} className={`px-6 py-3 font-semibold ${activeTab === 'ads' ? 'text-tg-link border-b-2 border-tg-link' : 'text-tg-hint'}`}>
              Оголошення ({sellerAds.length})
          </button>
          <button onClick={() => setActiveTab('reviews')} className={`px-6 py-3 font-semibold ${activeTab === 'reviews' ? 'text-tg-link border-b-2 border-tg-link' : 'text-tg-hint'}`}>
              Відгуки ({currentSeller.reviewsCount})
          </button>
        </div>

        {activeTab === 'ads' && (
          <>
              {sellerAds.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {sellerAds.map((ad) => (
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
                  <div className="text-center text-tg-hint mt-12">
                  <p>У цього продавця поки немає активних оголошень.</p>
                  </div>
              )}
          </>
        )}

        {activeTab === 'reviews' && (
            <>
            {isLoadingReviews ? (
                <div className="flex justify-center mt-4"><Spinner /></div>
            ) : reviews.length === 0 ? (
                 <p className="text-center text-tg-hint mt-4">Відгуків поки немає.</p>
            ) : (
                <div className="space-y-4 mt-6">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-tg-bg p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                    <img src={review.authorAvatarUrl} alt={review.authorName} className="w-8 h-8 rounded-full mr-3" />
                                    <span className="font-semibold">{review.authorName}</span>
                                </div>
                                <StarRating rating={review.rating} />
                            </div>
                            <p className="text-tg-hint">{review.text}</p>
                        </div>
                    ))}
                </div>
            )}
            </>
        )}
      </div>
      <LeaveReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
        sellerName={currentSeller.name}
      />
    </>
  );
};

export default SellerProfileView;
