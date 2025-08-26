import React, { useState, useMemo, useEffect, useRef } from 'react';
import { type Ad, type Page, type SavedSearch } from '../types';
import AdCard from './AdCard';
import { findRelevantAds, saveSearch, isSearchSaved, searchByImage, getSearchHistory, saveSearchHistory } from '../backend/api';
import Spinner from './Spinner';
import FilterSheet from './FilterSheet';
import { EmptyBoxIcon } from './icons/EmptyBoxIcon';

interface HomeViewProps {
  ads: Ad[];
  navigateTo: (page: Page) => void;
  viewAdDetails: (ad: Ad) => void;
  favoriteAdIds: Set<string>;
  onToggleFavorite: (adId: string) => void;
  showToast: (message: string) => void;
  activeSearch: SavedSearch | null;
  onSearchApplied: () => void;
}

type SortBy = 'date' | 'price_asc' | 'price_desc';
interface Filters {
    location: string;
    priceFrom: string;
    priceTo: string;
}

const CATEGORIES = ['Все', 'Електроніка', 'Меблі', 'Одяг', 'Хобі', 'Інше'];

const fileToDataUrl = (file: File): Promise<{ dataUrl: string, base64: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ dataUrl: result, base64 });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const SortButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
            isActive
                ? 'bg-tg-link text-tg-button-text'
                : 'bg-tg-secondary-bg hover:bg-tg-secondary-bg-hover'
        }`}
    >
        {label}
    </button>
);


const HomeView: React.FC<HomeViewProps> = ({ ads, navigateTo, viewAdDetails, favoriteAdIds, onToggleFavorite, showToast, activeSearch, onSearchApplied }) => {
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSortedAdIds, setAiSortedAdIds] = useState<string[] | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({ location: '', priceFrom: '', priceTo: '' });
  const [isCurrentSearchSaved, setIsCurrentSearchSaved] = useState(false);
  const [imageSearchState, setImageSearchState] = useState<{imageUrl: string | null, isLoading: boolean}>({ imageUrl: null, isLoading: false });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const isFiltersActive = useMemo(() => filters.location || filters.priceFrom || filters.priceTo, [filters]);
  const isSearchActive = useMemo(() => searchQuery.trim() || isFiltersActive || selectedCategory !== 'Все' || imageSearchState.imageUrl, [searchQuery, isFiltersActive, selectedCategory, imageSearchState.imageUrl]);

  useEffect(() => {
    getSearchHistory().then(setSearchHistory);
  }, []);

  const resetSearch = () => {
      setSearchQuery('');
      setAiSortedAdIds(null);
      setImageSearchState({ imageUrl: null, isLoading: false });
  };

  useEffect(() => {
    if (activeSearch) {
        resetSearch();
        setSearchQuery(activeSearch.query);
        setSelectedCategory(activeSearch.category);
        setFilters(activeSearch.filters);
        onSearchApplied();
    }
  }, [activeSearch, onSearchApplied]);
  
  useEffect(() => {
    if (!isSearchActive || imageSearchState.imageUrl) {
        setIsCurrentSearchSaved(false);
        return;
    }
    const checkSavedStatus = async () => {
        const saved = await isSearchSaved({ query: searchQuery, category: selectedCategory, filters });
        setIsCurrentSearchSaved(saved);
    };
    checkSavedStatus();
  }, [searchQuery, selectedCategory, filters, isSearchActive, imageSearchState.imageUrl]);
  
  const handleImageSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetSearch();
    setImageSearchState({ imageUrl: URL.createObjectURL(file), isLoading: true });

    try {
        const { base64 } = await fileToDataUrl(file);
        const { query, category } = await searchByImage(base64, file.type);
        
        showToast("AI розпізнав фото!");
        setSearchQuery(query);
        const isValidCategory = CATEGORIES.includes(category);
        setSelectedCategory(isValidCategory ? category : 'Інше');

        // Now trigger the text-based AI search with the generated query
        handleAiSearch(query, ads.filter(ad => isValidCategory ? ad.category === category : true));

    } catch (error: any) {
        showToast(error.message || "Помилка пошуку по фото");
        resetSearch();
    } finally {
        setImageSearchState(prev => ({ ...prev, isLoading: false }));
        // Reset file input to allow selecting the same file again
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    }
  }


  const handleAiSearch = async (query: string, currentAds: Ad[]) => {
    if (!query.trim()) {
        setAiSortedAdIds(null);
        return;
    }
    setIsAiSearching(true);
    try {
        const relevantIds = await findRelevantAds(query, currentAds);
        setAiSortedAdIds(relevantIds);
        const updatedHistory = await saveSearchHistory(query);
        setSearchHistory(updatedHistory);
    } catch (error) {
        console.error("AI search failed", error);
        setAiSortedAdIds([]); 
    } finally {
        setIsAiSearching(false);
    }
  };
  
  const handleSaveSearch = async () => {
    if (isCurrentSearchSaved) {
        showToast("Цей пошук вже збережено.");
        return;
    }
    await saveSearch({ query: searchQuery, category: selectedCategory, filters });
    setIsCurrentSearchSaved(true);
    showToast("Пошук збережено!");
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchFocused(false);
    setImageSearchState({ imageUrl: null, isLoading: false }); // Clear image search
    const categoryFilteredAds = ads.filter(ad => selectedCategory === 'Все' || ad.category === selectedCategory);
    handleAiSearch(searchQuery, categoryFilteredAds);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      if (query.trim() === '') {
          setAiSortedAdIds(null);
          setImageSearchState({ imageUrl: null, isLoading: false });
      }
  };
  
  const handleCategoryChange = (category: string) => {
      setSelectedCategory(category);
      resetSearch();
  };


  const filteredAndSortedAds = useMemo(() => {
    let result = ads;

    // 1. Filter by category
    if (selectedCategory !== 'Все') {
      result = result.filter(ad => ad.category === selectedCategory);
    }

    // 2. Apply advanced filters (location, price)
    if (filters.location) {
        result = result.filter(ad => ad.location.toLowerCase().includes(filters.location.toLowerCase()));
    }
    if (filters.priceFrom) {
        result = result.filter(ad => parseInt(ad.price, 10) >= parseInt(filters.priceFrom, 10));
    }
    if (filters.priceTo) {
        result = result.filter(ad => parseInt(ad.price, 10) <= parseInt(filters.priceTo, 10));
    }


    // 3. If AI search has been performed, filter and sort by its results
    if (aiSortedAdIds) {
      const idOrderMap = new Map(aiSortedAdIds.map((id, index) => [id, index]));
      return result
        .filter(ad => idOrderMap.has(ad.id))
        .sort((a, b) => (idOrderMap.get(a.id) ?? 999) - (idOrderMap.get(b.id) ?? 999));
    }
    
    // 4. If no AI search, apply manual sorting
    const sortedResult = [...result]; // Create a new array to avoid mutating the original
    sortedResult.sort((a, b) => {
        // Boosted ads always on top
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;

        switch (sortBy) {
            case 'price_asc':
                return parseInt(a.price, 10) - parseInt(b.price, 10);
            case 'price_desc':
                return parseInt(b.price, 10) - parseInt(a.price, 10);
            case 'date':
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    return sortedResult;
  }, [ads, selectedCategory, aiSortedAdIds, sortBy, filters]);

  return (
    <div className="relative">
      <div className="flex gap-2 mb-1">
        <div className="relative flex-grow">
          <form onSubmit={handleSearchSubmit} className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-tg-hint" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              </div>
              <input
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)} // Delay to allow click on history
              placeholder="Розумний пошук на Gemini..."
              className="w-full bg-tg-secondary-bg p-3 pl-10 pr-20 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
              aria-label="Інтелектуальний пошук оголошень"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {isAiSearching && <Spinner size="sm" />}
                  <label className="ml-2 cursor-pointer text-tg-hint hover:text-tg-link">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={handleImageSearch} />
                  </label>
              </div>
          </form>
          {isSearchFocused && searchHistory.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-tg-secondary-bg-hover border border-tg-border rounded-lg shadow-lg z-20">
              <ul>
                {searchHistory.map((item, index) => (
                  <li key={index} onMouseDown={() => { setSearchQuery(item); handleAiSearch(item, ads); }} className="px-4 py-2 text-sm cursor-pointer hover:bg-tg-border">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
           )}
        </div>
        <button
            onClick={() => navigateTo('map')}
            className="p-3 bg-tg-secondary-bg rounded-lg border border-tg-border hover:bg-tg-secondary-bg-hover transition-colors"
            aria-label="Показати на карті"
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.997 5.997 0 0116 10c0 .954-.223 1.856-.619 2.657a6 6 0 11-1.341-3.697M12 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
        </button>
        <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="relative p-3 bg-tg-secondary-bg rounded-lg border border-tg-border hover:bg-tg-secondary-bg-hover transition-colors"
            aria-label="Відкрити фільтри"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM15 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
            </svg>
            {isFiltersActive && <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-tg-link ring-2 ring-tg-bg"></span>}
        </button>
      </div>

      <div className="mb-4 overflow-x-auto pb-2 pt-2">
        <div className="flex space-x-2">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
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
      
       {imageSearchState.imageUrl && (
        <div className="mb-4 p-3 bg-tg-secondary-bg rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
                <img src={imageSearchState.imageUrl} className="w-12 h-12 rounded-md object-cover" alt="Image search preview" />
                <span className="text-sm font-semibold text-tg-hint">{imageSearchState.isLoading ? 'Аналізую фото...' : 'Результати по вашому фото:'}</span>
                {imageSearchState.isLoading && <Spinner size="sm" />}
            </div>
            <button onClick={resetSearch} className="p-1 rounded-full hover:bg-tg-secondary-bg-hover text-tg-hint">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <div className="flex space-x-2 items-center">
            <SortButton label="Спочатку нові" isActive={sortBy === 'date'} onClick={() => setSortBy('date')} />
            <SortButton label="Дешевше" isActive={sortBy === 'price_asc'} onClick={() => setSortBy('price_asc')} />
            <SortButton label="Дорожче" isActive={sortBy === 'price_desc'} onClick={() => setSortBy('price_desc')} />
        </div>
        <div className="flex items-center gap-2">
             <span className="text-sm text-tg-hint whitespace-nowrap">
                Знайдено: {filteredAndSortedAds.length}
            </span>
             {isSearchActive && !imageSearchState.imageUrl && (
                <button onClick={handleSaveSearch} className="text-tg-hint hover:text-tg-link transition-colors" aria-label={isCurrentSearchSaved ? "Пошук збережено" : "Зберегти пошук"}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isCurrentSearchSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                </button>
            )}
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
            {aiSortedAdIds !== null ? (
                <p className="text-sm mt-1">AI не зміг знайти збігів. Спробуйте інший запит.</p>
            ) : (
                <p className="text-sm mt-1">Спробуйте змінити категорію або скинути фільтри.</p>
            )}
        </div>
      )}

      <button 
        onClick={() => navigateTo('create')}
        className="fixed bottom-6 right-6 bg-tg-button text-tg-button-text p-4 rounded-full shadow-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-tg-bg focus:ring-tg-link"
        aria-label="Створити нове оголошення"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <FilterSheet 
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        onApplyFilters={setFilters}
        initialFilters={filters}
        ads={ads}
      />
    </div>
  );
};

export default HomeView;
