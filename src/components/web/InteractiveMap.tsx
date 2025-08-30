import React, { useState, useEffect } from 'react';
import { MapContainer, GeoJSON, TileLayer, useMap } from 'react-leaflet';
import { type RegionStat } from '../../types';
import L from 'leaflet';

// Import the GeoJSON data
import ukraineRegionsGeoJSON from '../../assets/ukraine-regions.json';

interface InteractiveMapProps {
    stats: RegionStat[];
    onRegionSelect: (regionName: string | null) => void;
}

const MapComponent: React.FC<{ stats: RegionStat[], onRegionSelect: (region: string) => void }> = ({ stats, onRegionSelect }) => {
    const map = useMap();
    const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

    const statsMap = new Map(stats.map(s => [s.region, s.count]));

    const getColor = (count: number) => {
        if (count > 100) return '#0a84ff';
        if (count > 50) return '#3e9de6';
        if (count > 20) return '#62a9e3';
        if (count > 10) return '#8ac0ec';
        if (count > 0) return '#b1d6f3';
        return '#dbe9f5';
    };

    const style = (feature: any) => {
        const regionName = feature.properties.name;
        const count = statsMap.get(regionName) || 0;
        const isHovered = regionName === hoveredRegion;
        return {
            fillColor: getColor(count),
            weight: 1.5,
            opacity: 1,
            color: isHovered ? '#0d0d0d' : '#ffffff',
            dashArray: isHovered ? '' : '3',
            fillOpacity: isHovered ? 0.9 : 0.7,
        };
    };

    const onEachFeature = (feature: any, layer: L.Layer) => {
        const regionName = feature.properties.name;
        const count = statsMap.get(regionName) || 0;
        const popupContent = `<b>${regionName}</b><br />Оголошень: ${count}`;
        layer.bindPopup(popupContent);

        layer.on({
            mouseover: (e) => {
                setHoveredRegion(regionName);
                e.target.setStyle({ weight: 2.5, color: '#0d0d0d', dashArray: '' });
            },
            mouseout: (e) => {
                setHoveredRegion(null);
                e.target.setStyle({ weight: 1.5, color: '#ffffff', dashArray: '3' });
            },
            click: () => {
                onRegionSelect(regionName);
                // Optionally zoom to feature
                if ('getBounds' in layer) {
                    map.fitBounds((layer as L.GeoJSON).getBounds());
                }
            }
        });
    };

    return (
        <GeoJSON
            key={JSON.stringify(stats)} // Re-render when stats change
            data={ukraineRegionsGeoJSON as any}
            style={style}
            onEachFeature={onEachFeature}
        />
    );
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({ stats, onRegionSelect }) => {
    // Check if running in a context where window is not defined (SSR)
    if (typeof window === 'undefined') {
        return <div>Loading map...</div>;
    }

    const position: L.LatLngExpression = [48.3794, 31.1656]; // Centered on Ukraine
    
    return (
        <div className="h-56 w-full rounded-lg overflow-hidden">
            <MapContainer
                center={position}
                zoom={6}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                />
                <MapComponent stats={stats} onRegionSelect={onRegionSelect} />
            </MapContainer>
        </div>
    );
};

export default InteractiveMap;