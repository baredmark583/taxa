import React from 'react';
import { AdminStats } from '../../types';
import { Icon } from '@iconify/react';

interface DashboardViewProps {
    stats: AdminStats;
}

const StatCard: React.FC<{ title: string; value: number | string; icon: string }> = ({ title, value, icon }) => (
    <div className="bg-tg-secondary-bg-hover p-6 rounded-lg flex items-center space-x-4">
        <div className="bg-tg-bg p-3 rounded-full">
             <Icon icon={icon} className="h-8 w-8 text-tg-link" />
        </div>
        <div>
            <p className="text-tg-hint text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-tg-text">{value}</p>
        </div>
    </div>
);


const DashboardView: React.FC<DashboardViewProps> = ({ stats }) => {
    return (
        <div className="p-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Всього користувачів" value={stats.totalUsers} icon="lucide:users" />
                <StatCard title="Всього оголошень" value={stats.totalAds} icon="lucide:layout-list" />
                <StatCard title="Продано товарів" value={stats.soldAds} icon="lucide:package-check" />
                <StatCard title="Заблоковано" value={stats.bannedUsers} icon="lucide:user-x" />
                <StatCard title="Всього бонусів" value={stats.totalBonuses} icon="lucide:star" />
            </div>

            <div>
                <h2 className="text-xl font-bold text-tg-text mb-4">Оголошення за категоріями</h2>
                <div className="bg-tg-secondary-bg-hover p-4 rounded-lg">
                    {stats.adsByCategory.length > 0 ? (
                        <ul className="space-y-3">
                            {stats.adsByCategory.map(({ category, count }) => (
                                <li key={category} className="flex justify-between items-center text-tg-text">
                                    <span>{category}</span>
                                    <span className="font-bold bg-tg-bg px-3 py-1 rounded-full text-sm">{count}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-tg-hint text-center py-4">Немає оголошень для відображення статистики.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardView;