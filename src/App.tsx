import React, { useState, useCallback, useEffect } from 'react';
import { type Ad, type Page, type TelegramUser, type ChatConversation, type SavedSearch } from './types';
import { getAds, updateAd, deleteAd, getFavoriteIds, addFavorite, removeFavorite, getUnreadMessagesCount, getTotalNewMatchesCount, incrementAdViewCount, getFollowingIds, followSeller, unfollowSeller } from './backend/api';
import HomeView from './components/HomeView';
import CreateAdView from './components/CreateAdView';
import AdDetailView from './components/AdDetailView';
import ProfileView from './components/ProfileView';
import FavoritesView from './components/FavoritesView';
import SellerProfileView from './components/SellerProfileView';
import ChatListView from './components/ChatListView';
import ChatThreadView from './components/ChatThreadView';
import SavedSearchesView from './components/SavedSearchesView';
import MapView from './components/MapView';
import FollowingView from './components/FollowingView';
import Header from './components/Header';
import SkeletonAdCard from './components/SkeletonAdCard';
import Toast from './components/Toast';
import { useTelegram } from './hooks/useTelegram';

const App: React.FC = () => {
  const { user, webApp } = useTelegram();
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Ad['seller'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteAdIds, setFavoriteAdIds] = useState<Set<string>>(new Set());
  const [followingSellerIds, setFollowingSellerIds] = useState<Set<number>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [activeSearch, setActiveSearch] = useState<SavedSearch | null>(null);
  const [newSavedSearchMatches, setNewSavedSearchMatches] = useState(0);

  
  useEffect(() => {
    webApp?.ready();
  }, [webApp]);


  const refreshData = useCallback(async (showLoading = false) => {
      try {
        if(showLoading) setIsLoading(true);
        setError(null);
        if (!user) return;

        const [fetchedAds, fetchedFavoriteIds, unreadCount, newMatches, fetchedFollowingIds] = await Promise.all([
          getAds(),
          getFavoriteIds(),
          getUnreadMessagesCount(user.id),
          getTotalNewMatchesCount(),
          getFollowingIds(user.id)
        ]);
        setAds(fetchedAds);
        setFavoriteAdIds(new Set(fetchedFavoriteIds));
        setUnreadMessagesCount(unreadCount);
        setNewSavedSearchMatches(newMatches);
        setFollowingSellerIds(new Set(fetchedFollowingIds));

      } catch (err) {
        setError('Не вдалося завантажити дані. Спробуйте оновити сторінку.');
        console.error(err);
      } finally {
        if(showLoading) setIsLoading(false);
      }
  }, [user]);

  useEffect(() => {
    refreshData(true);
  }, [refreshData]);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };
  
  const handleToggleFavorite = useCallback(async (adId: string) => {
    const isFavorite = favoriteAdIds.has(adId);
    if (isFavorite) {
      await removeFavorite(adId);
      showToast('Видалено з обраного');
    } else {
      await addFavorite(adId);
      showToast('Додано в обране');
    }
    const [updatedIds, updatedAds] = await Promise.all([getFavoriteIds(), getAds()]);
    setFavoriteAdIds(new Set(updatedIds));
    setAds(updatedAds); // Refresh ads to get updated favorite counts
  }, [favoriteAdIds]);
  
  const handleToggleFollow = useCallback(async (sellerId: number) => {
      if (!user) return;
      const isFollowing = followingSellerIds.has(sellerId);
      if (isFollowing) {
        await unfollowSeller(user.id, sellerId);
        showToast('Ви більше не стежите за продавцем');
      } else {
        await followSeller(user.id, sellerId);
        showToast('Ви почали стежити за продавцем');
      }
      const updatedIds = await getFollowingIds(user.id);
      setFollowingSellerIds(new Set(updatedIds));
  }, [followingSellerIds, user]);


  const handleCreateAd = (newAd: Ad) => {
    setAds(prevAds => [newAd, ...prevAds]);
    navigateTo('home');
    showToast('Оголошення опубліковано!');
  };
  
  const handleUpdateAd = (updatedAd: Ad) => {
    updateAd(updatedAd).then(savedAd => {
      setAds(prevAds => prevAds.map(ad => ad.id === savedAd.id ? savedAd : ad));
      setSelectedAd(savedAd);
      navigateTo('detail');
      showToast('Зміни збережено');
    }).catch(err => {
      setError('Не вдалося оновити оголошення.');
      console.error(err);
    });
  };

  const handleDeleteAd = (adId: string) => {
    deleteAd(adId).then(() => {
      setAds(prevAds => prevAds.filter(ad => ad.id !== adId));
      navigateTo('home');
      showToast('Оголошення видалено');
    }).catch(err => {
      setError('Не вдалося видалити оголошення.');
      console.error(err);
    });
  };

  const handleRequestEdit = (ad: Ad) => {
    setSelectedAd(ad);
    navigateTo('create');
  };

  const viewAdDetails = useCallback((ad: Ad) => {
    incrementAdViewCount(ad.id);
    const updatedAd = { ...ad, stats: { ...ad.stats, views: ad.stats.views + 1 } };
    setAds(prevAds => prevAds.map(a => a.id === ad.id ? updatedAd : a));
    setSelectedAd(updatedAd);
    navigateTo('detail');
  }, []);

  const viewSellerProfile = useCallback((seller: Ad['seller']) => {
    setSelectedSeller(seller);
    navigateTo('sellerProfile');
  }, []);

  const openChatWithSeller = (ad: Ad) => {
      if (!user) return;
      // Create a "mock" conversation object to start the chat
      const conversation: ChatConversation = {
        id: `${ad.id}_${Math.min(user.id, ad.seller.id)}_${Math.max(user.id, ad.seller.id)}`,
        adId: ad.id,
        participant: { id: ad.seller.id, name: ad.seller.name, avatarUrl: ad.seller.avatarUrl },
        lastMessage: {
            id: '',
            senderId: 0,
            receiverId: 0,
            text: 'Почніть діалог',
            timestamp: new Date().toISOString(),
            isRead: true,
        },
        unreadCount: 0,
      };
      setSelectedConversation(conversation);
      navigateTo('chatThread');
  };
  
  const openChatFromList = (conversation: ChatConversation) => {
      setSelectedConversation(conversation);
      navigateTo('chatThread');
  };
  
  const handleApplySearch = (search: SavedSearch) => {
    setActiveSearch(search);
    navigateTo('home');
  };

  const handleSearchApplied = () => {
    setActiveSearch(null);
  };


  const goBack = () => {
    if (currentPage === 'chatThread') {
        navigateTo('chats');
        setSelectedConversation(null);
    } else if (currentPage === 'sellerProfile') {
      setCurrentPage('detail');
      setSelectedSeller(null);
    } else if (['detail', 'create', 'profile', 'favorites', 'chats', 'savedSearches', 'map', 'following'].includes(currentPage)) {
      navigateTo('home');
      setSelectedAd(null);
      setSelectedSeller(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
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
        </div>
      );
    }

    switch (currentPage) {
      case 'create':
        return <CreateAdView onCreateAd={handleCreateAd} onUpdateAd={handleUpdateAd} adToEdit={selectedAd} currentUser={user} showToast={showToast} />;
      case 'detail':
        return selectedAd && user ? <AdDetailView ad={selectedAd} ads={ads} onEdit={handleRequestEdit} onDelete={handleDeleteAd} favoriteAdIds={favoriteAdIds} onToggleFavorite={handleToggleFavorite} currentUser={user} webApp={webApp} onViewSellerProfile={viewSellerProfile} viewAdDetails={viewAdDetails} onStartChat={openChatWithSeller} showToast={showToast} refreshAds={() => refreshData()} followingSellerIds={followingSellerIds} onToggleFollow={handleToggleFollow} /> : <HomeView ads={ads} navigateTo={navigateTo} viewAdDetails={viewAdDetails} favoriteAdIds={favoriteAdIds} onToggleFavorite={handleToggleFavorite} showToast={showToast} activeSearch={activeSearch} onSearchApplied={handleSearchApplied} />;
      case 'profile':
        return user ? <ProfileView ads={ads} viewAdDetails={viewAdDetails} navigateTo={navigateTo} favoriteAdIds={favoriteAdIds} onToggleFavorite={handleToggleFavorite} currentUser={user} newSavedSearchMatches={newSavedSearchMatches} /> : null;
      case 'favorites':
        return <FavoritesView ads={ads} viewAdDetails={viewAdDetails} navigateTo={navigateTo} favoriteAdIds={favoriteAdIds} onToggleFavorite={handleToggleFavorite}/>;
      case 'sellerProfile':
        return selectedSeller && user ? <SellerProfileView seller={selectedSeller} ads={ads} viewAdDetails={viewAdDetails} favoriteAdIds={favoriteAdIds} onToggleFavorite={handleToggleFavorite} currentUser={user} showToast={showToast} followingSellerIds={followingSellerIds} onToggleFollow={handleToggleFollow}/> : <HomeView ads={ads} navigateTo={navigateTo} viewAdDetails={viewAdDetails} favoriteAdIds={favoriteAdIds} onToggleFavorite={handleToggleFavorite} showToast={showToast} activeSearch={activeSearch} onSearchApplied={handleSearchApplied} />;
      case 'chats':
          return user ? <ChatListView currentUser={user} onConversationSelect={openChatFromList} /> : null;
      case 'chatThread':
          return selectedConversation && user ? <ChatThreadView conversation={selectedConversation} currentUser={user} ads={ads} refreshAds={() => refreshData()} /> : <ChatListView currentUser={user} onConversationSelect={openChatFromList} />;
      case 'savedSearches':
          return <SavedSearchesView onApplySearch={handleApplySearch} />
      case 'map':
          return <MapView ads={ads.filter(ad => ad.status === 'active')} viewAdDetails={viewAdDetails} />;
      case 'following':
          return user ? <FollowingView ads={ads} viewAdDetails={viewAdDetails} favoriteAdIds={favoriteAdIds} onToggleFavorite={handleToggleFavorite} followingSellerIds={followingSellerIds} currentUser={user}/> : null;
      case 'home':
      default:
        return <HomeView ads={ads} navigateTo={navigateTo} viewAdDetails={viewAdDetails} favoriteAdIds={favoriteAdIds} onToggleFavorite={handleToggleFavorite} showToast={showToast} activeSearch={activeSearch} onSearchApplied={handleSearchApplied} />;
    }
  };

  return (
    <div className="min-h-screen bg-tg-bg">
      <Header currentPage={currentPage} goBack={goBack} navigateTo={navigateTo} unreadMessagesCount={unreadMessagesCount} />
      <main className="p-4">
        {renderContent()}
      </main>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
};

export default App;
