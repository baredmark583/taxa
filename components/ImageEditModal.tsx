import React, { useRef, useEffect, useState } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import { editImage } from '../backend/api';
import { type ImagePreview } from './CreateAdView';


interface ImageEditModalProps {
  image: ImagePreview;
  onClose: () => void;
  onSave: (editedImage: { id: string; dataUrl: string; base64: string }) => void;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({ image, onClose, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    
    // Function to get cursor position relative to canvas
    const getPos = (e: MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        if (e instanceof MouseEvent) {
             return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
        if (e.touches && e.touches[0]) {
             return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: 0, y: 0 };
    };

    const startDrawing = (e: MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;
        
        setIsDrawing(true);
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const imageEl = imageRef.current;
        const ctx = canvas?.getContext('2d');

        if (canvas && imageEl && ctx) {
            // Match canvas dimensions to the image's displayed dimensions
            const setCanvasSize = () => {
                canvas.width = imageEl.clientWidth;
                canvas.height = imageEl.clientHeight;
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'; // Light blue with transparency
                ctx.lineWidth = 20;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            };
            
            // Wait for image to be loaded before setting size
            if (imageEl.complete) {
                 setCanvasSize();
            } else {
                imageEl.onload = setCanvasSize;
            }
            
             // Add event listeners
            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('mousemove', draw);
            window.addEventListener('mouseup', stopDrawing);
            canvas.addEventListener('touchstart', startDrawing, { passive: false });
            canvas.addEventListener('touchmove', draw, { passive: false });
            window.addEventListener('touchend', stopDrawing);

            // Cleanup
            return () => {
                canvas.removeEventListener('mousedown', startDrawing);
                canvas.removeEventListener('mousemove', draw);
                window.removeEventListener('mouseup', stopDrawing);
                canvas.removeEventListener('touchstart', startDrawing);
                canvas.removeEventListener('touchmove', draw);
                window.removeEventListener('touchend', stopDrawing);
            };
        }
    }, [isDrawing]); // Rerun effect if isDrawing state changes to re-bind functions correctly

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const newDataUrl = await editImage(image.dataUrl, 'remove-background');
            const newBase64 = newDataUrl.split(',')[1];
            onSave({ id: image.id, dataUrl: newDataUrl, base64: newBase64 });
        } catch (error) {
            console.error("Failed to process image", error);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Modal isOpen={true} onClose={onClose}>
            <div className="p-4 flex flex-col h-[80vh] max-h-[600px]">
                 <h3 className="text-xl font-bold text-tg-text text-center mb-2">Виділіть головний об'єкт</h3>
                 <p className="text-sm text-tg-hint text-center mb-4">Проведіть пальцем або мишкою по об'єкту, який хочете залишити. AI видалить все інше.</p>

                 <div className="relative flex-grow w-full h-full flex items-center justify-center mb-4 touch-none">
                    <img
                        ref={imageRef}
                        src={image.dataUrl}
                        alt="Редагування"
                        className="max-w-full max-h-full object-contain rounded-lg"
                    />
                    <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none"
                    />
                     {isLoading && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg">
                            <Spinner size="lg" />
                            <p className="text-white mt-4">Застосовуємо магію...</p>
                        </div>
                    )}
                 </div>

                 <div className="flex justify-center gap-4 mt-auto">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full bg-tg-secondary-bg-hover text-tg-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                    >
                        Скасувати
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full bg-tg-button hover:bg-opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                    >
                       Зберегти
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ImageEditModal;
