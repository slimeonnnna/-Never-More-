import React from 'react';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-gray-800 border border-red-500/50 rounded-lg shadow-xl w-full max-w-md m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-red-400">{title}</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-300">{message}</p>
        </div>
        <div className="p-4 bg-gray-900/50 flex justify-end gap-4 rounded-b-lg">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition-colors"
          >
            否
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
          >
            是
          </button>
        </div>
      </div>
    </div>
  );
};
