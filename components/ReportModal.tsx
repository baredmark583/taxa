import React, { useState } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

const reportReasons = [
    "Шахрайство",
    "Невірна категорія",
    "Заборонений товар",
    "Образливий вміст",
    "Спам",
];

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
      if (!selectedReason) {
          alert("Будь ласка, виберіть причину скарги.");
          return;
      }
      setIsSubmitting(true);
      // The onSubmit prop will handle the API call and closing the modal
      onSubmit(selectedReason);
      // We don't setIsSubmitting(false) here because the modal will close
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-xl font-bold text-tg-text text-center mb-4">Поскаржитись на оголошення</h3>
        <div className="space-y-2">
            {reportReasons.map(reason => (
                <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedReason === reason ? 'bg-tg-link/20 border-tg-link text-tg-link' : 'border-tg-border hover:bg-tg-secondary-bg-hover'}`}
                >
                    {reason}
                </button>
            ))}
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
            disabled={!selectedReason || isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-red-800 flex items-center justify-center"
          >
            {isSubmitting ? <Spinner size="sm" /> : "Надіслати"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReportModal;