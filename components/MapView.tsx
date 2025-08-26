import React, { useState } from 'react';
import { type Ad } from '../types';
import { formatPrice } from '../utils/formatters';

interface MapViewProps {
  ads: Ad[];
  viewAdDetails: (ad: Ad) => void;
}

// Simple hash function to get a deterministic "random" position for an ad
const getPosition = (adId: string): { top: string; left: string } => {
    let hash = 0;
    for (let i = 0; i < adId.length; i++) {
        const char = adId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    const x = Math.abs(hash % 90) + 5; // 5% to 95%
    const y = Math.abs((hash / adId.length) % 80) + 10; // 10% to 90%
    return { top: `${y}%`, left: `${x}%` };
};

const AdTooltip: React.FC<{ ad: Ad; onClick: () => void }> = ({ ad, onClick }) => (
    <div 
        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-tg-secondary-bg-hover rounded-lg shadow-lg p-2 cursor-pointer z-20"
        onClick={onClick}
    >
        <img src={ad.imageUrls[0]} alt={ad.title} className="w-full h-20 object-cover rounded-md mb-2" />
        <p className="font-semibold text-sm truncate">{ad.title}</p>
        <p className="text-tg-link font-bold">{formatPrice(ad.price)}</p>
    </div>
);


const MapView: React.FC<MapViewProps> = ({ ads, viewAdDetails }) => {
    const [selectedAd, setSelectedAd] = useState<Ad | null>(null);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Оголошення на карті</h2>
            <div 
                className="relative w-full h-[70vh] bg-tg-secondary-bg rounded-lg overflow-hidden border-2 border-tg-border"
                style={{ backgroundImage: `url('https://subtlepatterns.com/patterns/gplaypattern.png')`}}
                onClick={() => setSelectedAd(null)}
            >
                {ads.map(ad => {
                    const { top, left } = getPosition(ad.id);
                    return (
                        <div
                            key={ad.id}
                            className="absolute z-10"
                            style={{ top, left, transform: 'translate(-50%, -50%)' }}
                            onClick={(e) => { e.stopPropagation(); setSelectedAd(ad); }}
                        >
                           <div className="h-4 w-4 bg-tg-link rounded-full ring-4 ring-tg-link/50 cursor-pointer animate-pulse"></div>
                           {selectedAd?.id === ad.id && <AdTooltip ad={ad} onClick={() => viewAdDetails(ad)} />}
                        </div>
                    );
                })}
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-4 py-2 rounded-full">
                    Це симуляція карти. Клікніть на точку, щоб побачити оголошення.
                </div>
            </div>
        </div>
    );
};

export default MapView;