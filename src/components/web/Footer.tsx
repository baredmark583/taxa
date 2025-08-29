import React from 'react';
import { useI18n } from '../../I18nContext';

const Footer: React.FC = () => {
    const { t } = useI18n();
    return (
        <footer className="bg-tg-secondary-bg mt-8">
            <div className="container mx-auto py-6 px-4 lg:px-8 text-center text-tg-hint">
                <p>&copy; {new Date().getFullYear()} Taxa AI. {t('common.comingSoon')}</p>
            </div>
        </footer>
    );
};

export default Footer;
