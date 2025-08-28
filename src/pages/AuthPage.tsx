import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import Spinner from '../components/Spinner';
import { Icon } from '@iconify/react';
import { useI18n } from '../I18nContext';

interface AuthPageProps {
    onAuthSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
    const { register, login, authError } = useAuth();
    const { t } = useI18n();
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    
    // IMPORTANT: Replace this with your actual bot's username
    const botUsername = "taxaAIbot";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFormError(null);
        try {
            if (isLoginView) {
                await login({ email, password });
            } else {
                await register({ email, password, name });
            }
            onAuthSuccess();
        } catch (error: any) {
            setFormError(error.response?.data?.message || t('errors.unexpectedError'));
        } finally {
            setIsLoading(false);
        }
    };

    const isTgBrowser = (window as any).Telegram?.WebApp?.platform !== 'unknown' && (window as any).Telegram?.WebApp?.platform !== undefined;

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-4 animate-modal-fade-in">
            <div className="w-full max-w-md p-8 space-y-6 bg-tg-secondary-bg rounded-lg shadow-xl">
                {isTgBrowser ? (
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                           <Icon icon="mdi:telegram" className="w-12 h-12 text-[#29B6F6]" />
                        </div>
                        <h2 className="text-2xl font-bold text-tg-text">
                            {t('auth.welcome')}
                        </h2>
                        <p className="text-tg-hint mt-2">
                           {t('auth.tgLoginProblem')}
                        </p>
                        {authError && (
                            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg my-4 text-left" role="alert">
                                <p className="font-bold">{t('auth.authErrorTitle')}</p>
                                <p className="text-sm">{authError}</p>
                            </div>
                        )}
                        <p className="text-tg-hint text-sm mt-4">
                           {t('auth.tgLoginSuggestion')}
                        </p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-tg-text text-center">
                            {isLoginView ? t('auth.loginTitle') : t('auth.registerTitle')}
                        </h2>
                       
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLoginView && (
                                <input
                                    type="text"
                                    placeholder={t('auth.namePlaceholder')}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full bg-tg-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
                                />
                            )}
                            <input
                                type="email"
                                placeholder={t('auth.emailPlaceholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-tg-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
                            />
                            <input
                                type="password"
                                placeholder={t('auth.passwordPlaceholder')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-tg-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
                            />
                             {(formError || authError) && (
                                <p className="text-red-400 text-sm text-center">{formError || authError}</p>
                            )}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center px-4 py-3 font-semibold text-tg-button-text bg-tg-button rounded-md hover:bg-opacity-90 transition-transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Spinner size="sm" /> : (isLoginView ? t('auth.loginButton') : t('auth.registerButton'))}
                            </button>
                        </form>
                        <p className="text-sm text-tg-hint text-center">
                            {isLoginView ? t('auth.noAccount') : t('auth.hasAccount')}
                            <button onClick={() => { setIsLoginView(!isLoginView); setFormError(null); }} className="font-semibold text-tg-link hover:underline ml-1">
                                {isLoginView ? t('auth.signUp') : t('auth.signIn')}
                            </button>
                        </p>
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-tg-border"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-tg-secondary-bg text-tg-hint">{t('common.or')}</span>
                            </div>
                        </div>
                        <a
                            href={`https://t.me/${botUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center px-4 py-3 font-semibold text-tg-button-text bg-[#29B6F6] rounded-md hover:bg-opacity-90 transition-transform hover:scale-105"
                        >
                           <Icon icon="mdi:telegram" className="w-6 h-6" /> <span className="ml-2">{t('auth.loginWithTelegram')}</span>
                        </a>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthPage;