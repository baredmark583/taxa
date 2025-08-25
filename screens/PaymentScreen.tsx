
import React from 'react';
import type { ScreenProps } from '../types';

const GooglePayIcon = () => (
    <svg className="w-8 h-8" viewBox="0 0 48 48">
        <path fill="#4285F4" d="M38.3,21.6H9.7c-2.3,0-4.2,1.9-4.2,4.2v0c0,2.3,1.9,4.2,4.2,4.2h28.6c2.3,0,4.2-1.9,4.2-4.2v0C42.5,23.5,40.6,21.6,38.3,21.6z"/>
        <path fill="#34A853" d="M38.3,9.6H9.7c-2.3,0-4.2,1.9-4.2,4.2v0c0,2.3,1.9,4.2,4.2,4.2h28.6c2.3,0,4.2-1.9,4.2-4.2v0C42.5,11.5,40.6,9.6,38.3,9.6z"/>
        <path fill="#FBBC05" d="M38.3,33.6H9.7c-2.3,0-4.2,1.9-4.2,4.2v0c0,2.3,1.9,4.2,4.2,4.2h28.6c2.3,0,4.2-1.9,4.2-4.2v0C42.5,35.5,40.6,33.6,38.3,33.6z"/>
    </svg>
);

const MasterCardIcon = () => (
    <svg className="w-8 h-8" viewBox="0 0 48 48">
        <circle cx="18" cy="24" r="12" fill="#EA001B"/>
        <circle cx="30" cy="24" r="12" fill="#F79E1B"/>
        <path d="M24,24a12,12 0 0,1 0,0" fill="#FF5F00"/>
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


const PaymentScreen: React.FC<ScreenProps> = ({ setScreen }) => {
    return (
    <div className="h-full w-full bg-gray-100 flex flex-col">
        <div className="flex justify-between items-center p-4 pt-8 bg-white shadow-sm">
             <button onClick={() => setScreen('request')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
             </button>
             <h2 className="font-bold text-lg">Оплата</h2>
             <button className="text-sm text-blue-600 font-semibold">Редактировать</button>
        </div>

        <div className="p-4 flex flex-col gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
                <h3 className="text-sm text-gray-500 mb-2">Платежные карты</h3>
                
                <div className="flex items-center gap-4 py-2 border-b">
                    <GooglePayIcon />
                    <span className="flex-grow">Google Pay</span>
                </div>
                <div className="flex items-center gap-4 py-2">
                    <MasterCardIcon />
                    <span className="flex-grow">MyCard</span>
                </div>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-sm">
                <button className="flex items-center gap-4 w-full text-left">
                    <div className="p-1 border border-green-500 rounded-md">
                      <PlusIcon />
                    </div>
                    <span className="text-green-600 font-semibold">Добавить карту</span>
                </button>
            </div>
        </div>
        
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-4/5 text-center bg-brand-dark text-white p-3 rounded-lg shadow-lg">
           <p className="text-sm">Оплачивай наличными, картой или Google Pay</p>
        </div>
    </div>
  );
};

export default PaymentScreen;
