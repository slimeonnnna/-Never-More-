
import React, { useEffect, useRef } from 'react';
import { GridBlock } from '../types';

interface CharacterInteractionModalProps {
  interactionState: { block: GridBlock; element: HTMLElement } | null;
  onView: (block: GridBlock) => void;
  onInteract: (block: GridBlock) => void;
  onBattle: (block: GridBlock) => void;
  onClose: () => void;
}

export const CharacterInteractionModal: React.FC<CharacterInteractionModalProps> = ({ interactionState, onView, onInteract, onBattle, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (interactionState) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [interactionState, onClose]);

  if (!interactionState) {
    return null;
  }

  const { block, element } = interactionState;
  const rect = element.getBoundingClientRect();
  const style = {
    top: `${rect.bottom + 5}px`, // Position below the block, relative to viewport
    left: `${rect.left + rect.width / 2}px`, // Center horizontally, relative to viewport
    transform: 'translateX(-50%)',
  };

  return (
    <div
      ref={modalRef}
      className="fixed z-50 bg-gray-900/80 backdrop-blur-sm border border-yellow-500/50 rounded-lg shadow-xl p-2 flex flex-col gap-2 animate-fade-in"
      style={style}
    >
      <button
        onClick={() => onView(block)}
        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors text-sm w-full"
      >
        查看
      </button>
      <button
        onClick={() => onInteract(block)}
        className="px-4 py-2 bg-teal-500 text-white font-semibold rounded-md hover:bg-teal-600 transition-colors text-sm w-full"
      >
        交互
      </button>
      <button
        onClick={() => onBattle(block)}
        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors text-sm w-full"
      >
        战斗
      </button>
    </div>
  );
};
