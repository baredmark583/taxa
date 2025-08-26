import React, { useState, useEffect } from 'react';
import { type SavedSearch } from '../types';
import { getSavedSearches, deleteSearch, getNewMatchesCount } from '../backend/api';
import Spinner from './Spinner';

interface SavedSearchesViewProps {
    onApplySearch: (search: SavedSearch) => void;
}

const SearchCard: React.FC<{
    search: SavedSearch;
    onDelete: (id: string) => void;
    onApply: (search: SavedSearch) => void;
}> = ({ search, onDelete, onApply }) => {
    const [newMatches, setNewMatches] = useState(0);

    useEffect(() => {
        getNewMatchesCount(search).then(setNewMatches);
    }, [search]);
    
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(search.id);
    };

    const description = [
        search.query,
        search.category !== 'Все' && search.category,
        search.filters.location,
        (search.filters.priceFrom || search.filters.priceTo) && `Ціна: ${search.filters.priceFrom || 'від'} - ${search.filters.priceTo || 'до'} ₴`
    ].filter(Boolean).join(' · ');

    return (
        <div onClick={() => onApply(search)} className="bg-tg-secondary-bg p-4 rounded-lg cursor-pointer hover:bg-tg-secondary-bg-hover transition-colors relative">
            <button onClick={handleDelete} className="absolute top-2 right-2 text-tg-hint hover:text-red-500 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <p className="font-bold text-lg truncate pr-8">{search.query || 'Всі товари'}</p>
            <p className="text-sm text-tg-hint truncate">{description || 'Будь-які параметри'}</p>
            {newMatches > 0 && (
                <div className="absolute bottom-2 right-2 bg-tg-link text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    +{newMatches} нових
                </div>
            )}
        </div>
    );
};


const SavedSearchesView: React.FC<SavedSearchesViewProps> = ({ onApplySearch }) => {
    const [searches, setSearches] = useState<SavedSearch[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSearches = async () => {
        setIsLoading(true);
        const saved = await getSavedSearches();
        setSearches(saved);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchSearches();
    }, []);

    const handleDelete = async (id: string) => {
        await deleteSearch(id);
        setSearches(prev => prev.filter(s => s.id !== id));
    };

    if (isLoading) {
        return <div className="flex justify-center mt-12"><Spinner size="lg" /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-center">Збережені пошуки</h1>
            {searches.length > 0 ? (
                <div className="space-y-4">
                    {searches.map(search => (
                        <SearchCard key={search.id} search={search} onDelete={handleDelete} onApply={onApplySearch} />
                    ))}
                </div>
            ) : (
                <p className="text-center text-tg-hint mt-12">Тут будуть ваші збережені пошуки, щоб ви не пропустили нові оголошення.</p>
            )}
        </div>
    );
};

export default SavedSearchesView;
