
import React, { useState } from 'react';
import type { ScreenProps, VehicleOption, Driver } from '../types';
import MapBackground from '../components/MapBackground';
import { StandardCarIcon, ComfortCarIcon, BusinessCarIcon, GreenCarIcon } from '../components/icons/CarIcons';

const vehicleOptions: VehicleOption[] = [
  { id: 'standard', name: 'Стандарт', price: 120, icon: <StandardCarIcon /> },
  { id: 'comfort', name: 'Комфорт', price: 139, icon: <ComfortCarIcon /> },
  { id: 'business', name: 'Бизнес', price: 179, icon: <BusinessCarIcon /> },
  { id: 'green', name: 'Green', price: 143, icon: <GreenCarIcon /> },
];

const MOCK_DRIVERS: Driver[] = [
    { id: 1, position: { lat: 50.45, lng: 30.52 } },
    { id: 2, position: { lat: 50.46, lng: 30.51 } },
    { id: 3, position: { lat: 50.44, lng: 30.53 } },
    { id: 4, position: { lat: 50.455, lng: 30.50 } },
    { id: 5, position: { lat: 50.445, lng: 30.54 } },
];


const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const RideRequestScreen: React.FC<ScreenProps> = ({ setScreen }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('standard');
  const price = vehicleOptions.find(v => v.id === selectedVehicle)?.price || 0;

  return (
    <div className="h-full w-full relative flex flex-col">
      <MapBackground drivers={MOCK_DRIVERS} />

      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.3)] p-4 flex flex-col gap-4 z-10">
        <div className="flex justify-between items-center text-center -mt-12">
          {vehicleOptions.map((vehicle) => (
            <button key={vehicle.id} onClick={() => setSelectedVehicle(vehicle.id)} className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-200 ${selectedVehicle === vehicle.id ? 'bg-yellow-100/80 scale-110' : ''}`}>
              {vehicle.icon}
              <span className="text-xs font-medium text-gray-700">{vehicle.name}</span>
              <span className={`text-xs ${selectedVehicle === vehicle.id ? 'text-black font-semibold' : 'text-gray-500'}`}>{vehicle.price} ₴</span>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-bold text-2xl">{price} ₴</span>
          </div>
          <button onClick={() => setScreen('price')} className="text-sm font-semibold text-blue-600 hover:text-blue-800">Изменить цену</button>
        </div>
        
        <div className="flex justify-around items-center text-xs text-gray-600 text-center border-t pt-3">
          {['...5022', 'Для нас', 'Комментарий', 'Услуги'].map(item => (
              <div key={item} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <span>{item}</span>
              </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button className="flex-grow bg-brand-yellow text-brand-dark font-bold py-4 rounded-lg text-lg">
            Заказать
          </button>
          <button className="p-4 bg-gray-100 rounded-lg">
            <ClockIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RideRequestScreen;