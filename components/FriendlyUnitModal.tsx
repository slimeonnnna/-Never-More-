

import React, { useState } from 'react';
import { Monster, Equipment } from '../types';
import { ItemSlot } from './ItemSlot';
import { EquipmentModal } from './EquipmentModal';
import { EQUIPMENT_SLOTS_ORDER, MONSTER_RANK_CONFIG } from '../constants';
import { REALMS } from '../realmConstants';
import { formatLargeNumber } from '../utils';

import { CollapsiblePanel } from './CollapsiblePanel';

interface FriendlyUnitModalProps {
  friendlyUnit: Monster;
  onClose: () => void;
  onItemClick: (item: Equipment) => void;
}

export const FriendlyUnitModal: React.FC<FriendlyUnitModalProps> = ({ friendlyUnit, onClose, onItemClick }) => {
  const { equipped, inventory } = friendlyUnit;
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);

  const handleItemClickInternal = (item: Equipment) => {
    setSelectedItem(item);
  };

  const handleCloseItemModal = () => {
    setSelectedItem(null);
  };
  
  const rankConfig = MONSTER_RANK_CONFIG[friendlyUnit.rank];
  
  const baseDivinity = friendlyUnit.floorBonusDivinity ? friendlyUnit.stats.divinity - friendlyUnit.floorBonusDivinity : friendlyUnit.stats.divinity;
  const divinityText = friendlyUnit.floorBonusDivinity
    ? `${formatLargeNumber(baseDivinity)} + ${friendlyUnit.floorBonusDivinity}`
    : formatLargeNumber(friendlyUnit.stats.divinity);

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center backdrop-blur-sm"
        onClick={onClose}
      >
        <div 
          className="bg-gray-800 border border-pink-400/50 rounded-lg shadow-xl w-full max-w-2xl m-4 animate-fade-in flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-700 flex justify-between items-start">
            <div>
              <h2 className={`text-xl font-bold ${rankConfig.cssClass}`}>
                中立详情: {friendlyUnit.name}
              </h2>
              <div className="text-sm text-gray-400 mt-1">
                性别: {friendlyUnit.gender} | 境界: {REALMS[friendlyUnit.realmIndex].name}
                {friendlyUnit.sect && ` | 宗门: ${friendlyUnit.sect}`}
                {friendlyUnit.identity && ` | 身份: ${friendlyUnit.identity}`}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          {/* Stats Section */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-yellow-300 mb-2">属性</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div className="text-gray-300">战力: <span className="text-yellow-300 font-semibold">{formatLargeNumber(friendlyUnit.stats.combatPower)}</span></div>
                <div className="text-gray-300">体力: <span className="text-green-400">{formatLargeNumber(friendlyUnit.stats.maxHealth)}</span></div>
                <div className="text-gray-300">攻击: <span className="text-white">{formatLargeNumber(friendlyUnit.stats.attack)}</span></div>
                <div className="text-gray-300">防御: <span className="text-white">{formatLargeNumber(friendlyUnit.stats.defense)}</span></div>
                <div className="col-span-2 text-gray-300">神性: <span className="text-white">{divinityText}</span></div>
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
            <CollapsiblePanel title={`背包 (金币: ${formatLargeNumber(friendlyUnit.gold || 0)})`} defaultExpanded={false}>
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