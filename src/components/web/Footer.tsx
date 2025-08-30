import React from 'react';
import { useI18n } from '../../I18nContext';

const Footer: React.FC = () => {
    const { t } = useI18n();
    return (
        <footer className="bg-card dark:bg-dark-card border-t border-border dark:border-dark-border mt-12">
            <div className="container mx-auto py-8 px-4 lg:px-8 text-center text-muted-foreground dark:text-dark-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Taxa AI. {t('common.comingSoon')}</p>
            </div>
        </footer>
    );
};

export default Footer;