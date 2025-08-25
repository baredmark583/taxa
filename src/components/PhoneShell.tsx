

import React from 'react';

interface PhoneShellProps {
  children: React.ReactNode;
}

const PhoneShell: React.FC<PhoneShellProps> = ({ children }) => {
  return (
    <div className="w-[375px] h-[812px] bg-white rounded-[40px] shadow-2xl overflow-hidden relative border-8 border-gray-800">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-800 rounded-b-xl z-20 flex items-center justify-center">
        <div className="w-12 h-1.5 bg-gray-600 rounded-full"></div>
      </div>
      <div className="w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default PhoneShell;