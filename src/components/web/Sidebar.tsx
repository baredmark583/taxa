import React from 'react';
import { useI18n } from '../../I18nContext';

interface SidebarProps {
    categories: string[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ categories, selectedCategory, onSelectCategory }) => {
    const { t } = useI18n();
    return (
        <aside className="w-64 flex-shrink-0 hidden lg:block pr-8">
            <div className="sticky top-28">
                <h3 className="text-lg font-bold mb-4">{t('adDetail.category')}</h3>
                <ul className="space-y-2">
                    {categories.map(category => (
                        <li key={category}>
                            <button
                                onClick={() => onSelectCategory(category)}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-base ${
                                    selectedCategory === category
                                    ? 'bg-tg-secondary-bg-hover font-semibold text-tg-text'
                                    : 'hover:bg-tg-secondary-bg-hover text-tg-hint'
                                }`}
                            >
                                {category}
                            </button>
                        </li>
                    ))}
                </ul>
                <div className="mt-8 border-t border-tg-border pt-6">
                     <h3 className="text-lg font-bold mb-4">{t('common.comingSoon')}</h3>
                     <p className="text-tg-hint text-sm">Більше фільтрів, таких як діапазон цін та місцезнаходження, будуть додані тут незабаром.</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
