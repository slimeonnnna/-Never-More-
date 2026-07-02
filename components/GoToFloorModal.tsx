
import React, { useState } from 'react';

interface GoToFloorModalProps {
  highestFloor: number;
  onClose: () => void;
  onConfirm: (floor: number) => void;
}

export const GoToFloorModal: React.FC<GoToFloorModalProps> = ({ highestFloor, onClose, onConfirm }) => {
  const [floorInput, setFloorInput] = useState<string>('');

  const handleConfirm = () => {
    const floor = parseInt(floorInput, 10);
    if (!isNaN(floor)) {
      onConfirm(floor);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-blue-500/50 rounded-lg shadow-xl w-full max-w-md m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-blue-300">快速前往楼层</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-400">当前最高可前往第 {highestFloor} 层。</p>
          <div>
            <label htmlFor="floor-input" className="block text-sm font-medium text-gray-300 mb-1">
              输入目标楼层:
            </label>
            <input
              type="number"
              id="floor-input"
              value={floorInput}
              onChange={(e) => setFloorInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500"
              placeholder={`1 - ${highestFloor}`}
              autoFocus
            />
          </div>
        </div>
        <div className="p-4 bg-gray-900/50 flex justify-end gap-4 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
          >
            前往
          </button>
        </div>
      </div>
    </div>
  );
};