import React, { useState, useMemo } from 'react';
import { type Ad, type Page } from '../types';
import AdCard from './AdCard';
import { EmptyBoxIcon } from './icons/EmptyBoxIcon';

interface HomeViewProps {
  ads: Ad[];
  navigateTo: (page: Page) => void;
  viewAdDetails: (ad: Ad) => void;
  favoriteAdIds: Set<string>;
  onToggleFavorite: (adId: string) => void;
  showToast: (message: string) => void;
  // FIX: Removed legacy props that are no longer used by this component.
}

type SortBy = 'date' | 'price_asc' | 'price_desc';

const CATEGORIES = ['Все', 'Електроніка', 'Меблі', 'Одяг', 'Хобі', 'Інше'];

// FIX: Removed unused props from component signature.
const HomeView: React.FC<HomeViewProps> = ({ ads, navigateTo, viewAdDetails, favoriteAdIds, onToggleFavorite }) => {
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  
  const filteredAndSortedAds = useMemo(() => {
    let result = ads;

    if (selectedCategory !== 'Все') {
      result = result.filter(ad => ad.category === selectedCategory);
    }

    if (searchQuery.trim()) {
        const lowercasedQuery = searchQuery.toLowerCase();
        result = result.filter(ad => 
            ad.title.toLowerCase().includes(lowercasedQuery) ||
            ad.description.toLowerCase().includes(lowercasedQuery)
        );
    }
    
    const sortedResult = [...result];
    sortedResult.sort((a, b) => {
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;

        switch (sortBy) {
            case 'price_asc': return parseInt(a.price, 10) - parseInt(b.price, 10);
            case 'price_desc': return parseInt(b.price, 10) - parseInt(a.price, 10);
            case 'date': default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    return sortedResult;
  }, [ads, selectedCategory, searchQuery, sortBy]);

  return (
    <div>
       <div className="flex gap-2 mb-4">
            <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук..."
            className="w-full bg-tg-secondary-bg p-3 pl-4 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
            />
       </div>
        <div className="mb-4 overflow-x-auto pb-2 pt-2">
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

      {filteredAndSortedAds.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-20">
          {filteredAndSortedAds.map((ad) => (
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
        <div className="text-center text-tg-hint mt-12 flex flex-col items-center">
            <EmptyBoxIcon />
            <p className="text-lg mt-4">Нічого не знайдено</p>
        </div>
      )}

      <button 
        onClick={() => navigateTo('create')}
        className="fixed bottom-6 right-6 bg-tg-button text-tg-button-text p-4 rounded-full shadow-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-tg-bg focus:ring-tg-link"
        aria-label="Створити нове оголошення"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default HomeView;