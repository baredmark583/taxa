import React, { useState, useCallback, useEffect } from 'react';
import { type Ad, type GeneratedAdData, type TelegramUser } from '../types';
import { generateAdContent, publishAd, improveAdWithAI, getSuggestedPrice, editImage } from '../backend/api';
import Spinner from './Spinner';
import ImageEditModal from './ImageEditModal';

interface CreateAdViewProps {
  onCreateAd: (newAd: Ad) => void;
  onUpdateAd: (updatedAd: Ad) => void;
  adToEdit: Ad | null;
  currentUser: TelegramUser | null;
  showToast: (message: string) => void;
}

type WizardStep = 'upload' | 'describe' | 'generating' | 'review';

const generatingMessages = [
  "Аналізую ваше фото...",
  "Підбираю влучний заголовок...",
  "Складаю опис, що продає...",
  "Визначаю відповідну категорію...",
  "Пропоную справедливу ціну...",
  "Підбираю релевантні теги...",
  "Майже готово!",
];

export interface ImagePreview {
    id: string;
    file: File;
    dataUrl: string;
    base64: string;
}

// Check for SpeechRecognition API
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

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


const AiEditMenu: React.FC<{ onSelect: (editType: 'remove-background' | 'auto-enhance') => void }> = ({ onSelect }) => (
    <div className="absolute top-10 right-1 z-20 bg-tg-secondary-bg-hover shadow-lg rounded-md text-sm p-1">
        <button onClick={() => onSelect('remove-background')} className="w-full text-left px-2 py-1 hover:bg-tg-border rounded-sm">Видалити фон</button>
        <button onClick={() => onSelect('auto-enhance')} className="w-full text-left px-2 py-1 hover:bg-tg-border rounded-sm">Автопокращення</button>
    </div>
);


