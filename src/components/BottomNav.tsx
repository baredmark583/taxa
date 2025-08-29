import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Page } from '../types';
import { Icon } from '@iconify/react';

interface BottomNavProps {
    currentPage: Page;
    navigateTo: (page: Page) => void;
    unreadMessagesCount: number;
}

const NavItem: React.FC<{
    page: Page;
    path: string;
    icon: string;
    isPrimary?: boolean;
    badgeCount?: number;
}> = ({ page, path, icon, isPrimary = false, badgeCount = 0 }) => {
    
    const location = useLocation();
    const isActive = location.pathname === path || (path === '/chats' && location.pathname.startsWith('/chats'));

    const content = (
        <>
            <Icon icon={icon} className={isPrimary ? "h-8 w-8" : "h-6 w-6"} />
            {badgeCount > 0 && (
                <span className="absolute top-0 right-1/4 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {badgeCount > 9 ? '9+' : badgeCount}
                </span>
            )}
        </>
    );
    
    if (isPrimary) {
        return (
             <Link to={path} className="bg-tg-button text-tg-button-text h-16 w-16 rounded-full shadow-lg flex items-center justify-center -mt-8 border-4 border-tg-bg">
                {content}
            </Link>
        )
    }

    return (
        <Link to={path} className={`flex flex-col items-center justify-center gap-1 w-full transition-colors relative ${isActive ? 'text-tg-link' : 'text-tg-hint'}`}>
            {content}
        </Link>
    )
}


const BottomNav: React.FC<BottomNavProps> = ({ unreadMessagesCount }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-tg-secondary-bg/90 backdrop-blur-md border-t border-tg-border z-20">
            <div className="flex justify-around items-center h-full max-w-md mx-auto">
                <NavItem page="home" path="/" icon="lucide:home" />
                <NavItem page="favorites" path="/favorites" icon="lucide:heart" />
                <NavItem page="create" path="/create" icon="lucide:plus" isPrimary />
                <NavItem page="chats" path="/chats" icon="lucide:message-square" badgeCount={unreadMessagesCount} />
                <NavItem page="profile" path="/profile" icon="lucide:user-round" />
            </div>
        </nav>
    );
};

export default BottomNav;