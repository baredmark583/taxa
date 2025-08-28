import React, { useState, useCallback, useEffect } from 'react';
import { type Ad, type Page, type AuthUser } from './types';
// FIX: Added getAdById to imports.
import { getAds, getAdById, getFavoriteAdIds, addFavorite, removeFavorite, updateAdStatus } from './apiClient';
import { useAuth } from './AuthContext';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import HomeView from './components/HomeView';
import CreateAdView from './components/CreateAdView';
import ProfileView from './components/ProfileView';
import Header from './components/Header';
import SkeletonAdCard from './components/SkeletonAdCard';
import Toast from './components/Toast';
import Spinner from './components/Spinner';
import AdDetailView from './components/AdDetailView';
import FavoritesPage from './pages/FavoritesPage';

// Note: Many components are temporarily disabled as they need to be refactored
// to work with the new backend API and user system. This is an incremental process.

const App: React.FC = () => {
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  
  const [ads, setAds] = useState<Ad[]>([]);
  // FIX: Default page is 'home' to allow public browsing.
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [favoriteAdIds, setFavoriteAdIds] = useState<Set<string>>(new Set());

  const showToast = (message: string) => {
    setToastMessage(message);
  };
  
  const refreshAds = useCallback(async () => {
    // This function will now be called by HomeView, not here.
    // Keeping it for potential global refresh.
    try {
      const response = await getAds();
      setAds(response.data);
    } catch (err) {
      setError('Не вдалося завантажити оголошення.');
    }
  }, []);

  // Fetch initial ads and favorites
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingData(true);
      try {
        const adsResponse = await getAds();
        setAds(adsResponse.data);

        if (user) {
          const favsResponse = await getFavoriteAdIds();
          setFavoriteAdIds(new Set(favsResponse.data));
        }
      } catch (err) {
        setError('Не вдалося завантажити дані. Спробуйте оновити сторінку.');
        console.error(err);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    if (!isAuthLoading) {
      loadInitialData();
    }
  }, [user, isAuthLoading]);
  
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
            showToast('Видалено з обраного');
        } else {
            await addFavorite(adId);
            newFavorites.add(adId);
            showToast('Додано в обране');
        }
        setFavoriteAdIds(newFavorites);
    } catch (error) {
        showToast('Не вдалося оновити обране.');
        console.error("Favorite toggle failed:", error);
    }
  }, [user, favoriteAdIds]);

  const handleUpdateAdStatus = useCallback(async (adId: string, status: Ad['status']) => {
    try {
        const { data: updatedAd } = await updateAdStatus(adId, status);
        setAds(prevAds => prevAds.map(ad => ad.id === adId ? updatedAd : ad));
        showToast(`Статус оновлено на "${status}"`);
    } catch (error) {
        showToast('Не вдалося оновити статус.');
        console.error("Status update failed:", error);
    }
  }, []);

  // FIX: Navigation to protected routes now checks for auth.
  const navigateTo = (page: Page) => {
    const protectedPages: Page[] = ['create', 'profile', 'admin', 'favorites', 'chats'];
    if (protectedPages.includes(page) && !user) {
        setCurrentPage('auth');
    } else {
        setCurrentPage(page);
    }
  };
  
  const handleAuthSuccess = async () => {
    navigateTo('home');
    // We fetch favorites via the useEffect that listens to `user`
  };

  const handleCreateAd = (newAd: Ad) => {
    setAds(prevAds => [newAd, ...prevAds]);
    navigateTo('home');
    showToast('Оголошення опубліковано!');
  };

  const viewAdDetails = useCallback((ad: Ad) => {
    setSelectedAd(ad);
    navigateTo('detail');
  }, []);

  const goBack = () => {
    // If we're on the auth page, go back to home.
    if (currentPage === 'auth') {
      navigateTo('home');
      return;
    }
    if (['detail', 'create', 'profile', 'favorites', 'chats', 'admin'].includes(currentPage)) {
      navigateTo('home');
      setSelectedAd(null);
    }
  };
  
  // FIX: Rewrote main render logic to always show a shell, and gate content instead of the whole app.
  const renderContent = () => {
    if (isAuthLoading || isLoadingData) {
        return <div className="flex items-center justify-center min-h-[calc(100vh-100px)]"><Spinner size="lg" /></div>;
    }

    if (error && currentPage !== 'auth') {
      return (
        <div className="text-center text-red-400 mt-10">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-tg-button rounded-lg">Оновити сторінку</button>
        </div>
      );
    }

    switch (currentPage) {
      case 'auth':
          return <AuthPage onAuthSuccess={handleAuthSuccess} />;
      case 'create':
        // FIX: Ensure user exists before rendering protected component.
        return user ? <CreateAdView onCreateAd={handleCreateAd} onUpdateAd={() => {}} adToEdit={null} showToast={showToast} currentUser={user} /> : null;
      case 'detail':
        return selectedAd ? <AdDetailView ad={selectedAd} currentUser={user} navigateTo={navigateTo} showToast={showToast} isFavorite={favoriteAdIds.has(selectedAd.id)} onToggleFavorite={handleToggleFavorite} /> : <p>Оголошення не знайдено. Повернення на головну...</p>;
      case 'profile':
         // FIX: Ensure user exists before rendering protected component.
        return user ? <ProfileView ads={ads} viewAdDetails={viewAdDetails} navigateTo={navigateTo} currentUser={user} onUpdateAdStatus={handleUpdateAdStatus}/> : null;
      case 'favorites':
        return user ? <FavoritesPage viewAdDetails={viewAdDetails} favoriteAdIds={favoriteAdIds} onToggleFavorite={handleToggleFavorite} /> : null;
      case 'admin':
        return user?.role === 'ADMIN' ? <AdminPage showToast={showToast} /> : <p>Доступ заборонено.</p>;
      case 'home':
      default:
        return <HomeView initialAds={ads} navigateTo={navigateTo} viewAdDetails={viewAdDetails} favoriteAdIds={favoriteAdIds} onToggleFavorite={handleToggleFavorite} showToast={showToast} />;
    }
  };

  return (
    <div className="min-h-screen bg-tg-bg">
      <Header currentPage={currentPage} goBack={goBack} navigateTo={navigateTo} unreadMessagesCount={0} user={user} />
      <main className="p-4">
        {renderContent()}
      </main>
      {user && <button onClick={logout} className="fixed bottom-4 left-4 bg-red-600/50 text-white p-2 rounded-lg text-xs hover:bg-red-600/80 z-30">Вийти</button>}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
};

export default App;