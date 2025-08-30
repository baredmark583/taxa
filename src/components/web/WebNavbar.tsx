import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthUser, Page } from '../../types';
import { useI18n } from '../../I18nContext';
import { Icon } from '@iconify/react';
import { resolveImageUrl } from '../../utils/formatters';
import { useTheme } from '../../ThemeContext';

interface WebNavbarProps {
    navigateTo: (page: Page) => void;
    user: AuthUser | null;
    logout: () => void;
}

const ThemeSwitcher: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full text-muted-foreground dark:text-dark-muted-foreground hover:text-foreground dark:hover:text-dark-foreground hover:bg-accent dark:hover:bg-dark-accent transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <Icon icon={theme === 'dark' ? 'lucide:sun' : 'lucide:moon'} className="h-6 w-6" />
        </button>
    );
};


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
        <header className="bg-background/80 dark:bg-dark-background/80 backdrop-blur-md border-b border-border dark:border-dark-border sticky top-0 z-30">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex-shrink-0">
                        <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
                            <Icon icon="lucide:sparkles" className="text-primary dark:text-dark-primary"/>
                            <span>Taxa AI</span>
                        </Link>
                    </div>

                    <div className="hidden md:block w-full max-w-md">
                         <div className="relative">
                            <input
                                type="search"
                                placeholder={t('home.searchPlaceholder')}
                                className="w-full bg-muted dark:bg-dark-muted p-3 pl-10 rounded-full border border-border dark:border-dark-border focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:outline-none"
                            />
                            <Icon icon="lucide:search" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-dark-muted-foreground"/>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            to="/create"
                            className="hidden sm:flex items-center gap-2 bg-primary dark:bg-dark-primary text-primary-foreground dark:text-dark-primary-foreground font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                            <Icon icon="lucide:plus" />
                            <span>{t('header.create')}</span>
                        </Link>
                        
                        <ThemeSwitcher />

                        {user ? (
                            <div ref={profileRef} className="relative">
                                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="h-12 w-12 rounded-full overflow-hidden border-2 border-border dark:border-dark-border hover:border-primary dark:hover:border-dark-primary transition-colors">
                                    <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                                </button>
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-card dark:bg-dark-card rounded-md shadow-lg py-1 z-40 border border-border dark:border-dark-border">
                                        <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="block w-full text-left px-4 py-2 text-sm hover:bg-accent dark:hover:bg-dark-accent">{t('header.profile')}</Link>
                                        <Link to="/favorites" onClick={() => setIsProfileOpen(false)} className="block w-full text-left px-4 py-2 text-sm hover:bg-accent dark:hover:bg-dark-accent">{t('header.favorites')}</Link>
                                        <Link to="/chats" onClick={() => setIsProfileOpen(false)} className="block w-full text-left px-4 py-2 text-sm hover:bg-accent dark:hover:bg-dark-accent">{t('header.chats')}</Link>
                                        <div className="border-t border-border dark:border-dark-border my-1"></div>
                                        <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-accent dark:hover:bg-dark-accent">{t('common.logout')}</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/auth" className="font-bold hover:text-primary dark:hover:text-dark-primary transition-colors">
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