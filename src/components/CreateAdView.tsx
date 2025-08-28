import React, { useState, useCallback, useEffect } from 'react';
// FIX: Changed User to AuthUser to match the type provided by useAuth hook.
import { type Ad, type GeneratedAdData, type AuthUser } from '../types';
import { generateAdContent, createAd, updateAd } from '../apiClient';
import Spinner from './Spinner';

interface CreateAdViewProps {
  onCreateAd: (newAd: Ad) => void;
  onUpdateAd: (updatedAd: Ad) => void;
  adToEdit: Ad | null;
  // FIX: Added currentUser prop to be passed from App.tsx.
  currentUser: AuthUser;
  showToast: (message: string) => void;
}

type WizardStep = 'upload' | 'describe' | 'generating' | 'review';

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

// FIX: Added currentUser to the component's destructured props.
const CreateAdView: React.FC<CreateAdViewProps> = ({ onCreateAd, onUpdateAd, adToEdit, currentUser, showToast }) => {
  const isEditMode = !!adToEdit;

  const [step, setStep] = useState<WizardStep>(isEditMode ? 'review' : 'upload');
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [userPrompt, setUserPrompt] = useState('');
  
  // This state will hold the form data for both create (after generation) and edit flows.
  const [formData, setFormData] = useState<GeneratedAdData | null>(
      adToEdit ? {
          title: adToEdit.title,
          description: adToEdit.description,
          category: adToEdit.category,
          price: adToEdit.price,
          location: adToEdit.location,
          tags: adToEdit.tags || [],
      } : null
  );

  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
        const newPreviews: ImagePreview[] = [];
        for (const file of Array.from(files)) {
            const { dataUrl, base64 } = await fileToDataUrl(file);
            newPreviews.push({ file, dataUrl, base64, id: `${Date.now()}-${file.name}` });
        }
        setImagePreviews(prev => [...prev, ...newPreviews]);
        setStep('describe');
    }
    // FIX: Reset input value to allow selecting the same file again, which is crucial for mobile.
    event.target.value = '';
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
        if (isEditMode && adToEdit) {
            // Edit mode: Send text data and existing image URLs.
            // Image editing is not yet implemented in this simplified flow.
            const response = await updateAd(adToEdit.id, {
                adData: formData,
                existingImageUrls: adToEdit.imageUrls,
                newImages: [], // Pass an empty array as we are not handling new image uploads on edit
            });
            onUpdateAd(response.data);
        } else {
            // Create mode: Send text data and new image files.
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
    if (step === 'upload') return "Розмістити оголошення";
    if (step === 'describe') return "Розкажіть про товар";
    if (step === 'generating') return "AI творить магію...";
    return "Перевірте оголошення";
  };

  return (
    <div className="max-w-md mx-auto bg-tg-secondary-bg p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-center">{getTitle()}</h2>
        
        {!isEditMode && step === 'upload' && (
             <label className="cursor-pointer w-full bg-tg-button text-tg-button-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center">
                <span>Вибрати фото</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} multiple />
            </label>
        )}

        {!isEditMode && step === 'describe' && (
            <div>
                 <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="Опис товару..."
                    className="w-full bg-tg-bg p-3 rounded-lg border border-tg-border"
                    rows={4}
                />
                <button onClick={handleGenerate} className="mt-4 w-full bg-tg-button p-3 rounded-lg">Створити з AI</button>
            </div>
        )}

        {!isEditMode && step === 'generating' && <div className="text-center"><Spinner/> <p>AI творить магію...</p></div>}
        
        {step === 'review' && formData && (
             <div>
                <input value={formData.title} onChange={(e) => setFormData(d => d ? { ...d, title: e.target.value } : null)} className="w-full bg-tg-bg p-2 mb-2 rounded border border-tg-border" placeholder="Назва"/>
                <textarea value={formData.description} onChange={(e) => setFormData(d => d ? { ...d, description: e.target.value } : null)} className="w-full bg-tg-bg p-2 mb-2 rounded border border-tg-border" rows={5} placeholder="Опис"/>
                <input value={formData.price} onChange={(e) => setFormData(d => d ? { ...d, price: e.target.value } : null)} className="w-full bg-tg-bg p-2 mb-2 rounded border border-tg-border" placeholder="Ціна"/>
                <input value={formData.location} onChange={(e) => setFormData(d => d ? { ...d, location: e.target.value } : null)} className="w-full bg-tg-bg p-2 mb-2 rounded border border-tg-border" placeholder="Місто"/>
                <input value={formData.category} onChange={(e) => setFormData(d => d ? { ...d, category: e.target.value } : null)} className="w-full bg-tg-bg p-2 mb-2 rounded border border-tg-border" placeholder="Категорія"/>

                <button onClick={handleSubmit} disabled={isPublishing} className="mt-4 w-full bg-green-600 p-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                    {isPublishing ? (isEditMode ? 'Оновлення...' : 'Публікація...') : (isEditMode ? 'Оновити оголошення' : 'Опублікувати')}
                </button>
            </div>
        )}
        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
    </div>
  );
};

export default CreateAdView;