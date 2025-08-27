import React, { useState, useEffect, useCallback } from 'react';
import { getAdminUsers, deleteAdminUser, getAdminAds, deleteAdminAd } from '../apiClient';
import { AdminUser, AdminAd } from '../types';
import Spinner from '../components/Spinner';

type AdminView = 'users' | 'ads';

interface AdminPageProps {
    showToast: (message: string) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ showToast }) => {
    const [view, setView] = useState<AdminView>('users');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [ads, setAds] = useState<AdminAd[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (view === 'users') {
                const res = await getAdminUsers();
                setUsers(res.data);
            } else {
                const res = await getAdminAds();
                setAds(res.data);
            }
        } catch (err) {
            setError('Failed to fetch data.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [view]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteUser = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this user? This is irreversible.')) {
            try {
                await deleteAdminUser(id);
                setUsers(prev => prev.filter(u => u.id !== id));
                showToast('User deleted successfully.');
            } catch (err: any) {
                showToast(err.response?.data?.message || 'Failed to delete user.');
            }
        }
    };

    const handleDeleteAd = async (id: string) => {
         if (window.confirm('Are you sure you want to delete this ad?')) {
            try {
                await deleteAdminAd(id);
                setAds(prev => prev.filter(a => a.id !== id));
                showToast('Ad deleted successfully.');
            } catch (err: any) {
                showToast(err.response?.data?.message || 'Failed to delete ad.');
            }
        }
    };

    return (
        <div className="bg-tg-secondary-bg p-4 rounded-lg">
            <div className="flex border-b border-tg-border mb-4">
                <button 
                    onClick={() => setView('users')}
                    className={`px-4 py-2 font-semibold ${view === 'users' ? 'text-tg-link border-b-2 border-tg-link' : 'text-tg-hint'}`}
                >
                    Користувачі
                </button>
                 <button 
                    onClick={() => setView('ads')}
                    className={`px-4 py-2 font-semibold ${view === 'ads' ? 'text-tg-link border-b-2 border-tg-link' : 'text-tg-hint'}`}
                >
                    Оголошення
                </button>
            </div>

            {isLoading && <div className="flex justify-center p-8"><Spinner /></div>}
            {error && <p className="text-red-400 text-center">{error}</p>}

            {!isLoading && !error && (
                <div className="overflow-x-auto">
                    {view === 'users' && (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-tg-border">
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Email</th>
                                    <th className="p-2">Role</th>
                                    <th className="p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b border-tg-border hover:bg-tg-secondary-bg-hover">
                                        <td className="p-2">{user.name}</td>
                                        <td className="p-2">{user.email}</td>
                                        <td className="p-2">{user.role}</td>
                                        <td className="p-2">
                                            <button onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-600">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                     {view === 'ads' && (
                        <table className="w-full text-left text-sm">
                            <thead>
                                 <tr className="border-b border-tg-border">
                                    <th className="p-2">Title</th>
                                    <th className="p-2">Seller</th>
                                    <th className="p-2">Price</th>
                                    <th className="p-2">Status</th>
                                    <th className="p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ads.map(ad => (
                                    <tr key={ad.id} className="border-b border-tg-border hover:bg-tg-secondary-bg-hover">
                                        <td className="p-2 truncate max-w-xs">{ad.title}</td>
                                        <td className="p-2">{ad.sellerName}</td>
                                        <td className="p-2">{ad.price}</td>
                                        <td className="p-2">{ad.status}</td>
                                        <td className="p-2">
                                            <button onClick={() => handleDeleteAd(ad.id)} className="text-red-400 hover:text-red-600">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminPage;
