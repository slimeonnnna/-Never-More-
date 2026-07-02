import React from 'react';

interface InfoModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ title, message, onConfirm }) => {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in"
      onClick={onConfirm}
    >
      <div
        className="bg-gray-800 border border-yellow-500/50 rounded-lg shadow-xl w-full max-w-md m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-yellow-400">{title}</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-300">{message}</p>
        </div>
        <div className="p-4 bg-gray-900/50 flex justify-end gap-4 rounded-b-lg">
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-yellow-600 text-white font-semibold rounded-md hover:bg-yellow-700 transition-colors"
          >
            明白了
          </button>
        </div>
      </div>
    </div>
  );
};
