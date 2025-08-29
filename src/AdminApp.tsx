import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import Spinner from './components/Spinner';
import Toast from './components/Toast';

const AdminApp: React.FC = () => {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (message: string) => {
        setToastMessage(message);
    };

    const handleAuthSuccess = () => {
        // The page will re-render automatically due to user state change
        showToast("Успішний вхід!");
    };

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }
    
    // If user is authenticated and is an ADMIN, show the admin panel.
    if (user && user.role === 'ADMIN') {
        return (
            <div className="min-h-screen bg-tg-bg p-4">
                 <AdminPage showToast={showToast} />
                 {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
            </div>
        )
    }

    // Otherwise, show the authentication page.
    return (
        <>
            <AuthPage onAuthSuccess={handleAuthSuccess} />
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
        </>
    );
};

export default AdminApp;
