
import React, { useState } from 'react';
import { GridBlock, Monster, Player, Equipment, GameState } from '../types';
import { formatLargeNumber } from '../utils';
import { ChatModal } from './ChatModal';

interface InteractionActionModalProps {
  block: GridBlock;
  player: Player;
  gameState: GameState;
  onClose: () => void;
  onSpareMe: (block: GridBlock) => void;
  onAIGiveItem: (item: Equipment) => void;
  onAIGiveGold: (amount: number) => void;
  onAIHealPlayer: (amount: number) => void;
  onAIRemoveBlock: (blockId: string) => void;
  onAIDeductGold: (amount: number) => void;
  onAIMakeFriendly: (blockId: string) => void;
  onBattle: (block: GridBlock) => void;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export const InteractionActionModal: React.FC<InteractionActionModalProps> = ({ 
  block, player, gameState, onClose, onSpareMe,
  onAIGiveItem, onAIGiveGold, onAIHealPlayer, onAIRemoveBlock, onAIDeductGold, onAIMakeFriendly, onBattle, setGameState
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const character = block.data as Monster;
  if (!character) return null;

  const isFriendly = character.isFriendly;

  const renderEnemyInteractions = () => {
    const playerPower = player.stats.combatPower;
    const monsterPower = character.stats.combatPower;
    let cost = 0;
    let canSpare = false;
    let buttonText = '高抬贵手';
    let buttonTitle = '';

    if (monsterPower > playerPower) {
        canSpare = true;
        cost = (monsterPower - playerPower) * 10;
        if (cost < monsterPower) {
            cost = monsterPower;
        }
        cost = Math.min(cost, monsterPower * 2);
        buttonText = `高抬贵手 (${formatLargeNumber(cost)} 金币)`;
        buttonTitle = `消耗 ${formatLargeNumber(cost)} 金币`;
    } else {
        buttonText = '高抬贵手';
        buttonTitle = '你比敌人更强，无需请求宽恕。';
    }
    
    const canAfford = player.gold >= cost;

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-red-400 text-center mb-3">敌人交互</h3>
        <button
          onClick={() => setIsChatOpen(true)}
          className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
        >
          交谈
        </button>
        <button
          onClick={() => onSpareMe(block)}
          disabled={!canSpare || !canAfford}
          className="w-full px-4 py-2 bg-yellow-600 text-black font-semibold rounded-md hover:bg-yellow-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          title={buttonTitle}
        >
          {buttonText}
        </button>
        <button disabled className="w-full px-4 py-2 bg-gray-600 text-white font-semibold rounded-md cursor-not-allowed opacity-50">
          劝和 (未实现)
        </button>
        <button disabled className="w-full px-4 py-2 bg-gray-600 text-white font-semibold rounded-md cursor-not-allowed opacity-50">
          偷窃 (未实现)
        </button>
      </div>
    );
  };

  const renderFriendlyInteractions = () => (
    <div className="space-y-2">
      <h3 className="text-lg font-bold text-green-400 text-center mb-3">中立交互</h3>
      <button
        onClick={() => setIsChatOpen(true)}
        className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
      >
        交谈
      </button>
      <button disabled className="w-full px-4 py-2 bg-gray-600 text-white font-semibold rounded-md cursor-not-allowed opacity-50">
        结义 (未实现)
      </button>
      <button disabled className="w-full px-4 py-2 bg-gray-600 text-white font-semibold rounded-md cursor-not-allowed opacity-50">
        结缘 (未实现)
      </button>
      <button disabled className="w-full px-4 py-2 bg-gray-600 text-white font-semibold rounded-md cursor-not-allowed opacity-50">
        帮忙 (未实现)
      </button>
    </div>
  );

  if (isChatOpen) {
    return (
      <ChatModal 
        block={block} 
        player={player} 
        gameState={gameState}
        onClose={() => setIsChatOpen(false)}
        onAIGiveItem={onAIGiveItem}
        onAIGiveGold={onAIGiveGold}
        onAIDeductGold={onAIDeductGold}
        onAIHealPlayer={onAIHealPlayer}
        onAIRemoveBlock={onAIRemoveBlock}
        onAIMakeFriendly={onAIMakeFriendly}
        onBattle={onBattle}
        setGameState={setGameState}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-yellow-500/50 rounded-lg shadow-xl w-full max-w-sm m-4 p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative">
            <button onClick={onClose} className="absolute -top-2 -right-2 text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            {isFriendly ? renderFriendlyInteractions() : renderEnemyInteractions()}
        </div>
      </div>
    </div>
  );
};
