import React, { useState, useEffect } from 'react';
import { getFavoriteAds } from '../apiClient';
import { Ad } from '../types';
import AdCard from '../components/AdCard';
import Spinner from '../components/Spinner';
import { Icon } from '@iconify/react';
import { useI18n } from '../I18nContext';

interface FavoritesPageProps {
    viewAdDetails: (ad: Ad) => void;
    favoriteAdIds: Set<string>;
    onToggleFavorite: (adId: string) => void;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({ viewAdDetails, favoriteAdIds, onToggleFavorite }) => {
    const { t } = useI18n();
    const [favoriteAds, setFavoriteAds] = useState<Ad[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFavorites = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await getFavoriteAds();
                setFavoriteAds(response.data);
            } catch (err) {
                setError(t('errors.failedToLoadFavorites'));
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFavorites();
    }, [favoriteAdIds, t]); // Refetch when the set of favorite IDs changes

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    if (error) {
        return <p className="text-center text-red-400 mt-8">{error}</p>;
    }

    return (
        <div>
            {favoriteAds.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {favoriteAds.map(ad => (
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
                    <Icon icon="lucide:heart-off" className="h-20 w-20 text-tg-border" />
                    <p className="text-lg mt-4">{t('favorites.emptyTitle')}</p>
                    <p className="text-sm mt-1">{t('favorites.emptySubtitle')}</p>
                </div>
            )}
        </div>
    );
};

export default FavoritesPage;