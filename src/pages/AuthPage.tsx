import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import Spinner from '../components/Spinner';
import { Icon } from '@iconify/react';
import { useI18n } from '../I18nContext';

interface AuthPageProps {
    onAuthSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
    const { login, register, redeemCode, authError } = useAuth();
    const { t } = useI18n();
    
    // State for Admin login
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    
    // State for User one-time code login
    const [webCode, setWebCode] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    
    // This determines if we are on the /taxaadmin.html page.
    const isAdminRoute = window.location.pathname.startsWith('/taxaadmin');

    const handleAdminSubmit = async (e: React.FormEvent) => {
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
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleWebCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFormError(null);
        try {
            await redeemCode(webCode.toUpperCase());
            onAuthSuccess();
        } catch (err: any) {
            setFormError(err.response?.data?.message || t('auth.invalidCode'));
        } finally {
            setIsLoading(false);
        }
    };
    
    const AdminForm = () => (
        <div className="max-w-sm mx-auto mt-8 p-6 bg-tg-secondary-bg rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold text-center mb-6">{isLoginView ? t('auth.loginTitle') : t('auth.registerTitle')}</h2>
            <form onSubmit={handleAdminSubmit} className="space-y-4">
                {!isLoginView && (
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth.namePlaceholder')} required className="w-full bg-tg-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"/>
                )}
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} required className="w-full bg-tg-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"/>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} required className="w-full bg-tg-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"/>
                
                {formError && <p className="text-red-400 text-sm text-center">{formError}</p>}
                
                <button type="submit" disabled={isLoading} className="w-full bg-tg-button text-tg-button-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center">
                    {isLoading ? <Spinner size="sm" /> : (isLoginView ? t('auth.loginButton') : t('auth.registerButton'))}
                </button>
            </form>
            <p className="text-center text-sm text-tg-hint mt-4">
                {isLoginView ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
                <button onClick={() => setIsLoginView(!isLoginView)} className="text-tg-link font-semibold hover:underline">
                    {isLoginView ? t('auth.signUp') : t('auth.signIn')}
                </button>
            </p>
        </div>
    );
    
    const WebLoginForm = () => (
         <div className="max-w-sm mx-auto mt-8 p-6 bg-tg-secondary-bg rounded-lg shadow-xl text-center">
             <Icon icon="lucide:key-round" className="h-12 w-12 text-tg-link mx-auto mb-4" />
             <h2 className="text-2xl font-bold mb-2">{t('auth.webLoginTitle')}</h2>
             <p className="text-tg-hint text-sm mb-6">{t('auth.webLoginInstructions')}</p>
             <form onSubmit={handleWebCodeSubmit} className="space-y-4">
                 <input
                     type="text"
                     value={webCode}
                     onChange={(e) => setWebCode(e.target.value)}
                     placeholder={t('auth.codePlaceholder')}
                     required
                     className="w-full bg-tg-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none text-center text-lg tracking-widest font-mono uppercase"
                     maxLength={6}
                 />

                {(formError || authError) && <p className="text-red-400 text-sm text-center">{formError || authError}</p>}

                <button type="submit" disabled={isLoading} className="w-full bg-tg-button text-tg-button-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center">
                     {isLoading ? <Spinner size="sm" /> : t('auth.submitCodeButton')}
                 </button>
             </form>
         </div>
    );

    return isAdminRoute ? <AdminForm /> : <WebLoginForm />;
};

export default AuthPage;
