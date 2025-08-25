
import React, { useState } from 'react';
import type { ScreenProps, Driver } from '../types';
import MapBackground from '../components/MapBackground';

const DriverScreen: React.FC<ScreenProps> = ({ setScreen }) => {
  const [isOnline, setIsOnline] = useState(false);
  
  // Represents the current user's car
  const userCar: Driver = { id: 0, position: { lat: 50.452, lng: 30.525 } };

  return (
    <div className="h-full w-full relative flex flex-col justify-end">
      <MapBackground drivers={[userCar]} />
      
      <div className="bg-white p-6 rounded-t-2xl shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.3)] z-10">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">Driver Mode</h2>
            <p className="text-gray-500 mb-6">You are currently {isOnline ? 'online' : 'offline'}.</p>
        </div>
        <button 
          onClick={() => setIsOnline(!isOnline)}
          className={`w-full font-bold py-4 rounded-lg text-lg transition-colors ${isOnline ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
        >
          {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>
    </div>
  );
};

export default DriverScreen;