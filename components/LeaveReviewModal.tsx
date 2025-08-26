import React, { useState } from 'react';
import Modal from './Modal';

interface LeaveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; text: string }) => void;
  sellerName: string;
}

const StarInput: React.FC<{ rating: number; setRating: (r: number) => void }> = ({ rating, setRating }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex justify-center" onMouseLeave={() => setHoverRating(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onMouseEnter={() => setHoverRating(star)}
          onClick={() => setRating(star)}
          className="p-1 focus:outline-none"
          aria-label={`Оцінка ${star} з 5`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-10 w-10 transition-colors ${
              (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-600'
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({ isOpen, onClose, onSubmit, sellerName }) => {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Будь ласка, поставте оцінку.');
      return;
    }
    onSubmit({ rating, text });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-xl font-bold text-tg-text text-center">
          Відгук для <span className="text-tg-link">{sellerName}</span>
        </h3>
        <p className="text-tg-hint my-4 text-center">Будь ласка, оцініть вашу угоду з продавцем.</p>

        <div className="my-6">
          <StarInput rating={rating} setRating={setRating} />
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Розкажіть про свій досвід (необов'язково)"
          className="w-full bg-tg-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
          rows={4}
        />

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onClose}
            className="w-full bg-tg-secondary-bg-hover text-tg-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="w-full bg-tg-button hover:bg-opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-500"
          >
            Надіслати відгук
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LeaveReviewModal;