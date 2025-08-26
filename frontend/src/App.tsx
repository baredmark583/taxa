import React, { useState, useCallback, useEffect } from 'react';
import { type Ad, type Page } from './types';
import { getAds } from './apiClient';
import { useAuth } from './AuthContext';
import AuthPage from './pages/AuthPage';
import HomeView from './components/HomeView';
import CreateAdView from './components/CreateAdView';
import ProfileView from './components/ProfileView';
import Header from './components/Header';
import SkeletonAdCard from './components/SkeletonAdCard';
import Toast from './components/Toast';
import Spinner from './components/Spinner';

// Note: Many components are temporarily disabled as they need to be refactored
// to work with the new backend API and user system. This is an incremental process.

const App: React.FC = () => {
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setIsLoadingData(true);
      setError(null);
      if (!user) return; // Don't fetch if no user

      const response = await getAds();
      setAds(response.data);

    } catch (err: any) {
      setError('Не вдалося завантажити дані. Спробуйте оновити сторінку.');
      console.error(err);
      if (err.response?.status === 401) { // Unauthorized
          logout();
      }
    } finally {
      if (showLoading) setIsLoadingData(false);
    }
  }, [user, logout]);

  useEffect(() => {
    if (user) {
      refreshData(true);
    }
  }, [user, refreshData]);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  const handleCreateAd = (newAd: Ad) => {
    setAds(prevAds => [newAd, ...prevAds]);
    navigateTo('home');
    showToast('Оголошення опубліковано!');
  };

  const viewAdDetails = useCallback((ad: Ad) => {
    // TODO: Implement view count increment on backend
    setSelectedAd(ad);
    navigateTo('detail');
  }, []);

  const goBack = () => {
    if (['detail', 'create', 'profile', 'favorites', 'chats'].includes(currentPage)) {
      navigateTo('home');
      setSelectedAd(null);
    }
  };

  if (isAuthLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>;
  }
  
  if (!user) {
      return <AuthPage />;
  }

  const renderContent = () => {
    if (isLoadingData) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonAdCard key={index} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-400 mt-10">
          <p>{error}</p>
          <button onClick={() => refreshData(true)} className="mt-4 px-4 py-2 bg-tg-button rounded-lg">Спробувати ще раз</button>
        </div>
      );
    }

    switch (currentPage) {
      case 'create':
        return <CreateAdView onCreateAd={handleCreateAd} onUpdateAd={() => {}} adToEdit={null} showToast={showToast} currentUser={user} />;
      case 'detail':
        // TODO: AdDetailView needs significant refactoring for new API
        return selectedAd ? <div className="text-white">Ad Detail for {selectedAd.title} - Refactor needed</div> : <HomeView ads={ads} navigateTo={navigateTo} viewAdDetails={viewAdDetails} favoriteAdIds={new Set()} onToggleFavorite={() => {}} showToast={showToast} activeSearch={null} onSearchApplied={() => {}} />;
      case 'profile':
        return <ProfileView ads={ads} viewAdDetails={viewAdDetails} navigateTo={navigateTo} currentUser={user} />;
      case 'home':
      default:
        // TODO: Favorites needs to be implemented on backend
        return <HomeView ads={ads} navigateTo={navigateTo} viewAdDetails={viewAdDetails} favoriteAdIds={new Set()} onToggleFavorite={() => {}} showToast={showToast} activeSearch={null} onSearchApplied={() => {}} />;
    }
  };

  return (
    <div className="min-h-screen bg-tg-bg">
      <Header currentPage={currentPage} goBack={goBack} navigateTo={navigateTo} unreadMessagesCount={0} />
      <main className="p-4">
        {renderContent()}
      </main>
      <button onClick={logout} className="fixed bottom-4 left-4 bg-red-600/50 text-white p-2 rounded-lg text-xs hover:bg-red-600/80">Вийти</button>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
};

export default App;
