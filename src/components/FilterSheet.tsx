import React, { useState, useEffect, useMemo } from 'react';
import { type Ad } from '../types';

interface Filters {
    location: string;
    priceFrom: string;
    priceTo: string;
}

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: Filters) => void;
  initialFilters: Filters;
  ads: Ad[];
}

const FilterSheet: React.FC<FilterSheetProps> = ({ isOpen, onClose, onApplyFilters, initialFilters, ads }) => {
  const [localFilters, setLocalFilters] = useState(initialFilters);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    setLocalFilters(initialFilters);
  }, [initialFilters]);
  
  useEffect(() => {
    if (isOpen) {
        setAnimationClass('animate-slide-in-up');
    } else if (animationClass) {
        // Only trigger close animation if it was open before
        setAnimationClass('animate-slide-out-down');
    }
  }, [isOpen]);

  const uniqueLocations = useMemo(() => {
    const locations = new Set(ads.map(ad => ad.location));
    return Array.from(locations);
  }, [ads]);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };
  
  const handleReset = () => {
      const resetFilters = { location: '', priceFrom: '', priceTo: '' };
      setLocalFilters(resetFilters);
      onApplyFilters(resetFilters);
      onClose();
  };

  const handleAnimationEnd = () => {
    if (!isOpen) {
      setAnimationClass(''); // Reset class after animation to allow reopening
    }
  };
  
  if (!isOpen && !animationClass) {
      return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`fixed bottom-0 left-0 right-0 bg-tg-secondary-bg rounded-t-2xl shadow-xl max-h-[80vh] flex flex-col ${animationClass}`}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={handleAnimationEnd}
      >
        <header className="p-4 border-b border-tg-border flex items-center justify-between sticky top-0 bg-tg-secondary-bg rounded-t-2xl">
            <h2 className="text-xl font-bold">Фільтри</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-tg-secondary-bg-hover">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        
        <main className="p-4 space-y-6 overflow-y-auto">
            <div>
                <label htmlFor="location" className="block text-sm font-medium text-tg-hint mb-1">Місцезнаходження</label>
                <input 
                    type="text" 
                    id="location"
                    list="locations"
                    value={localFilters.location}
                    onChange={(e) => setLocalFilters(f => ({ ...f, location: e.target.value }))}
                    placeholder="Наприклад, Київ"
                    className="w-full bg-tg-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
                />
                 <datalist id="locations">
                    {uniqueLocations.map(loc => <option key={loc} value={loc} />)}
                </datalist>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-tg-hint mb-1">Ціна, ₴</label>
                <div className="flex gap-4">
                     <input 
                        type="number" 
                        value={localFilters.priceFrom}
                        onChange={(e) => setLocalFilters(f => ({ ...f, priceFrom: e.target.value }))}
                        placeholder="Від"
                        className="w-full bg-tg-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
                    />
                     <input 
                        type="number"
                        value={localFilters.priceTo}
                        onChange={(e) => setLocalFilters(f => ({ ...f, priceTo: e.target.value }))}
                        placeholder="До"
                        className="w-full bg-tg-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
                    />
                </div>
            </div>
        </main>

        <footer className="p-4 border-t border-tg-border flex gap-4 sticky bottom-0 bg-tg-secondary-bg">
            <button onClick={handleReset} className="flex-1 bg-tg-secondary-bg-hover text-tg-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors">
                Скинути
            </button>
            <button onClick={handleApply} className="flex-1 bg-tg-button text-tg-button-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors">
                Застосувати
            </button>
        </footer>
      </div>
    </div>
  );
};

export default FilterSheet;
