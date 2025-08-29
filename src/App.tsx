import React, { useState, useCallback, useEffect } from 'react';
import { type Ad, type Page, type AuthUser, ChatContext } from './types';
import { getAds, getAdById, getFavoriteAdIds, addFavorite, removeFavorite, updateAdStatus } from './apiClient';
import { useAuth } from './AuthContext';
import AuthPage from './pages/AuthPage';
import HomeView from './components/HomeView';
import CreateAdView from './components/CreateAdView';
import ProfileView from './components/ProfileView';
import Header from './components/Header';
import Toast from './components/Toast';
import Spinner from './components/Spinner';
import AdDetailView from './components/AdDetailView';
import FavoritesPage from './pages/FavoritesPage';
import SellerProfilePage from './pages/SellerProfilePage';
import ChatListPage from './pages/ChatListPage';
import ChatThreadPage from './pages/ChatThreadPage';
import { useI18n } from './I18nContext';
import { useAppContext } from './AppContext';
import WebNavbar from './components/web/WebNavbar';
import Footer from './components/web/Footer';
import BottomNav from './components/BottomNav';
import { Icon } from '@iconify/react';


const App: React.FC = () => {
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const { t } = useI18n();
  const { isWeb } = useAppContext();
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [adToEdit, setAdToEdit] = useState<Ad | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [favoriteAdIds, setFavoriteAdIds] = useState<Set<string>>(new Set());

  const showToast = (message: string) => {
    setToastMessage(message);
  };
  
  const refreshAds = useCallback(async () => {
    try {
      const response = await getAds();
      setAds(response.data);
    } catch (err) {
      setError(t('errors.failedToLoadAds'));
    }
  }, [t]);

  useEffect(() => {
    const loadInitialData = async () => {
        setIsLoadingData(true);
        try {
            const tg = (window as any).Telegram?.WebApp;
            const startParam = tg?.initDataUnsafe?.start_param;
            const urlParams = new URLSearchParams(window.location.search);
            const adIdFromUrl = startParam || urlParams.get('adId');

            if (adIdFromUrl) {
                const adResponse = await getAdById(adIdFromUrl);
                setSelectedAd(adResponse.data);
                setCurrentPage('detail');
                getAds().then(res => setAds(res.data));
            } else {
                const adsResponse = await getAds();
                setAds(adsResponse.data);
            }

            if (user) {
                const favsResponse = await getFavoriteAdIds();
                setFavoriteAdIds(new Set(favsResponse.data));
            }
        } catch (err) {
            console.error("Error loading initial data:", err);
            try {
                const adsResponse = await getAds();
                setAds(adsResponse.data);
                setCurrentPage('home');
            } catch (fallbackErr) {
                setError(t('errors.failedToLoadData'));
                console.error("Fallback ad load failed:", fallbackErr);
            }
        } finally {
            setIsLoadingData(false);
        }
    };
    
    if (!isAuthLoading) {
        loadInitialData();
    }
  }, [user, isAuthLoading, t]);
  
  const handleToggleFavorite = useCallback(async (adId: string) => {
    if (!user) {
        navigateTo('auth');
        return;
    }
    const newFavorites = new Set(favoriteAdIds);
    try {
        if (newFavorites.has(adId)) {
            await removeFavorite(adId);
            newFavorites.delete(adId);
            showToast(t('toast.removedFromFavorites'));
        } else {
            await addFavorite(adId);
            newFavorites.add(adId);
            showToast(t('toast.addedToFavorites'));
        }
        setFavoriteAdIds(newFavorites);
    } catch (error) {
        showToast(t('toast.failedToUpdateFavorites'));
        console.error("Favorite toggle failed:", error);
    }
  }, [user, favoriteAdIds, t]);

  const handleUpdateAdStatus = useCallback(async (adId: string, status: Ad['status']) => {
    try {
        const { data: updatedAd } = await updateAdStatus(adId, status);
        setAds(prevAds => prevAds.map(ad => ad.id === adId ? updatedAd : ad));
        showToast(`${t('toast.statusUpdated')} "${t(`adStatus.${status}`)}"`);
    } catch (error) {
        showToast(t('toast.failedToUpdateStatus'));
        console.error("Status update failed:", error);
    }
  }, [t]);

  const navigateTo = (page: Page) => {
    const protectedPages: Page[] = ['create', 'profile', 'favorites', 'chats', 'chatThread'];
    if (protectedPages.includes(page) && !user) {
        setCurrentPage('auth');
    } else {
        setCurrentPage(page);
    }
  };
  
  const handleAuthSuccess = async () => {
    navigateTo('home');
  };

  const handleCreateAd = (newAd: Ad) => {
    setAds(prevAds => [newAd, ...prevAds]);
    navigateTo('home');
    showToast(t('toast.adPublished'));
  };

  const handleEditAd = (ad: Ad) => {
    setAdToEdit(ad);
    navigateTo('create');
  };

  const handleUpdateAd = (updatedAd: Ad) => {
    setAds(prevAds => prevAds.map(ad => ad.id === updatedAd.id ? updatedAd : ad));
    setSelectedAd(updatedAd);
    setAdToEdit(null);
    navigateTo('detail');
    showToast(t('toast.adUpdated'));
  };

  const viewAdDetails = useCallback((ad: Ad) => {
    setSelectedAd(ad);
    navigateTo('detail');
  }, []);
  
  const viewSellerProfile = (sellerId: string) => {
    setSelectedSellerId(sellerId);
    navigateTo('sellerProfile');
  };

  const startChat = (ad: Ad) => {
      if (!user) {
          navigateTo('auth');
          return;
      }
      setChatContext({
          adId: ad.id,
          adTitle: ad.title,
          adImageUrl: ad.imageUrls[0],
          participantId: ad.seller.id,
          participantName: ad.seller.name
      });
      navigateTo('chatThread');
  };

  const viewChat = (context: ChatContext) => {
    setChatContext(context);
    navigateTo('chatThread');
  }

  const goBack = () => {
    if (currentPage === 'auth') {
      navigateTo('home');
      return;
    }
    if (['detail', 'create', 'profile', 'favorites', 'chats', 'sellerProfile'].includes(currentPage)) {
      navigateTo('home');
      setSelectedAd(null);
      setSelectedSellerId(null);
      setAdToEdit(null);
    }
    if (currentPage === 'chatThread') {
        navigateTo('chats');
        setChatContext(null);
    }
  };
  
  const renderContent = () => {
    if (isAuthLoading || isLoadingData) {
        return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Spinner size="lg" /></div>;
    }

    if (error && currentPage !== 'auth') {
      return (
        <div className="text-center text-red-400 mt-10">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-tg-button rounded-lg">{t('common.reloadPage')}</button>
        </div>
      );
    }

    switch (currentPage) {
      case 'auth':
          return <AuthPage onAuthSuccess={handleAuthSuccess} />;
      case 'create':
        return user ? <CreateAdView onCreateAd={handleCreateAd} onUpdateAd={handleUpdateAd} adToEdit={adToEdit} showToast={showToast} currentUser={user} /> : null;
      case 'detail':
        return selectedAd ? <AdDetailView ad={selectedAd} currentUser={user} showToast={showToast} isFavorite={favoriteAdIds.has(selectedAd.id)} onToggleFavorite={handleToggleFavorite} onViewSellerProfile={viewSellerProfile} onStartChat={startChat} onEditAd={handleEditAd} /> : <p>{t('errors.adNotFound')}</p>;
      case 'profile':
        return user ? <ProfileView ads={ads} viewAdDetails={viewAdDetails} navigateTo={navigateTo} currentUser={user} onUpdateAdStatus={handleUpdateAdStatus}/> : null;
      case 'favorites':
        return user ? <FavoritesPage viewAdDetails={viewAdDetails} favoriteAdIds={favoriteAdIds} onToggleFavorite={handleToggleFavorite} /> : null;
      case 'sellerProfile':
        return selectedSellerId ? <SellerProfilePage sellerId={selectedSellerId} viewAdDetails={viewAdDetails} favoriteAdIds={favoriteAdIds} onToggleFavorite={handleToggleFavorite} /> : <p>{t('errors.sellerNotFound')}</p>;
      case 'chats':
        return user ? <ChatListPage onViewChat={viewChat} /> : null;
      case 'chatThread':
        return user && chatContext ? <ChatThreadPage context={chatContext} currentUser={user} /> : <p>{t('errors.chatNotFound')}</p>;
      case 'home':
      default:
        return <HomeView initialAds={ads} navigateTo={navigateTo} viewAdDetails={viewAdDetails} favoriteAdIds={favoriteAdIds} onToggleFavorite={handleToggleFavorite} showToast={showToast} />;
    }
  };
  
  if (isWeb) {
    return (
        <div className="min-h-screen bg-tg-bg text-tg-text flex flex-col">
            <WebNavbar navigateTo={navigateTo} user={user} logout={logout} />
            <main className="flex-grow container mx-auto px-4 lg:px-8 py-8">
                {renderContent()}
            </main>
            <Footer />
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
        </div>
    );
  }
  
  // Telegram App Layout
  return (
    <div className="min-h-screen bg-tg-bg">
      <Header currentPage={currentPage} goBack={goBack} />
      <main className="p-4 pb-24">
        {renderContent()}
      </main>
      <BottomNav currentPage={currentPage} navigateTo={navigateTo} unreadMessagesCount={0} />
      {currentPage === 'home' && (
           <button 
                onClick={() => navigateTo('create')}
                className="fixed bottom-20 right-6 bg-tg-button text-tg-button-text p-4 rounded-full shadow-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-tg-bg focus:ring-tg-link"
                aria-label={t('home.createAdButtonLabel')}
            >
                <Icon icon="lucide:plus" className="h-8 w-8" />
            </button>
      )}
      {user && <button onClick={logout} className="fixed bottom-20 left-4 bg-red-600/50 text-white p-2 rounded-lg text-xs hover:bg-red-600/80 z-30">{t('common.logout')}</button>}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
};

export default App;
