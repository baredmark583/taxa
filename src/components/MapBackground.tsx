

import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Driver } from '../types';

interface MapBackgroundProps {
  drivers?: Driver[];
}

const taxiIcon = L.icon({
    iconUrl: 'https://api.iconify.design/openmoji/taxi.svg',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});


const MapBackground: React.FC<MapBackgroundProps> = ({ drivers = [] }) => {
  return (
    <div className="absolute inset-0 z-0">
        <MapContainer center={[50.4501, 30.5234]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
            <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {drivers.map((driver) => (
                <Marker key={driver.id} position={[driver.position.lat, driver.position.lng]} icon={taxiIcon} />
            ))}
      </MapContainer>
    </div>
  );
};

export default MapBackground;