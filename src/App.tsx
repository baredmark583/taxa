import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { type Ad, type Page } from './types';
import { getFavoriteAdIds, addFavorite, removeFavorite, updateAdStatus } from './apiClient';
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
import NotFoundPage from './pages/NotFoundPage';


// Layout for Telegram Mini App view
const MobileLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useI18n();
    const { user, logout } = useAuth();
    
    // Determine current page from path for header/nav highlighting
    const getCurrentPage = (): Page => {
        const path = location.pathname;
        if (path.startsWith('/ad/')) return 'detail';
        if (path.startsWith('/create')) return 'create';
        if (path.startsWith('/profile')) return 'profile';
        if (path.startsWith('/favorites')) return 'favorites';
        if (path.startsWith('/chats')) return 'chats';
        if (path.startsWith('/seller')) return 'sellerProfile';
        if (path.startsWith('/auth')) return 'auth';
        return 'home';
    };

    const currentPage = getCurrentPage();

    return (
        <div className="min-h-screen bg-tg-bg">
            <Header currentPage={currentPage} goBack={() => navigate(-1)} />
            <main className="p-4 pb-24">
                <Outlet />
            </main>
            <BottomNav currentPage={currentPage} navigateTo={(page) => navigate(page === 'home' ? '/' : `/${page}`)} unreadMessagesCount={0} />
             {currentPage === 'home' && (
                <button 
                    onClick={() => navigate('/create')}
                    className="fixed bottom-20 right-6 bg-tg-button text-tg-button-text p-4 rounded-full shadow-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-tg-bg focus:ring-tg-link"
                    aria-label={t('home.createAdButtonLabel')}
                >
                    <Icon icon="lucide:plus" className="h-8 w-8" />
                </button>
            )}
             {user && <button onClick={logout} className="fixed bottom-20 left-4 bg-red-600/50 text-white p-2 rounded-lg text-xs hover:bg-red-600/80 z-30">{t('common.logout')}</button>}
        </div>
    );
};

// Layout for Web view
const WebLayout: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    
    // A simplified navigateTo for web components that don't use React Router's Link
    const navigateTo = (page: Page) => navigate(page === 'home' ? '/' : `/${page}`);

    return (
        <div className="min-h-screen bg-tg-bg text-tg-text flex flex-col">
            <WebNavbar navigateTo={navigateTo} user={user} logout={logout} />
            <main className="flex-grow container mx-auto px-4 lg:px-8 py-8">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

// A simple protected route component
const ProtectedRoute: React.FC = () => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
         return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Spinner size="lg" /></div>;
    }

    if (!user) {
        // Redirect them to the /auth page, but save the current location they were
        // trying to go to. This allows us to send them back after login.
        return <AuthPage onAuthSuccess={() => window.location.replace(location.state?.from?.pathname || '/')} />;
    }

    return <Outlet />;
};


const App: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { t } = useI18n();
  const { isWeb } = useAppContext();
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [favoriteAdIds, setFavoriteAdIds] = useState<Set<string>>(new Set());

  const showToast = (message: string) => {
    setToastMessage(message);
  };
  
  useEffect(() => {
    const fetchFavorites = async () => {
        if (user) {
            try {
                const favsResponse = await getFavoriteAdIds();
                setFavoriteAdIds(new Set(favsResponse.data));
            } catch (err) {
                 console.error("Failed to load favorites:", err);
            }
        }
    };
    if (!isAuthLoading) {
        fetchFavorites();
    }
  }, [user, isAuthLoading]);
  
  const handleToggleFavorite = useCallback(async (adId: string) => {
    if (!user) {
        navigate('/auth');
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
  }, [user, favoriteAdIds, t, navigate]);

  const handleUpdateAdStatus = useCallback(async (adId: string, status: Ad['status']) => {
    try {
        await updateAdStatus(adId, status);
        showToast(`${t('toast.statusUpdated')} "${t(`adStatus.${status}`)}"`);
        // We don't update state here because the component that calls this (ProfileView) will refetch
    } catch (error) {
        showToast(t('toast.failedToUpdateStatus'));
        console.error("Status update failed:", error);
    }
  }, [t]);

  const handleCreateAd = (newAd: Ad) => {
    navigate(`/ad/${newAd.id}`);
    showToast(t('toast.adPublished'));
  };

  const handleUpdateAd = (updatedAd: Ad) => {
    navigate(`/ad/${updatedAd.id}`);
    showToast(t('toast.adUpdated'));
  };
  
  const Layout = isWeb ? WebLayout : MobileLayout;

  if (isAuthLoading) {
      return <div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>;
  }
  
  return (
    <>
      <Routes>
        <Route path="/auth" element={<AuthPage onAuthSuccess={() => navigate('/')} />} />
        <Route element={<Layout />}>
          <Route path="/" element={<HomeView favoriteAdIds={favoriteAdIds} onToggleFavorite={handleToggleFavorite} />} />
          <Route path="/ad/:adId" element={<AdDetailView showToast={showToast} isFavorite={favoriteAdIds} onToggleFavorite={handleToggleFavorite} />} />
          <Route path="/seller/:sellerId" element={<SellerProfilePage favoriteAdIds={favoriteAdIds} onToggleFavorite={handleToggleFavorite} />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
              <Route path="/create" element={<CreateAdView onCreateAd={handleCreateAd} onUpdateAd={handleUpdateAd} showToast={showToast} />} />
              <Route path="/edit/:adId" element={<CreateAdView onCreateAd={handleCreateAd} onUpdateAd={handleUpdateAd} showToast={showToast} />} />
              <Route path="/profile" element={<ProfileView onUpdateAdStatus={handleUpdateAdStatus}/>} />
              <Route path="/favorites" element={<FavoritesPage favoriteAdIds={favoriteAdIds} onToggleFavorite={handleToggleFavorite} />} />
              <Route path="/chats" element={<ChatListPage />} />
              <Route path="/chats/:adId/:participantId" element={<ChatThreadPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </>
  );
};

export default App;