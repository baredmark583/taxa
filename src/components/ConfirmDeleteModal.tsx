import React from 'react';
import Modal from './Modal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-xl font-bold text-tg-text text-center">Підтвердьте видалення</h3>
        <p className="text-tg-hint my-4 text-center">
          Ви впевнені, що хочете видалити це оголошення? Цю дію неможливо буде скасувати.
        </p>
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onClose}
            className="w-full bg-tg-secondary-bg-hover text-tg-text font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Видалити
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;
