

import React from 'react';
import type { ScreenProps } from '../types';

interface StarIconProps {
    filled: boolean;
}

const StarIcon: React.FC<StarIconProps> = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${filled ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);


const RideDetailsScreen: React.FC<ScreenProps> = ({ setScreen }) => {
  return (
    <div className="h-full w-full bg-gray-50 flex flex-col p-4 text-gray-800">
        <div className="flex justify-between items-center mb-4 pt-8">
             <button onClick={() => setScreen('request')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
             </button>
             <button>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
             </button>
        </div>

        <p className="text-gray-500 mb-6">20 мар. 2022 г., 13:07</p>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold">Водитель</h3>
                    <p className="text-sm">В Uklon: 1 год</p>
                    <p className="text-sm text-gray-500">Поездок: 2 504</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">5.0</span>
                    <div className="flex">
                        {[...Array(5)].map((_, i) => <StarIcon key={i} filled={true} />)}
                    </div>
                </div>
            </div>
            <div className="border-t my-4"></div>
            <div className="flex items-center justify-between text-sm">
                <div>
                    <p>Белый Renault Logan (Стандарт)</p>
                </div>
                <div className="bg-gray-200 p-1 rounded font-mono text-xs">
                    AA1***B
                </div>
            </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm flex-grow">
            <div className="flex items-center justify-between mb-4">
                <p className="text-gray-500">Чек-оплата</p>
                <p className="font-mono text-gray-500">--1367</p>
            </div>
            <div className="flex justify-between items-center mb-2">
                <p>За поездку</p>
                <p>88 ₴</p>
            </div>
            <div className="flex justify-between items-center mb-4">
                <p>2 мин. платного ожидания</p>
                <p>2 ₴</p>
            </div>
            <div className="border-t my-3"></div>
            <div className="flex justify-between items-center font-bold text-lg">
                <p>Итого</p>
                <p>90 ₴</p>
            </div>
            <div className="border-t my-4"></div>
            <div>
                <h4 className="font-bold mb-4">Маршрут</h4>
                <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                        <div className="w-px h-10 bg-gray-300 my-1"></div>
                        <div className="w-3 h-3 border-2 border-gray-800 rounded-full"></div>
                    </div>
                    <div className="flex flex-col justify-between text-sm">
                        <p>Пирамида</p>
                        <p className="mt-4">ЦУМ (Богдана Хмельницкого, 2)</p>
                    </div>
                </div>
            </div>
        </div>

    </div>
  );
};

export default RideDetailsScreen;