import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthUser, Page } from '../../types';
import { useI18n } from '../../I18nContext';
import { Icon } from '@iconify/react';
import { resolveImageUrl } from '../../utils/formatters';

interface WebNavbarProps {
    navigateTo: (page: Page) => void;
    user: AuthUser | null;
    logout: () => void;
}

const WebNavbar: React.FC<WebNavbarProps> = ({ navigateTo, user, logout }) => {
    const { t } = useI18n();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const userAvatar = resolveImageUrl(user?.avatarUrl || `https://i.pravatar.cc/150?u=${user?.id || 'default'}`);

    return (
        <header className="bg-tg-secondary-bg/90 backdrop-blur-md shadow-lg sticky top-0 z-30">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex-shrink-0">
                        <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
                            <Icon icon="lucide:sparkles" className="text-tg-link"/>
                            <span>Taxa AI</span>
                        </Link>
                    </div>

                    <div className="hidden md:block w-full max-w-md">
                         <div className="relative">
                            <input
                                type="search"
                                placeholder={t('home.searchPlaceholder')}
                                className="w-full bg-tg-bg p-3 pl-10 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
                            />
                            <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-tg-hint"/>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            to="/create"
                            className="hidden sm:flex items-center gap-2 bg-tg-button text-tg-button-text font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                            <Icon icon="lucide:plus" />
                            <span>{t('header.create')}</span>
                        </Link>
                        
                        {user ? (
                            <div ref={profileRef} className="relative">
                                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="h-12 w-12 rounded-full overflow-hidden border-2 border-tg-border hover:border-tg-link transition-colors">
                                    <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                                </button>
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-tg-secondary-bg-hover rounded-md shadow-lg py-1 z-40">
                                        <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="block w-full text-left px-4 py-2 text-sm hover:bg-tg-bg">{t('header.profile')}</Link>
                                        <Link to="/favorites" onClick={() => setIsProfileOpen(false)} className="block w-full text-left px-4 py-2 text-sm hover:bg-tg-bg">{t('header.favorites')}</Link>
                                        <Link to="/chats" onClick={() => setIsProfileOpen(false)} className="block w-full text-left px-4 py-2 text-sm hover:bg-tg-bg">{t('header.chats')}</Link>
                                        <div className="border-t border-tg-border my-1"></div>
                                        <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-tg-bg">{t('common.logout')}</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/auth" className="font-bold hover:text-tg-link transition-colors">
                                {t('auth.loginTitle')}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default WebNavbar;