import React from 'react';
import { useI18n } from '../../I18nContext';
import { RegionStat } from '../../types';
import InteractiveMap from './InteractiveMap';

interface SidebarProps {
    categories: string[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
    stats: RegionStat[];
    onRegionSelect: (region: string | null) => void;
    selectedRegion: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ categories, selectedCategory, onSelectCategory, stats, onRegionSelect, selectedRegion }) => {
    const { t } = useI18n();
    return (
        <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-28 bg-card dark:bg-dark-card p-6 rounded-2xl space-y-8">
                <div>
                    <h3 className="text-lg font-bold mb-4 text-card-foreground dark:text-dark-card-foreground">
                        Пошук за регіоном
                    </h3>
                    <InteractiveMap stats={stats} onRegionSelect={onRegionSelect} />
                    {selectedRegion && (
                        <div className="text-center mt-2">
                            <button onClick={() => onRegionSelect(null)} className="text-xs text-primary dark:text-dark-primary hover:underline">
                                Скинути фільтр ({selectedRegion})
                            </button>
                        </div>
                    )}
                </div>

                <div className="border-t border-border dark:border-dark-border pt-8">
                    <h3 className="text-lg font-bold mb-4 text-card-foreground dark:text-dark-card-foreground">{t('adDetail.category')}</h3>
                    <ul className="space-y-1">
                        {categories.map(category => (
                            <li key={category}>
                                <button
                                    onClick={() => onSelectCategory(category)}
                                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-base ${
                                        selectedCategory === category
                                        ? 'bg-primary dark:bg-dark-primary text-primary-foreground dark:text-dark-primary-foreground font-semibold'
                                        : 'hover:bg-accent dark:hover:bg-dark-accent text-muted-foreground dark:text-dark-muted-foreground hover:text-accent-foreground dark:hover:text-dark-accent-foreground'
                                    }`}
                                >
                                    {category}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border-t border-border dark:border-dark-border pt-8">
                     <h3 className="text-lg font-bold mb-4 text-card-foreground dark:text-dark-card-foreground">{t('common.comingSoon')}</h3>
                     <p className="text-muted-foreground dark:text-dark-muted-foreground text-sm">Більше фільтрів, таких як діапазон цін, будуть додані тут незабаром.</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
