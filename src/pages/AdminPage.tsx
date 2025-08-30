import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAdminUsers, deleteAdminUser, getAdminAds, deleteAdminAd, getAdminStats, getAdminAnalytics, updateAdminUser, updateAdminAd } from '../apiClient';
import { AdminUser, AdminAd, AdminStats, AnalyticsData, UserStatus, UserRole, AdStatus } from '../types';
import Spinner from '../components/Spinner';
import UserMap from './UserMap';
import DashboardView from './admin/DashboardView';
import AnalyticsView from './admin/AnalyticsView';
import SettingsView from './admin/SettingsView';
import CategoriesView from './admin/CategoriesView';
import AutomationView from './admin/AutomationView'; // Импортируем новый компонент
import { Icon } from '@iconify/react';

type AdminView = 'dashboard' | 'users' | 'ads' | 'map' | 'analytics' | 'settings' | 'categories' | 'automation';

interface AdminPageProps {
    showToast: (message: string) => void;
}

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-modal-fade-in" onClick={onClose}>
            <div className="bg-tg-secondary-bg rounded-lg shadow-xl w-full max-w-lg animate-modal-slide-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-tg-border">
                    <h3 className="text-lg font-bold">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-tg-secondary-bg-hover">
                        <Icon icon="lucide:x" className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
};


