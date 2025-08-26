import React, { useState } from 'react';
import Modal from './Modal';
import { type Ad, type TelegramUser } from '../types';
import { makePriceOffer } from '../backend/api';
import { formatPrice } from '../utils/formatters';

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: Ad;
  currentUser: TelegramUser;
  showToast: (message: string) => void;
  onOfferMade: () => void;
}

const MakeOfferModal: React.FC<MakeOfferModalProps> = ({ isOpen, onClose, ad, currentUser, showToast, onOfferMade }) => {
  const [offerPrice, setOfferPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!offerPrice || parseInt(offerPrice) <= 0) {
      alert('Будь ласка, введіть коректну ціну.');
      return;
    }
    setIsSubmitting(true);
    try {
        await makePriceOffer(ad, currentUser.id, offerPrice);
        showToast(`Пропозицію ${formatPrice(offerPrice)} надіслано!`);
        onOfferMade(); // To navigate to chat
        onClose();
    } catch (error) {
        showToast('Не вдалося надіслати пропозицію.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-xl font-bold text-tg-text text-center">Запропонувати ціну</h3>
        <p className="text-tg-hint my-2 text-center">
          Поточна ціна: <span className="font-semibold text-tg-text">{formatPrice(ad.price)}</span>
        </p>
        
        <div className="my-6">
            <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="Ваша ціна, ₴"
                className="w-full text-center text-2xl bg-tg-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
            />
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onClose}
            className="w-full bg-tg-secondary-bg-hover text-tg-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !offerPrice}
            className="w-full bg-tg-button hover:bg-opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-500"
          >
            {isSubmitting ? 'Надсилаємо...' : 'Надіслати'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default MakeOfferModal;
