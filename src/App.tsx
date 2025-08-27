import React, { useState, useCallback, useEffect } from 'react';
import { type Ad, type Page, type AuthUser } from './types';
// FIX: Added getAdById to imports.
import { getAds, getAdById } from './apiClient';
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

  // FIX: Data fetching is no longer dependent on the user being logged in.
  const refreshData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setIsLoadingData(true);
      setError(null);

      const response = await getAds();
      setAds(response.data);

    } catch (err: any) {
      setError('Не вдалося завантажити дані. Спробуйте оновити сторінку.');
      console.error(err);
    } finally {
      if (showLoading) setIsLoadingData(false);
    }
  }, []);
  
  // Effect for initial data load and deeplinking
  useEffect(() => {
    const handleInitialLoad = async () => {
        setIsLoadingData(true);
        // The type for window.Telegram is not available by default, so we use 'any'
        const tg = (window as any).Telegram?.WebApp;
        const startParam = tg?.initDataUnsafe?.start_param;

        if (startParam && user) { // Deeplinking only works if user is authenticated via TG
            try {
                const response = await getAdById(startParam);
                setSelectedAd(response.data);
                setCurrentPage('detail');
                await refreshData(false); // Also load other ads in the background
            } catch (err) {
                console.error("Failed to load deeplinked ad:", err);
                setError(`Не вдалося знайти оголошення (ID: ${startParam}).`);
                await refreshData(true); // Load main list if deeplink fails
            }
        } else {
            // No deeplink, just load all ads
            await refreshData(true);
        }
        setIsLoadingData(false);
    };

    // We wait for auth to finish before trying to load data.
    if (!isAuthLoading) {
        handleInitialLoad();
    }
  }, [isAuthLoading, user, refreshData]);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  // FIX: Navigation to protected routes now checks for auth.
  const navigateTo = (page: Page) => {
    const protectedPages: Page[] = ['create', 'profile', 'admin', 'favorites', 'chats'];
    if (protectedPages.includes(page) && !user) {
        setCurrentPage('auth');
    } else {
        setCurrentPage(page);
    }
  };
  
  const handleAuthSuccess = () => {
    navigateTo('home');
  };

  const handleCreateAd = (newAd: Ad) => {
    setAds(prevAds => [newAd, ...prevAds]);
    navigateTo('home');
    showToast('Оголошення опубліковано!');
  };

  const viewAdDetails = useCallback((ad: Ad) => {
    setSelectedAd(ad);
    navigateTo('detail');
  }, [navigateTo]);

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
    if (isAuthLoading || (isLoadingData && !selectedAd)) {
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
        return selectedAd ? <AdDetailView ad={selectedAd} currentUser={user} navigateTo={navigateTo} /> : <p>Оголошення не знайдено. Повернення на головну...</p>;
      case 'profile':
         // FIX: Ensure user exists before rendering protected component.
        return user ? <ProfileView ads={ads} viewAdDetails={viewAdDetails} navigateTo={navigateTo} currentUser={user} /> : null;
      case 'admin':
        return user?.role === 'ADMIN' ? <AdminPage showToast={showToast} /> : <p>Доступ заборонено.</p>;
      case 'home':
      default:
        return <HomeView ads={ads} navigateTo={navigateTo} viewAdDetails={viewAdDetails} favoriteAdIds={new Set()} onToggleFavorite={() => {}} showToast={showToast} />;
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