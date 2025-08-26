

import React, { useState, useCallback, useEffect } from 'react';
// FIX: Changed User to AuthUser to match the type provided by useAuth hook.
import { type Ad, type GeneratedAdData, type AuthUser } from '../types';
import { generateAdContent, createAd } from '../apiClient';
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
  const [generatedData, setGeneratedData] = useState<GeneratedAdData | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (isEditMode && adToEdit) {
      // Logic to populate fields for editing
    }
  }, [isEditMode, adToEdit]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
        const newPreviews: ImagePreview[] = [];
        for (const file of Array.from(files)) {
            const { dataUrl, base64 } = await fileToDataUrl(file);
            newPreviews.push({ file, dataUrl, base64, id: `${Date.now()}-${file.name}` });
        }
        setImagePreviews(prev => [...prev, ...newPreviews]);
        setStep('describe');
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
      setGeneratedData(response.data);
      setStep('review');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не вдалося згенерувати оголошення.');
      setStep('describe');
    }
  }, [userPrompt, imagePreviews]);

  const handleSubmit = async () => {
    if (!generatedData) return;
    setIsPublishing(true);
    setError(null);

    try {
        // NOTE: In a real app, you would upload images to a storage service (like S3)
        // and get back URLs. For this example, we'll send data URLs, but this is inefficient.
        // The backend should be prepared to handle base64 data URLs.
        const imageUrls = imagePreviews.map(p => p.dataUrl); 
        
        if (imageUrls.length === 0) {
            setError('Необхідно додати хоча б одне фото.');
            setIsPublishing(false);
            return;
        }

        if (isEditMode) {
            // TODO: Update logic
        } else {
            const response = await createAd({ adData: generatedData, imageUrls });
            onCreateAd(response.data);
        }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не вдалося опублікувати оголошення.');
      setIsPublishing(false);
    }
  };
  
  const getTitle = () => {
    if (isEditMode) return "Редагування";
    if (step === 'upload') return "Розмістити оголошення";
    if (step === 'describe') return "Розкажіть про товар";
    if (step === 'generating') return "AI творить магію...";
    return "Перевірте оголошення";
  };

  return (
    <div className="max-w-md mx-auto bg-tg-secondary-bg p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-center">{getTitle()}</h2>
        {step === 'upload' && (
             <label className="cursor-pointer w-full bg-tg-button text-tg-button-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center">
                <span>Вибрати фото</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} multiple />
            </label>
        )}
        {step === 'describe' && (
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
        {step === 'generating' && <div className="text-center"><Spinner/> <p>AI творить магію...</p></div>}
        {step === 'review' && generatedData && (
             <div>
                <input value={generatedData.title} onChange={(e) => setGeneratedData(d => d ? { ...d, title: e.target.value } : null)} className="w-full bg-tg-bg p-2 mb-2 rounded" />
                <textarea value={generatedData.description} onChange={(e) => setGeneratedData(d => d ? { ...d, description: e.target.value } : null)} className="w-full bg-tg-bg p-2 mb-2 rounded" rows={5} />
                <input value={generatedData.price} onChange={(e) => setGeneratedData(d => d ? { ...d, price: e.target.value } : null)} className="w-full bg-tg-bg p-2 mb-2 rounded" placeholder="Ціна"/>
                <input value={generatedData.location} onChange={(e) => setGeneratedData(d => d ? { ...d, location: e.target.value } : null)} className="w-full bg-tg-bg p-2 mb-2 rounded" placeholder="Місто"/>
                <input value={generatedData.category} onChange={(e) => setGeneratedData(d => d ? { ...d, category: e.target.value } : null)} className="w-full bg-tg-bg p-2 mb-2 rounded" placeholder="Категорія"/>

                <button onClick={handleSubmit} disabled={isPublishing} className="mt-4 w-full bg-green-600 p-3 rounded-lg">
                    {isPublishing ? 'Публікація...' : 'Опублікувати'}
                </button>
            </div>
        )}
        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
    </div>
  );
};

export default CreateAdView;