const CreateAdView: React.FC<CreateAdViewProps> = ({ onCreateAd, onUpdateAd, adToEdit, currentUser, showToast }) => {
  const isEditMode = !!adToEdit;

  const [step, setStep] = useState<WizardStep>(isEditMode ? 'review' : 'upload');
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [userPrompt, setUserPrompt] = useState('');
  const [generatedData, setGeneratedData] = useState<GeneratedAdData | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentGeneratingMessage, setCurrentGeneratingMessage] = useState(generatingMessages[0]);
  const [initialImageUrls, setInitialImageUrls] = useState<string[]>([]);
  const [isImproving, setIsImproving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [activeEditMenuId, setActiveEditMenuId] = useState<string | null>(null);
  const [imageToEditInModal, setImageToEditInModal] = useState<ImagePreview | null>(null);


  useEffect(() => {
    if (isEditMode && adToEdit) {
      setInitialImageUrls(adToEdit.imageUrls);
      setGeneratedData({
        title: adToEdit.title,
        description: adToEdit.description,
        category: adToEdit.category,
        price: adToEdit.price,
        location: adToEdit.location,
        tags: adToEdit.tags || [],
      });
    }
  }, [isEditMode, adToEdit]);

  useEffect(() => {
    let intervalId: number | undefined;

    if (step === 'generating') {
      let index = 0;
      setCurrentGeneratingMessage(generatingMessages[0]);
      
      intervalId = window.setInterval(() => {
        index = (index + 1) % generatingMessages.length;
        setCurrentGeneratingMessage(generatingMessages[index]);
      }, 2500);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [step]);

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
  
  const handleAiImageEdit = async (preview: ImagePreview, editType: 'remove-background' | 'auto-enhance') => {
      setActiveEditMenuId(null);

      if (editType === 'remove-background') {
          setImageToEditInModal(preview);
          return;
      }

      // Handle 'auto-enhance' directly
      setEditingImageId(preview.id);
      try {
          const newDatUrl = await editImage(preview.dataUrl, editType);
          const newBase64 = newDatUrl.split(',')[1];
          
          setImagePreviews(previews => previews.map(p => 
              p.id === preview.id ? { ...p, dataUrl: newDatUrl, base64: newBase64 } : p
          ));

          showToast("Фото покращено!");

      } catch (err) {
          showToast("Не вдалося покращити фото.");
          console.error(err);
      } finally {
          setEditingImageId(null);
      }
  }
  
  const handleImageSaveFromEditor = (editedImage: { id: string; dataUrl: string; base64: string; }) => {
    setImagePreviews(previews => previews.map(p => 
        p.id === editedImage.id ? { ...p, dataUrl: editedImage.dataUrl, base64: editedImage.base64 } : p
    ));
    setImageToEditInModal(null); // Close modal
    showToast("Фон видалено!");
  };

  const removeImage = (id: string) => {
    setImagePreviews(prev => prev.filter((p) => p.id !== id));
  };
  
  const removeInitialImage = (url: string) => {
      setInitialImageUrls(prev => prev.filter(u => u !== url));
  }

  const handleToggleListening = () => {
    if (!isSpeechRecognitionSupported) {
        alert("Ваш браузер не підтримує голосове введення.");
        return;
    }
    if (isListening) {
        // This is tricky as we don't have a direct way to stop it, 
        // but usually, it stops on its own after a pause.
        setIsListening(false);
    } else {
        const recognition = new SpeechRecognition();
        recognition.lang = 'uk-UA';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.start();
        setIsListening(true);

        recognition.onresult = (event: any) => {
            const speechResult = event.results[0][0].transcript;
            setUserPrompt(prev => prev ? `${prev} ${speechResult}` : speechResult);
        };

        recognition.onspeechend = () => {
            recognition.stop();
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setError('Помилка розпізнавання мовлення.');
            setIsListening(false);
        };
    }
  };


  const handleGenerate = useCallback(async () => {
    // We'll use the first image for generation
    const primaryImage = imagePreviews[0];
    if (!userPrompt || !primaryImage) {
      setError('Будь ласка, завантажте хоча б одне зображення та додайте опис.');
      return;
    }
    setStep('generating');
    setError(null);
    try {
      const data = await generateAdContent(userPrompt, primaryImage.base64, primaryImage.file.type);
      setGeneratedData(data);
      setStep('review');
    } catch (err: any) {
      setError(err.message || 'Сталася невідома помилка.');
      setStep('describe');
    }
  }, [userPrompt, imagePreviews]);
  
  const handleImproveAd = async () => {
    if (!generatedData) return;
    
    setIsImproving(true);
    setError(null);
    try {
        const { title, description, tags } = await improveAdWithAI(generatedData.title, generatedData.description);
        setGeneratedData(prevData => prevData ? { ...prevData, title, description, tags } : null);
        showToast("Оголошення покращено за допомогою AI!");
    } catch (err: any) {
        setError(err.message || 'Не вдалося покращити оголошення.');
    } finally {
        setIsImproving(false);
    }
  };
  
  const handleSuggestPrice = async () => {
    if (!generatedData) return;
    setIsSuggestingPrice(true);
    try {
        const suggestedPrice = await getSuggestedPrice(generatedData.title, generatedData.description);
        setGeneratedData(d => d ? ({ ...d, price: suggestedPrice }) : null);
        showToast("AI запропонував нову ціну!");
    } catch (err) {
        showToast("Не вдалося запропонувати ціну.");
    } finally {
        setIsSuggestingPrice(false);
    }
  };

  const handleSubmit = async () => {
    if (!generatedData) return;
    setIsPublishing(true);
    setError(null);

    try {
        const finalImageUrls = [
            ...initialImageUrls, 
            ...imagePreviews.map(p => p.dataUrl)
        ];
        
        if (finalImageUrls.length === 0) {
            setError('Необхідно додати хоча б одне фото.');
            setIsPublishing(false);
            return;
        }

      if (isEditMode && adToEdit) {
        const updatedAd: Ad = {
          ...adToEdit,
          ...generatedData,
          imageUrls: finalImageUrls,
          tags: generatedData.tags,
        };
        onUpdateAd(updatedAd);
      } else {
        if (!currentUser) {
            throw new Error("Не вдалося отримати дані користувача для публікації.");
        }
        const newAd = await publishAd(generatedData, finalImageUrls, currentUser);
        onCreateAd(newAd);
      }
    } catch (err: any) {
      setError(err.message || `Не вдалося ${isEditMode ? 'зберегти' : 'опублікувати'} оголошення.`);
      setIsPublishing(false); // Only set publishing to false on error
    }
  };
  
  const getTitle = () => {
    if (isEditMode) return "Редагування";
    if (step === 'upload') return "Розмістити оголошення";
    if (step === 'describe') return "Розкажіть про товар";
    if (step === 'generating') return "AI творить магію...";
    return "Перевірте оголошення";
  };

  const renderStep = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="text-center">
            <p className="text-tg-hint mb-6">Почніть із завантаження фото вашого товару. Можна вибрати декілька.</p>
            <div className="flex flex-col space-y-4">
              <label className="cursor-pointer w-full bg-tg-button text-tg-button-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Зробити фото</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} multiple />
              </label>
              <label className="cursor-pointer w-full bg-tg-secondary-bg-hover text-tg-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Вибрати з галереї</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} multiple />
              </label>
            </div>
          </div>
        );
      case 'describe':
        return (
          <div>
            <div className="grid grid-cols-3 gap-2 mb-4">
                {imagePreviews.map((preview) => (
                    <div key={preview.id} className="relative group">
                        <img src={preview.dataUrl} alt={`Передперегляд`} className="w-full h-24 object-cover rounded-md" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                           {editingImageId !== preview.id && (
                             <>
                                <button onClick={(e) => { e.stopPropagation(); setActiveEditMenuId(activeEditMenuId === preview.id ? null : preview.id); }} className="text-white p-1.5 bg-black/40 rounded-full hover:bg-black/60">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                </button>
                                <button onClick={() => removeImage(preview.id)} className="text-white p-1.5 bg-black/40 rounded-full hover:bg-black/60">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                             </>
                           )}
                        </div>
                         {editingImageId === preview.id && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Spinner /></div>}
                         {activeEditMenuId === preview.id && <AiEditMenu onSelect={(type) => handleAiImageEdit(preview, type)} />}
                    </div>
                ))}
            </div>
            <div className="relative">
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Наприклад, 'Продаю свій старий велосипед, в хорошому стані'"
                className="w-full bg-tg-secondary-bg p-3 pr-10 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
                rows={4}
              />
              {isSpeechRecognitionSupported && (
                <button 
                  onClick={handleToggleListening}
                  className={`absolute bottom-2 right-2 p-1 rounded-full transition-colors ${isListening ? 'bg-red-500/80 text-white animate-pulse' : 'bg-tg-link/80 text-white hover:bg-tg-link'}`}
                  aria-label={isListening ? 'Зупинити запис' : 'Почати голосове введення'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-5.445-9.313A5.976 5.976 0 0111 3v1.07A7.001 7.001 0 0011 14.93z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            {error && <p className="text-red-400 mt-2">{error}</p>}
            <button onClick={handleGenerate} disabled={!userPrompt || imagePreviews.length === 0} className="mt-4 w-full bg-tg-button text-tg-button-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
              Створити за допомогою AI
            </button>
          </div>
        );
      case 'generating':
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <Spinner size="lg" />
            <p className="text-tg-hint mt-4 h-6">{currentGeneratingMessage}</p>
          </div>
        );
      case 'review':
        if (!generatedData) return null;
        return (
          <div>
            {isEditMode && (
              <div className="mb-4">
                <button
                  onClick={handleImproveAd}
                  disabled={isImproving}
                  className="w-full flex items-center justify-center gap-2 bg-tg-link/20 text-tg-link font-semibold py-2 px-4 rounded-lg hover:bg-tg-link/30 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                  {isImproving ? (
                    <Spinner size="sm" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                  <span>{isImproving ? 'Покращуємо...' : 'Покращити за допомогою AI'}</span>
                </button>
              </div>
            )}
             <div className="grid grid-cols-3 gap-2 mb-4">
                {initialImageUrls.map((url, index) => (
                    <div key={`initial-${index}`} className="relative group">
                        <img src={url} alt={`Фото ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
                        <button onClick={() => removeInitialImage(url)} className="absolute top-1 right-1 bg-red-600/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                ))}
                {imagePreviews.map((preview) => (
                   <div key={preview.id} className="relative group">
                        <img src={preview.dataUrl} alt={`Нове фото`} className="w-full h-24 object-cover rounded-md" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                           {editingImageId !== preview.id && (
                             <>
                                <button onClick={(e) => { e.stopPropagation(); setActiveEditMenuId(activeEditMenuId === preview.id ? null : preview.id); }} className="text-white p-1.5 bg-black/40 rounded-full hover:bg-black/60">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                </button>
                                <button onClick={() => removeImage(preview.id)} className="text-white p-1.5 bg-black/40 rounded-full hover:bg-black/60">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                             </>
                           )}
                        </div>
                         {editingImageId === preview.id && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Spinner /></div>}
                         {activeEditMenuId === preview.id && <AiEditMenu onSelect={(type) => handleAiImageEdit(preview, type)} />}
                    </div>
                ))}
            </div>

            <div className="space-y-4">
              <input
                value={generatedData.title}
                onChange={(e) => setGeneratedData(d => d ? ({ ...d, title: e.target.value }) : null)}
                className="w-full bg-tg-secondary-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none text-xl font-bold"
              />
              <textarea
                value={generatedData.description}
                onChange={(e) => setGeneratedData(d => d ? ({ ...d, description: e.target.value }) : null)}
                className="w-full bg-tg-secondary-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
                rows={6}
              />
              <div className="flex gap-4">
                 <div className="w-1/2 relative">
                    <input
                      value={generatedData.price}
                      onChange={(e) => setGeneratedData(d => d ? ({ ...d, price: e.target.value }) : null)}
                      className="w-full bg-tg-secondary-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none pr-10"
                      placeholder="Ціна"
                    />
                    <button onClick={handleSuggestPrice} disabled={isSuggestingPrice} className="absolute inset-y-0 right-0 px-2 flex items-center text-tg-hint hover:text-tg-link disabled:opacity-50">
                        {isSuggestingPrice ? <Spinner size="sm" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /><path d="M16.5 6.75a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5zM12.25 10a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5zM10 12.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5zM6.75 9a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" /></svg>}
                    </button>
                 </div>
                 <input
                  value={generatedData.location}
                  onChange={(e) => setGeneratedData(d => d ? ({ ...d, location: e.target.value }) : null)}
                  className="w-1/2 bg-tg-secondary-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
                  placeholder="Місцезнаходження"
                />
              </div>
               <input
                  value={generatedData.category}
                  onChange={(e) => setGeneratedData(d => d ? ({ ...d, category: e.target.value }) : null)}
                  className="w-full bg-tg-secondary-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
                  placeholder="Категорія"
                />
            </div>
             {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
            <button onClick={handleSubmit} disabled={isPublishing} className="mt-6 w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:bg-gray-500">
              {isPublishing && <Spinner size="sm" />}
              <span className={isPublishing ? 'ml-2' : ''}>
                {isEditMode ? 'Зберегти зміни' : 'Опублікувати'}
              </span>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto bg-tg-secondary-bg p-6 rounded-lg shadow-xl" onClick={() => setActiveEditMenuId(null)}>
       <h2 className="text-2xl font-bold mb-4 text-center">{getTitle()}</h2>
      {renderStep()}

      {imageToEditInModal && (
        <ImageEditModal
            image={imageToEditInModal}
            onClose={() => setImageToEditInModal(null)}
            onSave={handleImageSaveFromEditor}
        />
      )}
    </div>
  );
};

export default CreateAdView;