const AdminPage: React.FC<AdminPageProps> = ({ showToast }) => {
    const [view, setView] = useState<AdminView>('dashboard');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [ads, setAds] = useState<AdminAd[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [userSearch, setUserSearch] = useState('');
    const [adSearch, setAdSearch] = useState('');
    const [adStatusFilter, setAdStatusFilter] = useState('all');
    
    // State for modals
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [editingAd, setEditingAd] = useState<AdminAd | null>(null);

    const fetchData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoading(true);
        setError(null);
        try {
            const [statsRes, usersRes, adsRes, analyticsRes] = await Promise.all([
                getAdminStats(),
                getAdminUsers(),
                getAdminAds(),
                getAdminAnalytics()
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
            setAds(adsRes.data);
            setAnalytics(analyticsRes.data);
        } catch (err) {
            setError('Failed to fetch admin data.');
            console.error(err);
        } finally {
            if (showLoadingSpinner) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdateUser = async (userToUpdate: AdminUser) => {
        try {
            const updatedUser = await updateAdminUser(userToUpdate.id, {
                name: userToUpdate.name,
                role: userToUpdate.role,
                status: userToUpdate.status,
            });
            setUsers(prev => prev.map(u => u.id === updatedUser.data.id ? updatedUser.data : u));
            showToast('User updated successfully.');
            setEditingUser(null);
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to update user.');
        }
    };

    const handleUpdateAd = async (adToUpdate: AdminAd) => {
        try {
            const updatedAd = await updateAdminAd(adToUpdate.id, {
                title: adToUpdate.title,
                description: adToUpdate.description,
                price: adToUpdate.price,
                status: adToUpdate.status,
                isBoosted: adToUpdate.isBoosted,
            });
            setAds(prev => prev.map(a => a.id === updatedAd.data.id ? updatedAd.data : a));
            showToast('Ad updated successfully.');
            setEditingAd(null);
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to update ad.');
        }
    };
    
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
    
    const filteredUsers = useMemo(() => {
        if (!userSearch) return users;
        return users.filter(user =>
            user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
            (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase()))
        );
    }, [users, userSearch]);

    const filteredAds = useMemo(() => {
        return ads.filter(ad => {
            const matchesSearch = ad.title.toLowerCase().includes(adSearch.toLowerCase());
            const matchesStatus = adStatusFilter === 'all' || ad.status === adStatusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [ads, adSearch, adStatusFilter]);

    const renderContent = () => {
        if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>;
        if (error) return <p className="text-red-400 text-center">{error}</p>;

        switch (view) {
            case 'dashboard':
                return stats ? <DashboardView stats={stats} /> : null;
            case 'analytics':
                return analytics ? <AnalyticsView analyticsData={analytics} /> : null;
            case 'categories':
                return <CategoriesView showToast={showToast} />;
            case 'automation':
                return <AutomationView />;
            case 'settings':
                return <SettingsView showToast={showToast} />;
            case 'users':
                return (
                    <div>
                        <input
                            type="text" placeholder="Пошук за ім'ям або email..." value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full bg-tg-bg p-2 mb-4 rounded-lg border border-tg-border" />
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-tg-border"><tr >
                                    <th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Status</th><th className="p-2">Role</th><th className="p-2">Actions</th>
                                </tr></thead>
                                <tbody>
                                    {filteredUsers.map(user => (<tr key={user.id} className="border-b border-tg-border hover:bg-tg-secondary-bg-hover">
                                        <td className="p-2">{user.name}</td><td className="p-2">{user.email}</td>
                                        <td className="p-2"><span className={`px-2 py-1 text-xs rounded-full ${user.status === 'active' ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>{user.status}</span></td>
                                        <td className="p-2">{user.role}</td>
                                        <td className="p-2 space-x-2">
                                            <button onClick={() => setEditingUser(user)} className="text-blue-400 hover:text-blue-600">Edit</button>
                                            <button onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-600">Delete</button>
                                        </td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>);
            case 'ads':
                return (
                    <div>
                         <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <input type="text" placeholder="Пошук за назвою..." value={adSearch} onChange={(e) => setAdSearch(e.target.value)} className="w-full bg-tg-bg p-2 rounded-lg border border-tg-border" />
                            <select value={adStatusFilter} onChange={(e) => setAdStatusFilter(e.target.value)} className="w-full sm:w-auto bg-tg-bg p-2 rounded-lg border border-tg-border">
                                <option value="all">Всі статуси</option><option value="active">Active</option><option value="reserved">Reserved</option><option value="sold">Sold</option><option value="archived">Archived</option>
                            </select>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-tg-border"><tr>
                                    <th className="p-2">Boost</th><th className="p-2">Title</th><th className="p-2">Seller</th><th className="p-2">Price</th><th className="p-2">Status</th><th className="p-2">Actions</th>
                                </tr></thead>
                                <tbody>
                                    {filteredAds.map(ad => (<tr key={ad.id} className="border-b border-tg-border hover:bg-tg-secondary-bg-hover">
                                        <td className="p-2 text-center">{ad.isBoosted && <Icon icon="lucide:flame" className="text-orange-400" />}</td>
                                        <td className="p-2 truncate max-w-xs">{ad.title}</td><td className="p-2">{ad.sellerName}</td><td className="p-2">{ad.price}</td><td className="p-2">{ad.status}</td>
                                        <td className="p-2 space-x-2">
                                            <button onClick={() => setEditingAd(ad)} className="text-blue-400 hover:text-blue-600">Edit</button>
                                            <button onClick={() => handleDeleteAd(ad.id)} className="text-red-400 hover:text-red-600">Delete</button>
                                        </td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>);
            case 'map': return <UserMap users={users} />;
            default: return null;
        }
    };

    return (
        <div className="bg-tg-secondary-bg p-4 rounded-lg">
            <div className="flex justify-between items-center border-b border-tg-border mb-4">
                <div className="flex overflow-x-auto">
                     <button onClick={() => setView('dashboard')} className={`px-4 py-2 font-semibold whitespace-nowrap ${view === 'dashboard' ? 'text-tg-link border-b-2 border-tg-link' : 'text-tg-hint'}`}>Dashboard</button>
                     <button onClick={() => setView('analytics')} className={`px-4 py-2 font-semibold whitespace-nowrap ${view === 'analytics' ? 'text-tg-link border-b-2 border-tg-link' : 'text-tg-hint'}`}>Аналітика</button>
                     <button onClick={() => setView('categories')} className={`px-4 py-2 font-semibold whitespace-nowrap ${view === 'categories' ? 'text-tg-link border-b-2 border-tg-link' : 'text-tg-hint'}`}>Категорії</button>
                     <button onClick={() => setView('automation')} className={`px-4 py-2 font-semibold whitespace-nowrap ${view === 'automation' ? 'text-tg-link border-b-2 border-tg-link' : 'text-tg-hint'}`}>Автоматизація</button>
                    <button onClick={() => setView('users')} className={`px-4 py-2 font-semibold whitespace-nowrap ${view === 'users' ? 'text-tg-link border-b-2 border-tg-link' : 'text-tg-hint'}`}>Користувачі</button>
                     <button onClick={() => setView('ads')} className={`px-4 py-2 font-semibold whitespace-nowrap ${view === 'ads' ? 'text-tg-link border-b-2 border-tg-link' : 'text-tg-hint'}`}>Оголошення</button>
                     <button onClick={() => setView('map')} className={`px-4 py-2 font-semibold whitespace-nowrap ${view === 'map' ? 'text-tg-link border-b-2 border-tg-link' : 'text-tg-hint'}`}>Карта</button>
                     <button onClick={() => setView('settings')} className={`px-4 py-2 font-semibold whitespace-nowrap ${view === 'settings' ? 'text-tg-link border-b-2 border-tg-link' : 'text-tg-hint'}`}>Налаштування</button>
                </div>
                 <button onClick={() => fetchData(false)} className="p-2 rounded-full hover:bg-tg-secondary-bg-hover" title="Refresh Data"><Icon icon="lucide:refresh-cw" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} /></button>
            </div>
            
            {renderContent()}

            <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title={`Edit User: ${editingUser?.name}`}>
                {editingUser && <UserEditForm user={editingUser} onSave={handleUpdateUser} onCancel={() => setEditingUser(null)} />}
            </Modal>
             <Modal isOpen={!!editingAd} onClose={() => setEditingAd(null)} title={`Edit Ad: ${editingAd?.title}`}>
                {editingAd && <AdEditForm ad={editingAd} onSave={handleUpdateAd} onCancel={() => setEditingAd(null)} />}
            </Modal>
        </div>
    );
};

const UserEditForm: React.FC<{user: AdminUser, onSave: (user: AdminUser) => void, onCancel: () => void}> = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState(user);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    return (<form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
        <div><label className="block text-sm font-medium text-tg-hint">Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-tg-bg p-2 mt-1 rounded-lg border border-tg-border" /></div>
        <div><label className="block text-sm font-medium text-tg-hint">Role</label><select name="role" value={formData.role} onChange={handleChange} className="w-full bg-tg-bg p-2 mt-1 rounded-lg border border-tg-border"><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></div>
        <div><label className="block text-sm font-medium text-tg-hint">Status</label><select name="status" value={formData.status} onChange={handleChange} className="w-full bg-tg-bg p-2 mt-1 rounded-lg border border-tg-border"><option value="active">active</option><option value="banned">banned</option></select></div>
        <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={onCancel} className="px-4 py-2 bg-tg-secondary-bg-hover rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-tg-button text-tg-button-text rounded-lg">Save</button></div>
    </form>);
};

const AdEditForm: React.FC<{ad: AdminAd, onSave: (ad: AdminAd) => void, onCancel: () => void}> = ({ ad, onSave, onCancel }) => {
    const [formData, setFormData] = useState(ad);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setFormData(prev => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
    };
    return (<form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
        <div><label className="block text-sm font-medium text-tg-hint">Title</label><input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-tg-bg p-2 mt-1 rounded-lg border border-tg-border" /></div>
        <div><label className="block text-sm font-medium text-tg-hint">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full bg-tg-bg p-2 mt-1 rounded-lg border border-tg-border" /></div>
        <div><label className="block text-sm font-medium text-tg-hint">Price</label><input type="text" name="price" value={formData.price} onChange={handleChange} className="w-full bg-tg-bg p-2 mt-1 rounded-lg border border-tg-border" /></div>
        <div><label className="block text-sm font-medium text-tg-hint">Status</label><select name="status" value={formData.status} onChange={handleChange} className="w-full bg-tg-bg p-2 mt-1 rounded-lg border border-tg-border"><option value="active">active</option><option value="reserved">reserved</option><option value="sold">sold</option><option value="archived">archived</option></select></div>
        <div className="flex items-center"><input type="checkbox" name="isBoosted" id="isBoosted" checked={formData.isBoosted} onChange={handleChange} className="h-4 w-4 rounded border-tg-border bg-tg-bg text-tg-link focus:ring-tg-link" /><label htmlFor="isBoosted" className="ml-2 block text-sm text-tg-text">Boost Ad</label></div>
        <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={onCancel} className="px-4 py-2 bg-tg-secondary-bg-hover rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-tg-button text-tg-button-text rounded-lg">Save</button></div>
    </form>);
};

export default AdminPage;