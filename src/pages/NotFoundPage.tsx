import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useI18n } from '../I18nContext';

const NotFoundPage: React.FC = () => {
    const { t } = useI18n();

    return (
        <div className="flex flex-col items-center justify-center text-center h-full py-16">
            <Icon icon="lucide:compass-off" className="h-24 w-24 text-tg-border mb-6" />
            <h1 className="text-4xl font-bold text-tg-text mb-2">404</h1>
            <h2 className="text-xl font-semibold text-tg-hint mb-6">Сторінку не знайдено</h2>
            <p className="max-w-sm mb-8 text-tg-hint">
                На жаль, ми не можемо знайти сторінку, яку ви шукаєте. Можливо, її було переміщено, видалено або її ніколи не існувало.
            </p>
            <Link 
                to="/" 
                className="bg-tg-button text-tg-button-text font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-colors"
            >
                Повернутися на головну
            </Link>
        </div>
    );
};

export default NotFoundPage;
