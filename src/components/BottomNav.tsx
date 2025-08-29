import React from 'react';
import { Page } from '../types';
import { Icon } from '@iconify/react';

interface BottomNavProps {
    currentPage: Page;
    navigateTo: (page: Page) => void;
    unreadMessagesCount: number;
}

const NavItem: React.FC<{
    page: Page;
    icon: string;
    currentPage: Page;
    navigateTo: (page: Page) => void;
    isPrimary?: boolean;
    badgeCount?: number;
}> = ({ page, icon, currentPage, navigateTo, isPrimary = false, badgeCount = 0 }) => {
    
    // Treat chatThread as being on the chats tab for highlighting
    const isActive = currentPage === page || (page === 'chats' && currentPage === 'chatThread');

    if (isPrimary) {
        return (
             <button
                onClick={() => navigateTo(page)}
                className="bg-tg-button text-tg-button-text h-16 w-16 rounded-full shadow-lg flex items-center justify-center -mt-8 border-4 border-tg-bg"
            >
                <Icon icon={icon} className="h-8 w-8" />
            </button>
        )
    }

    return (
        <button onClick={() => navigateTo(page)} className={`flex flex-col items-center justify-center gap-1 w-full transition-colors relative ${isActive ? 'text-tg-link' : 'text-tg-hint'}`}>
            <Icon icon={icon} className="h-6 w-6" />
            {badgeCount > 0 && (
                <span className="absolute top-0 right-1/4 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {badgeCount > 9 ? '9+' : badgeCount}
                </span>
            )}
        </button>
    )
}


const BottomNav: React.FC<BottomNavProps> = ({ currentPage, navigateTo, unreadMessagesCount }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-tg-secondary-bg/90 backdrop-blur-md border-t border-tg-border z-20">
            <div className="flex justify-around items-center h-full max-w-md mx-auto">
                <NavItem page="home" icon="lucide:home" currentPage={currentPage} navigateTo={navigateTo} />
                <NavItem page="favorites" icon="lucide:heart" currentPage={currentPage} navigateTo={navigateTo} />
                <NavItem page="create" icon="lucide:plus" currentPage={currentPage} navigateTo={navigateTo} isPrimary />
                <NavItem page="chats" icon="lucide:message-square" currentPage={currentPage} navigateTo={navigateTo} badgeCount={unreadMessagesCount} />
                <NavItem page="profile" icon="lucide:user-round" currentPage={currentPage} navigateTo={navigateTo} />
            </div>
        </nav>
    );
};

export default BottomNav;
