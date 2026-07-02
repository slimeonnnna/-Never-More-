




import React, { useState } from 'react';
import { Monster, Equipment } from '../types';
import { MONSTER_RANK_CONFIG, EQUIPMENT_SLOTS_ORDER } from '../constants';
import { REALMS } from '../realmConstants';
import { formatLargeNumber } from '../utils';
import { CollapsiblePanel } from './CollapsiblePanel';
import { ItemSlot } from './ItemSlot';
import { EquipmentModal } from './EquipmentModal';

interface MonsterDetailModalProps {
  monster: Monster;
  onClose: () => void;
}

export const MonsterDetailModal: React.FC<MonsterDetailModalProps> = ({ monster, onClose }) => {
  const { equipped, inventory } = monster;
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);

  const handleItemClickInternal = (item: Equipment) => {
    setSelectedItem(item);
  };

  const handleCloseItemModal = () => {
    setSelectedItem(null);
  };

  const rankConfig = MONSTER_RANK_CONFIG[monster.rank];
  const originalStats = monster.originalStats;

  const baseDivinity = monster.floorBonusDivinity ? monster.stats.divinity - monster.floorBonusDivinity : monster.stats.divinity;
  const divinityText = monster.floorBonusDivinity
    ? `${formatLargeNumber(baseDivinity)} + ${monster.floorBonusDivinity}`
    : formatLargeNumber(monster.stats.divinity);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="monster-detail-title"
      >
        <div
          className={`bg-gray-800 border rounded-lg shadow-xl w-full max-w-2xl m-4 ${rankConfig.cssClass.split(' ').find(c => c.startsWith('text-'))?.replace('text-', 'border-')}/50 flex flex-col max-h-[90vh]`}
          onClick={e => e.stopPropagation()}
        >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 id="monster-detail-title" className={`text-xl font-bold ${rankConfig.cssClass}`}>
            敌人详情
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl" aria-label="关闭">&times;</button>
        </div>
          <div className="p-4 border-b border-gray-700">
            <div className={`font-bold text-lg mb-1 ${rankConfig.cssClass}`}>【{monster.rank}】 {monster.name}</div>
            <div className="text-sm text-gray-400 mb-3">
              性别: {monster.gender || '未知'} | 境界: {REALMS[monster.realmIndex].name}
              {monster.sect && ` | 宗门: ${monster.sect}`}
              {monster.identity && ` | 身份: ${monster.identity}`}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-base">
                <div>战力: <span className="text-yellow-300 font-semibold">{formatLargeNumber(monster.stats.combatPower)}</span></div>
                <div>
                  体力: 
                  <span className="text-green-400 font-semibold">{formatLargeNumber(monster.stats.maxHealth)}</span>
                  {originalStats && <span className="text-xs text-red-400 ml-1">({Math.round(monster.stats.maxHealth / originalStats.maxHealth * 100)}%)</span>}
                </div>
                <div>
                  攻击: 
                  <span className="text-white font-semibold">{formatLargeNumber(monster.stats.attack)}</span>
                  {originalStats && <span className="text-xs text-red-400 ml-1">({Math.round(monster.stats.attack / originalStats.attack * 100)}%)</span>}
                </div>
                <div>
                  防御: 
                  <span className="text-white font-semibold">{formatLargeNumber(monster.stats.defense)}</span>
                  {originalStats && <span className="text-xs text-red-400 ml-1">({Math.round(monster.stats.defense / originalStats.defense * 100)}%)</span>}
                </div>
                <div className="col-span-2">神性: <span className="text-white font-semibold">{divinityText}</span></div>
            </div>
          </div>
          <div className="p-4 overflow-y-auto space-y-4">
            {/* Equipped Items */}
            <CollapsiblePanel title="装备栏" defaultExpanded={false}>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 justify-items-center bg-gray-900/50 p-2 rounded-md max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                  {EQUIPMENT_SLOTS_ORDER.map(slot => {
                    const item = equipped[slot] || null;
                    return (
                      <div key={slot} className="flex flex-col items-center w-full">
                         <div className="w-full bg-gray-900/50 p-1 rounded-md">
                            <ItemSlot
                              item={item}
                              onClick={() => item && handleItemClickInternal(item)}
                              isEquipped={true}
                            />
                         </div>
                         <span className="text-xs text-gray-400 mt-1 whitespace-nowrap">{slot}</span>
                      </div>
                    )
                  })}
              </div>
            </CollapsiblePanel>
            
            {/* Inventory */}
            <CollapsiblePanel title={`背包 (金币: ${formatLargeNumber(monster.gold || 0)})`} defaultExpanded={false}>
               <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-gray-900/50 p-2 rounded-md max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                  {inventory.slice(0, 18).map((item, index) => (
                      <ItemSlot
                        key={item ? item.id : `empty-inv-${index}`}
                        item={item}
                        onClick={() => item && handleItemClickInternal(item)}
                      />
                  ))}
                  {inventory.length === 0 && <p className="col-span-6 text-center text-gray-500 py-4">空</p>}
              </div>
            </CollapsiblePanel>
          </div>
          <div className="p-3 bg-gray-900/50 flex justify-end gap-3 rounded-b-lg">
             <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition-colors">
              关闭
            </button>
          </div>
        </div>
      </div>
      {selectedItem && (
        <EquipmentModal
            selectedItem={selectedItem}
            equippedItem={null}
            source="inventory"
            onClose={handleCloseItemModal}
            onEquip={() => {}}
            onUnequip={() => {}}
            onRefine={() => {}}
            onUseTemperingStone={() => {}}
            temperingStones={0}
            isReadOnly={true}
        />
      )}
    </>
  );
};