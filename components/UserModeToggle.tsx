
import React from 'react';
import { UserMode } from '../types';

interface UserModeToggleProps {
  userMode: UserMode;
  setUserMode: (mode: UserMode) => void;
}

const UserModeToggle: React.FC<UserModeToggleProps> = ({ userMode, setUserMode }) => {
    const baseStyle = "px-6 py-2 rounded-full font-semibold transition-colors duration-300 text-sm";
    const activeStyle = "bg-brand-dark text-white";
    const inactiveStyle = "bg-transparent text-brand-dark";

    return (
        <div className="flex items-center bg-white/60 backdrop-blur-sm rounded-full p-1 shadow-md">
            <button 
                onClick={() => setUserMode('passenger')} 
                className={`${baseStyle} ${userMode === 'passenger' ? activeStyle : inactiveStyle}`}
                aria-pressed={userMode === 'passenger'}
            >
                Passenger
            </button>
            <button 
                onClick={() => setUserMode('driver')} 
                className={`${baseStyle} ${userMode === 'driver' ? activeStyle : inactiveStyle}`}
                aria-pressed={userMode === 'driver'}
            >
                Driver
            </button>
        </div>
    );
};

export default UserModeToggle;
