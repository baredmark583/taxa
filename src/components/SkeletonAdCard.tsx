import React from 'react';

const SkeletonAdCard: React.FC = () => {
  return (
    <div className="bg-tg-secondary-bg rounded-lg overflow-hidden shadow-lg">
      <div className="w-full h-48 bg-tg-secondary-bg-hover animate-pulse"></div>
      <div className="p-4">
        <div className="h-6 bg-tg-secondary-bg-hover rounded animate-pulse w-3/4 mb-2"></div>
        <div className="h-4 bg-tg-secondary-bg-hover rounded animate-pulse w-1/2 mb-4"></div>
        <div className="h-8 bg-tg-secondary-bg-hover rounded animate-pulse w-1/3"></div>
      </div>
    </div>
  );
};

export default SkeletonAdCard;