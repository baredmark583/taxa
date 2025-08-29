import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAds } from '../apiClient';
import { Ad } from '../types';
import AdCard from '../components/AdCard';
import Spinner from '../components/Spinner';
import { Icon } from '@iconify/react';
import { useI18n } from '../I18nContext';
import { resolveImageUrl } from '../utils/formatters';

interface SellerProfilePageProps {
    favoriteAdIds: Set<string>;
    onToggleFavorite: (adId: string) => void;
}

const SellerProfilePage: React.FC<SellerProfilePageProps> = ({ favoriteAdIds, onToggleFavorite }) => {
    const { sellerId } = useParams<{ sellerId: string }>();
    const { t } = useI18n();
    const [sellerAds, setSellerAds] = useState<Ad[]>([]);
    const [sellerInfo, setSellerInfo] = useState<{name: string, avatarUrl?: string} | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sellerId) return;
        const fetchSellerData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await getAds({ sellerId });
                setSellerAds(response.data);
                if (response.data.length > 0) {
                    setSellerInfo(response.data[0].seller);
                } else {
                    // This would require a separate endpoint `getUserById`.
                    console.log("Seller has no ads, can't pull info.");
                }
            } catch (err) {
                setError(t('errors.failedToLoadSeller'));
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSellerData();
    }, [sellerId, t]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    if (error) {
        return <p className="text-center text-red-400 mt-8">{error}</p>;
    }

    return (
        <div>
            {sellerInfo && (
                 <div className="flex flex-col items-center mb-8">
                    <img src={resolveImageUrl(sellerInfo.avatarUrl || `https://i.pravatar.cc/150?u=${sellerId}`)} alt="Seller Avatar" className="w-24 h-24 rounded-full mb-4 object-cover border-2 border-tg-border" />
                    <h2 className="text-2xl font-bold">{sellerInfo.name}</h2>
                </div>
            )}
             <h3 className="text-xl font-bold mb-4 text-center">{t('sellerProfile.title')}</h3>
            {sellerAds.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {sellerAds.map(ad => (
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
                    <p className="text-lg mt-4">{t('sellerProfile.noAds')}</p>
                </div>
            )}
        </div>
    );
};

export default SellerProfilePage;