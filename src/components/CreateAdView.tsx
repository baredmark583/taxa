import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Ad, type GeneratedAdData, type AuthUser } from '../types';
import { generateAdContent, createAd, updateAd, editImage, getAdById } from '../apiClient';
import Spinner from './Spinner';
import { Icon } from '@iconify/react';
import { useAuth } from '../AuthContext';

interface CreateAdViewProps {
  onCreateAd: (newAd: Ad) => void;
  onUpdateAd: (updatedAd: Ad) => void;
  showToast: (message: string) => void;
}

type WizardStep = 'upload' | 'edit' | 'describe' | 'generating' | 'review' | 'loading';

export interface ImagePreview {
    id: string;
    file: File;
    dataUrl: string;
    base64: string;
}

const fileToDataUrl = (file: File): Promise<{ dataUrl: string, base64: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ dataUrl: result, base64 });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
};

const CreateAdView: React.FC<CreateAdViewProps> = ({ onCreateAd, onUpdateAd, showToast }) => {
  const { adId } = useParams<{ adId?: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isEditMode = !!adId;

  const [step, setStep] = useState<WizardStep>(isEditMode ? 'loading' : 'upload');
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [userPrompt, setUserPrompt] = useState('');
  const [formData, setFormData] = useState<GeneratedAdData | null>(null);
  
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) {
      getAdById(adId)
        .then(res => {
          const ad = res.data;
          setFormData({
            title: ad.title,
            description: ad.description,
            category: ad.category,
            price: ad.price,
            location: ad.location,
            tags: ad.tags || [],
          });
          setExistingImageUrls(ad.imageUrls);
          setStep('review');
        })
        .catch(() => {
          showToast("Не вдалося завантажити оголошення для редагування.");
          navigate('/');
        });
    }
  }, [adId, isEditMode, navigate, showToast]);


  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
        const newPreviews: ImagePreview[] = [];
        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) {
                showToast(`Файл ${file.name} не є зображенням.`);
                continue;
            }
            if (file.size > 10 * 1024 * 1024) {
                 showToast(`Зображення ${file.name} завелике (більше 10МБ).`);
                continue;
            }
            const { dataUrl, base64 } = await fileToDataUrl(file);
            newPreviews.push({ file, dataUrl, base64, id: `${Date.now()}-${file.name}` });
        }
        setImagePreviews(prev => [...prev, ...newPreviews]);
    }
    event.target.value = '';
  };

  const removeImage = (idToRemove: string) => setImagePreviews(prev => prev.filter(p => p.id !== idToRemove));
  const removeExistingImage = (urlToRemove: string) => setExistingImageUrls(prev => prev.filter(url => url !== urlToRemove));

  const handleImageEdit = async (editType: 'background' | 'enhance') => {
        const primaryImage = imagePreviews[0];
        if (!primaryImage) return;

        setIsEditingImage(true);
        setError(null);
        try {
            const { data: editedImageData } = await editImage(primaryImage.base64, primaryImage.file.type, editType);
            const newFile = base64ToFile(editedImageData.imageBase64, `edited-${primaryImage.file.name}`, editedImageData.mimeType);
            const { dataUrl, base64 } = await fileToDataUrl(newFile);
            setImagePreviews(prev => [{ file: newFile, dataUrl, base64, id: primaryImage.id }, ...prev.slice(1)]);
            showToast("Зображення успішно відредаговано!");
        } catch (err: any) {
            setError(err.response?.data?.message || 'Не вдалося відредагувати зображення.');
        } finally {
            setIsEditingImage(false);
        }
    };

  const handleGenerate = useCallback(async () => {
    const primaryImage = imagePreviews[0];
    if (!userPrompt || !primaryImage) {
      setError('Будь ласка, завантажте хоча б одне зображення та додайте опис.');
      return;
    }
    setStep('generating');
    setError(null);
    try {
      const response = await generateAdContent(userPrompt, primaryImage.base64, primaryImage.file.type);
      setFormData(response.data);
      setStep('review');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не вдалося згенерувати оголошення.');
      setStep('describe');
    }
  }, [userPrompt, imagePreviews]);

  const handleSubmit = async () => {
    if (!formData) return;
    setIsPublishing(true);
    setError(null);

    try {
        if (isEditMode && adId) {
            const response = await updateAd(adId, {
                adData: formData,
                existingImageUrls: existingImageUrls,
                newImages: imagePreviews.map(p => p.file),
            });
            onUpdateAd(response.data);
        } else {
            const imageFiles = imagePreviews.map(p => p.file);
            if (imageFiles.length === 0) {
                setError('Необхідно додати хоча б одне фото.');
                setIsPublishing(false);
                return;
            }
            const response = await createAd({ adData: formData, images: imageFiles });
            onCreateAd(response.data);
        }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не вдалося опублікувати оголошення.');
      setIsPublishing(false);
    }
  };
  
  const getTitle = () => {
    if (isEditMode) return "Редагування оголошення";
    if (step === 'upload') return "Завантажте фото";
    if (step === 'edit') return "Покращити фото з AI";
    if (step === 'describe') return "Розкажіть про товар";
    if (step === 'generating') return "AI творить магію...";
    if (step === 'loading') return "Завантаження...";
    return "Перевірте оголошення";
  };
  
  const renderUploadStep = () => (
    <div>
        {imagePreviews.length > 0 && (
            <div className="mb-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {imagePreviews.map((preview) => (
                        <div key={preview.id} className="relative aspect-square">
                            <img src={preview.dataUrl} alt="Preview" className="w-full h-full object-cover rounded-lg"/>
                            <button onClick={() => removeImage(preview.id)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5"><Icon icon="lucide:x" className="h-4 w-4" /></button>
                        </div>
                    ))}
                     <label className="cursor-pointer aspect-square flex flex-col items-center justify-center bg-tg-bg border-2 border-dashed border-tg-border rounded-lg hover:bg-tg-secondary-bg-hover">
                        <Icon icon="lucide:plus" className="h-8 w-8 text-tg-hint" /><span className="text-xs text-tg-hint mt-1">Додати</span>
                        <input type="file" className="hidden" onChange={handleImageChange} multiple />
                    </label>
                </div>
            </div>
        )}
        {imagePreviews.length === 0 ? (
            <label className="cursor-pointer w-full h-40 bg-tg-bg border-2 border-dashed border-tg-border rounded-lg flex flex-col items-center justify-center hover:bg-tg-secondary-bg-hover">
                <Icon icon="lucide:upload-cloud" className="h-10 w-10 text-tg-hint" /><span className="mt-2 font-semibold">Натисніть для завантаження</span><span className="text-xs text-tg-hint mt-1">PNG, JPG, WEBP до 10МБ</span>
                <input type="file" className="hidden" onChange={handleImageChange} multiple />
            </label>
        ) : (
             <button onClick={() => setStep('edit')} className="w-full bg-tg-button text-tg-button-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors">Далі</button>
        )}
    </div>
);

 const renderEditStep = () => {
        const primaryImage = imagePreviews[0];
        if (!primaryImage) return null;
        return (
            <div className="space-y-4">
                <p className="text-center text-sm text-tg-hint">Перше фото буде головним. Застосуйте AI-покращення, щоб зробити його ідеальним.</p>
                <div className="relative aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden">
                    <img src={primaryImage.dataUrl} alt="Головне фото для редагування" className="w-full h-full object-cover" />
                    {isEditingImage && <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center"><Spinner size="lg" /><p className="text-white mt-2">Обробка...</p></div>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button onClick={() => handleImageEdit('background')} disabled={isEditingImage} className="flex items-center justify-center gap-2 p-3 bg-tg-secondary-bg-hover rounded-lg hover:bg-tg-bg disabled:opacity-50"><Icon icon="lucide:wand-2" /><span>Замінити фон на білий</span></button>
                    <button onClick={() => handleImageEdit('enhance')} disabled={isEditingImage} className="flex items-center justify-center gap-2 p-3 bg-tg-secondary-bg-hover rounded-lg hover:bg-tg-bg disabled:opacity-50"><Icon icon="lucide:sparkles" /><span>Покращити якість</span></button>
                </div>
                <button onClick={() => setStep('describe')} className="w-full bg-tg-button text-tg-button-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors" disabled={isEditingImage}>Продовжити</button>
            </div>
        );
    };

  return (
    <div className="max-w-md mx-auto bg-tg-secondary-bg p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-center">{getTitle()}</h2>
        
        {step === 'loading' && <div className="text-center py-8"><Spinner size="lg"/></div>}
        {step === 'upload' && !isEditMode && renderUploadStep()}
        {step === 'edit' && !isEditMode && renderEditStep()}

        {step === 'describe' && !isEditMode && (
            <div>
                 <textarea value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder="Наприклад: 'Продаю майже новий червоний велосипед, у відмінному стані, є кілька подряпин на рамі'" className="w-full bg-tg-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none" rows={4}/>
                <button onClick={handleGenerate} className="mt-4 w-full bg-tg-button p-3 rounded-lg text-tg-button-text font-bold hover:bg-opacity-90">Створити з AI</button>
            </div>
        )}

        {step === 'generating' && <div className="text-center py-8"><Spinner size="lg"/> <p className="mt-4 text-tg-hint">Аналізуємо фото та опис...</p></div>}
        
        {step === 'review' && formData && (
             <div>
                {isEditMode && (
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Зображення</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {existingImageUrls.map((url) => (<div key={url} className="relative aspect-square"><img src={url} alt="Existing" className="w-full h-full object-cover rounded-lg"/><button onClick={() => removeExistingImage(url)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5"><Icon icon="lucide:x" className="h-4 w-4" /></button></div>))}
                            {imagePreviews.map((preview) => (<div key={preview.id} className="relative aspect-square"><img src={preview.dataUrl} alt="New Preview" className="w-full h-full object-cover rounded-lg"/><button onClick={() => removeImage(preview.id)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5"><Icon icon="lucide:x" className="h-4 w-4" /></button></div>))}
                            <label className="cursor-pointer aspect-square flex flex-col items-center justify-center bg-tg-bg border-2 border-dashed border-tg-border rounded-lg hover:bg-tg-secondary-bg-hover"><Icon icon="lucide:plus" className="h-8 w-8 text-tg-hint" /><span className="text-xs text-tg-hint mt-1">Додати</span><input type="file" className="hidden" onChange={handleImageChange} multiple /></label>
                        </div>
                    </div>
                )}
                <input value={formData.title} onChange={(e) => setFormData(d => d ? { ...d, title: e.target.value } : null)} className="w-full bg-tg-bg p-2 mb-2 rounded border border-tg-border" placeholder="Назва"/>
                <textarea value={formData.description} onChange={(e) => setFormData(d => d ? { ...d, description: e.target.value } : null)} className="w-full bg-tg-bg p-2 mb-2 rounded border border-tg-border" rows={5} placeholder="Опис"/>
                <input value={formData.price} onChange={(e) => setFormData(d => d ? { ...d, price: e.target.value } : null)} className="w-full bg-tg-bg p-2 mb-2 rounded border border-tg-border" placeholder="Ціна"/>
                <input value={formData.location} onChange={(e) => setFormData(d => d ? { ...d, location: e.target.value } : null)} className="w-full bg-tg-bg p-2 mb-2 rounded border border-tg-border" placeholder="Місто"/>
                <input value={formData.category} onChange={(e) => setFormData(d => d ? { ...d, category: e.target.value } : null)} className="w-full bg-tg-bg p-2 mb-2 rounded border border-tg-border" placeholder="Категорія"/>
                <button onClick={handleSubmit} disabled={isPublishing} className="mt-4 w-full bg-green-600 p-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-white font-bold">{isPublishing ? (isEditMode ? 'Оновлення...' : 'Публікація...') : (isEditMode ? 'Оновити оголошення' : 'Опублікувати')}</button>
            </div>
        )}
        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
    </div>
  );
};

export default CreateAdView;