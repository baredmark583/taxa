import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { type Ad, type Page, HomePageBanner, RegionStat } from '../types';
import AdCard from './AdCard';
import { Icon } from '@iconify/react';
import { getAds, getBanner, getAdStatsByRegion } from '../apiClient';
import Spinner from './Spinner';
import { useI18n } from '../I18nContext';
import { useAppContext } from '../AppContext';
import Sidebar from './web/Sidebar';
import { resolveImageUrl } from '../utils/formatters';
import InteractiveMap from './web/InteractiveMap';


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
  const [banner, setBanner] = useState<HomePageBanner | null>(null);
  const [regionStats, setRegionStats] = useState<RegionStat[]>([]);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('date');
  
  const fetchAdsAndData = useCallback(
    async (search: string, category: string, sort: SortBy, region: string | null) => {
      setIsLoading(true);
      try {
        const apiCategory = category === t('categories').split(',')[0] ? 'Все' : category;
        
        // Fetch ads and banner/map data in parallel
        const [adsResponse, bannerResponse, statsResponse] = await Promise.all([
          getAds({ search, category: apiCategory, sortBy: sort, region: region || undefined }),
          getBanner(),
          getAdStatsByRegion()
        ]);
        
        setAds(adsResponse.data);
        setBanner(bannerResponse.data);
        setRegionStats(statsResponse.data);

      } catch (error) {
        console.error("Failed to fetch page data:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  const debouncedFetchAds = useMemo(() => debounce(fetchAdsAndData, 300), [fetchAdsAndData]);

  useEffect(() => {
    // Initial fetch
    fetchAdsAndData(searchQuery, selectedCategory, sortBy, selectedRegion);
  }, []); // Only on mount

  useEffect(() => {
    debouncedFetchAds(searchQuery, selectedCategory, sortBy, selectedRegion);
  }, [searchQuery, selectedCategory, sortBy, selectedRegion, debouncedFetchAds]);

  const AdGrid: React.FC = () => (
    <>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-80 bg-card dark:bg-dark-card rounded-lg animate-pulse" />)}
        </div>
      ) : ads.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        <div className="text-center text-muted-foreground dark:text-dark-muted-foreground mt-12 flex flex-col items-center h-96 justify-center col-span-full">
            <Icon icon="lucide:package-search" className="h-20 w-20 text-border dark:text-dark-border" />
            <p className="text-lg mt-4">{t('home.noResults')}</p>
        </div>
      )}
    </>
  );

  // Web view layout
  if (isWeb) {
      return (
        <div className="space-y-12">
          {banner && (
            <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
              <img src={resolveImageUrl(banner.imageUrl)} alt={banner.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 md:p-10 text-white">
                <h1 className="text-3xl md:text-5xl font-bold">{banner.title}</h1>
                {banner.subtitle && <p className="mt-2 text-lg md:text-xl max-w-lg">{banner.subtitle}</p>}
                {banner.buttonText && banner.buttonLink && (
                  <a href={banner.buttonLink} className="mt-4 inline-block bg-primary text-primary-foreground font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-transform hover:scale-105">
                    {banner.buttonText}
                  </a>
                )}
              </div>
            </div>
          )}
          
          <div className="flex gap-8">
              <Sidebar 
                  categories={CATEGORIES}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  stats={regionStats}
                  onRegionSelect={setSelectedRegion}
                  selectedRegion={selectedRegion}
              />
              <div className="flex-grow">
                 <AdGrid />
              </div>
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
            className="w-full bg-white dark:bg-tg-secondary-bg p-3 pl-4 rounded-lg border border-gray-300 dark:border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
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
                    : 'bg-white dark:bg-tg-secondary-bg hover:bg-gray-200 dark:hover:bg-tg-secondary-bg-hover'
                }`}
                >
                {category}
                </button>
            ))}
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <AdGrid />
        </div>
    </div>
  );
};

export default HomeView;