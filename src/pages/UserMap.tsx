import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { type AdminUser } from '../types';

interface UserMapProps {
    users: AdminUser[];
}

const UserMap: React.FC<UserMapProps> = ({ users }) => {
    // Filter users who have valid latitude and longitude
    const usersWithLocation = users.filter(
        user => user.latitude !== null && user.longitude !== null
    );

    // Default center for the map if no users have location
    const defaultCenter: [number, number] = [50.4501, 30.5234]; // Kyiv

    return (
        <div className="h-[60vh] w-full rounded-lg overflow-hidden">
            <MapContainer center={defaultCenter} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {usersWithLocation.map(user => (
                    <Marker key={user.id} position={[user.latitude!, user.longitude!]}>
                        <Popup>
                            <strong>{user.name}</strong><br />
                            {user.email}<br/>
                            City: {user.city || 'Unknown'}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default UserMap;
