import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { type Ad, type Page } from '../types';
import AdCard from './AdCard';
import { Icon } from '@iconify/react';
import { getAds } from '../apiClient';
import Spinner from './Spinner';
import { useI18n } from '../I18nContext';
import { useAppContext } from '../AppContext';
import Sidebar from './web/Sidebar';

interface HomeViewProps {
  favoriteAdIds: Set<string>;
  onToggleFavorite: (adId: string) => void;
}

type SortBy = 'date' | 'price_asc' | 'price_desc';

const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): Promise<ReturnType<F>> =>
        new Promise(resolve => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => resolve(func(...args)), waitFor);
        });
};


const HomeView: React.FC<HomeViewProps> = ({ favoriteAdIds, onToggleFavorite }) => {
  const { t } = useI18n();
  const { isWeb } = useAppContext();
  const CATEGORIES = useMemo(() => (t('categories').split(',')), [t]);
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  
  const fetchAds = useCallback(
    async (search: string, category: string, sort: SortBy) => {
      setIsLoading(true);
      try {
        const apiCategory = category === t('categories').split(',')[0] ? 'Все' : category;
        const response = await getAds({ search, category: apiCategory, sortBy: sort });
        setAds(response.data);
      } catch (error) {
        console.error("Failed to fetch ads:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  const debouncedFetchAds = useMemo(() => debounce(fetchAds, 300), [fetchAds]);

  useEffect(() => {
    // Initial fetch
    fetchAds(searchQuery, selectedCategory, sortBy);
  }, []); // Only on mount

  useEffect(() => {
    if (searchQuery) {
        debouncedFetchAds(searchQuery, selectedCategory, sortBy);
    } else {
        fetchAds(searchQuery, selectedCategory, sortBy);
    }
  }, [searchQuery, selectedCategory, sortBy, debouncedFetchAds, fetchAds]);


  // Web view layout
  if (isWeb) {
      return (
          <div className="flex gap-8">
              <Sidebar 
                  categories={CATEGORIES}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
              />
              <div className="flex-grow">
                 {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-72 bg-tg-secondary-bg-hover rounded-lg animate-pulse" />)}
                    </div>
                  ) : ads.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {ads.map((ad) => (
                        <Link to={`/ad/${ad.id}`} key={ad.id} className="block">
                          <AdCard 
                            ad={ad} 
                            isFavorite={favoriteAdIds.has(ad.id)}
                            onToggleFavorite={onToggleFavorite}
                          />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-tg-hint mt-12 flex flex-col items-center h-96 justify-center">
                        <Icon icon="lucide:package-search" className="h-20 w-20 text-tg-border" />
                        <p className="text-lg mt-4">{t('home.noResults')}</p>
                    </div>
                  )}
              </div>
          </div>
      );
  }

  // Mobile (Telegram Mini App) view layout
  return (
    <div>
       <div className="flex gap-2 mb-4">
            <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('home.searchPlaceholder')}
            className="w-full bg-tg-secondary-bg p-3 pl-4 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
            />
       </div>
        <div className="mb-4 overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex space-x-2">
            {CATEGORIES.map(category => (
                <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === category
                    ? 'bg-tg-button text-tg-button-text'
                    : 'bg-tg-secondary-bg hover:bg-tg-secondary-bg-hover'
                }`}
                >
                {category}
                </button>
            ))}
            </div>
        </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-60 bg-tg-secondary-bg-hover rounded-lg animate-pulse" />)}
        </div>
      ) : ads.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {ads.map((ad) => (
            <Link to={`/ad/${ad.id}`} key={ad.id} className="block">
              <AdCard 
                ad={ad} 
                isFavorite={favoriteAdIds.has(ad.id)}
                onToggleFavorite={onToggleFavorite}
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center text-tg-hint mt-12 flex flex-col items-center">
            <Icon icon="lucide:package-search" className="h-20 w-20 text-tg-border" />
            <p className="text-lg mt-4">{t('home.noResults')}</p>
        </div>
      )}
    </div>
  );
};

export default HomeView;