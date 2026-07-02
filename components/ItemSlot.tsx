import React from 'react';
import { Equipment } from '../types';
import { QUALITY_CONFIG } from '../constants';

interface ItemSlotProps {
  item: Equipment | null;
  onClick: () => void;
  isEquipped?: boolean;
}

export const ItemSlot: React.FC<ItemSlotProps> = ({ item, onClick, isEquipped = false }) => {
  const colorName = item ? QUALITY_CONFIG[item.quality].color.split('-')[1] : null;
  const qualityBorderClass = item && colorName ? `border-${colorName}-500/70` : 'border-gray-600';

  let finalBgColor = isEquipped ? 'bg-gray-800/80' : 'bg-gray-700/80';
  if (item && colorName) {
    finalBgColor = `bg-${colorName}-900/40`;
  }

  return (
    <div
      onClick={onClick}
      className={`relative w-full h-16 ${finalBgColor} border-2 ${qualityBorderClass} rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:border-white p-1`}
    >
      {item ? (
        <span className={`text-sm font-semibold text-center break-words ${QUALITY_CONFIG[item.quality].cssClass}`}>
          {item.name.replace(/\[.*?\]\s*/g, '')}
        </span>
      ) : (
        <span className="text-gray-500 text-xs text-center">空</span>
      )}
    </div>
  );
};
