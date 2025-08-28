import React, { useState, useEffect } from 'react';
import { getAdminSettings, updateAdminSettings } from '../../apiClient';
import { StorageSettings } from '../../types';
import Spinner from '../../components/Spinner';

interface SettingsViewProps {
    showToast: (message: string) => void;
}

const InputField: React.FC<{ label: string; name: keyof StorageSettings; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string, placeholder?: string }> = 
    ({ label, name, value, onChange, type = 'text', placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-tg-hint">{label}</label>
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-tg-bg p-2 mt-1 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
        />
    </div>
);

const SettingsView: React.FC<SettingsViewProps> = ({ showToast }) => {
    const [settings, setSettings] = useState<Partial<StorageSettings> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await getAdminSettings();
                setSettings(data);
            } catch (error) {
                console.error("Failed to fetch settings:", error);
                showToast("Не вдалося завантажити налаштування.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [showToast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            await updateAdminSettings(settings);
            showToast("Налаштування успішно збережено!");
        } catch (error) {
            console.error("Failed to save settings:", error);
            showToast("Помилка при збереженні налаштувань.");
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center p-8"><Spinner /></div>;
    }

    if (!settings) {
        return <p className="text-red-400 text-center">Не вдалося завантажити налаштування.</p>;
    }

    return (
        <div className="p-4 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-tg-text">Налаштування сховища файлів</h2>
            
            <div className="bg-tg-secondary-bg-hover p-4 rounded-lg space-y-4">
                <div>
                    <label htmlFor="storage_provider" className="block text-sm font-medium text-tg-hint">Провайдер</label>
                    <select
                        id="storage_provider"
                        name="storage_provider"
                        value={settings.storage_provider || 'local'}
                        onChange={handleChange}
                        className="w-full bg-tg-bg p-2 mt-1 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
                    >
                        <option value="local">Локальний сервер</option>
                        <option value="s3">Amazon S3</option>
                        <option value="gcs">Google Cloud Storage</option>
                    </select>
                     <p className="text-xs text-tg-hint mt-1">Оберіть, де будуть зберігатися нові завантажені фотографії.</p>
                </div>

                {settings.storage_provider === 's3' && (
                    <div className="space-y-4 border-t border-tg-border pt-4 mt-4 animate-modal-fade-in">
                        <h3 className="font-semibold text-tg-text">Налаштування Amazon S3</h3>
                        <InputField label="Bucket Name" name="s3_bucket" value={settings.s3_bucket || ''} onChange={handleChange} />
                        <InputField label="Region" name="s3_region" value={settings.s3_region || ''} onChange={handleChange} placeholder="e.g., eu-central-1" />
                        <InputField label="Access Key ID" name="s3_access_key_id" value={settings.s3_access_key_id || ''} onChange={handleChange} />
                        <InputField label="Secret Access Key" name="s3_secret_access_key" value={settings.s3_secret_access_key || ''} onChange={handleChange} type="password" placeholder="Залиште пустим, щоб не змінювати" />
                    </div>
                )}

                {settings.storage_provider === 'gcs' && (
                     <div className="space-y-4 border-t border-tg-border pt-4 mt-4 animate-modal-fade-in">
                        <h3 className="font-semibold text-tg-text">Налаштування Google Cloud Storage</h3>
                        <InputField label="Bucket Name" name="gcs_bucket" value={settings.gcs_bucket || ''} onChange={handleChange} />
                        <InputField label="Project ID" name="gcs_project_id" value={settings.gcs_project_id || ''} onChange={handleChange} />
                        <div>
                            <label htmlFor="gcs_credentials" className="block text-sm font-medium text-tg-hint">Service Account Key (JSON)</label>
                            <textarea
                                name="gcs_credentials"
                                id="gcs_credentials"
                                value={settings.gcs_credentials || ''}
                                onChange={handleChange}
                                rows={5}
                                placeholder="Вставте вміст JSON файлу. Залиште пустим, щоб не змінювати."
                                className="w-full bg-tg-bg p-2 mt-1 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none font-mono text-xs"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-tg-button text-tg-button-text font-bold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center"
                >
                    {isSaving && <Spinner size="sm" />}
                    <span className={isSaving ? 'ml-2' : ''}>Зберегти зміни</span>
                </button>
            </div>
        </div>
    );
};

export default SettingsView;