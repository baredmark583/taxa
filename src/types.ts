

import type React from 'react';

export type Screen = 'request' | 'price' | 'details' | 'payment';
export type UserMode = 'passenger' | 'driver';

export interface VehicleOption {
  id: string;
  name: string;
  price: number;
  icon: React.ReactNode;
}

export interface ScreenProps {
    setScreen: (screen: Screen) => void;
}

export interface Driver {
  id: number;
  position: {
    lat: number;
    lng: number;
  };
}