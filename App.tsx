
import React, { useState } from 'react';
import RideRequestScreen from './screens/RideRequestScreen';
import PriceAdjustScreen from './screens/PriceAdjustScreen';
import RideDetailsScreen from './screens/RideDetailsScreen';
import PaymentScreen from './screens/PaymentScreen';
import DriverScreen from './screens/DriverScreen';
import UserModeToggle from './components/UserModeToggle';
import { Screen, UserMode } from './types';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('request');
  const [userMode, setUserMode] = useState<UserMode>('passenger');

  const renderPassengerScreen = () => {
    switch (currentScreen) {
      case 'request':
        return <RideRequestScreen setScreen={setCurrentScreen} />;
      case 'price':
        return <PriceAdjustScreen setScreen={setCurrentScreen} />;
      case 'details':
        return <RideDetailsScreen setScreen={setCurrentScreen} />;
      case 'payment':
        return <PaymentScreen setScreen={setCurrentScreen} />;
      default:
        return <RideRequestScreen setScreen={setCurrentScreen} />;
    }
  };

  return (
    <main className="h-screen w-screen font-sans antialiased relative">
        <header className="absolute top-0 left-0 right-0 z-20 p-4 pt-6 flex justify-center">
            <UserModeToggle userMode={userMode} setUserMode={setUserMode} />
        </header>

        {userMode === 'passenger' ? renderPassengerScreen() : <DriverScreen setScreen={setCurrentScreen} />}
    </main>
  );
};

export default App;
