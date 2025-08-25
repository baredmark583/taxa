
import React, { useState } from 'react';
import type { ScreenProps } from '../types';

const PriceAdjustScreen: React.FC<ScreenProps> = ({ setScreen }) => {
  const [price, setPrice] = useState(75);
  const [chance, setChance] = useState(40);

  const handlePriceChange = (amount: number) => {
    setPrice(prev => Math.max(50, prev + amount));
  };
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChance(parseInt(e.target.value, 10));
  };

  return (
    <div className="h-full w-full bg-gray-100 flex flex-col justify-end relative">
       <button onClick={() => setScreen('request')} className="absolute top-5 left-5 text-gray-600 z-20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
        </button>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-4/5 text-center bg-brand-dark text-white p-3 rounded-lg shadow-lg z-20">
           <p className="text-sm">Уменьшай или увеличивай стоимость поездки для быстрого поиска авто</p>
        </div>

      <div className="bg-white rounded-t-2xl p-6 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.3)] text-center flex flex-col items-center gap-6">
        <h2 className="text-xl font-semibold text-gray-800">Стоимость поездки</h2>
        
        <div className="flex items-center justify-center gap-8 w-full">
          <button onClick={() => handlePriceChange(-5)} className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full text-3xl text-gray-600">-</button>
          <span className="text-5xl font-bold text-gray-900 w-32 text-center">{price} ₴</span>
          <button onClick={() => handlePriceChange(5)} className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full text-3xl text-gray-600">+</button>
        </div>

        <div className="w-full flex flex-col items-center gap-2">
            <label htmlFor="chance" className="text-sm text-gray-500">Шанс нахождения авто</label>
            <input 
              id="chance"
              type="range" 
              min="0" 
              max="100" 
              value={chance} 
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
        </div>

        <button onClick={() => setScreen('request')} className="w-full bg-brand-yellow text-brand-dark font-bold py-4 rounded-lg text-lg mt-4">
            Применить
        </button>
      </div>
    </div>
  );
};

export default PriceAdjustScreen;
