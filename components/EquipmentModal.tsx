
import React from 'react';
import { Equipment, EquipmentSlot, Attribute, AttributeType } from '../types';
import { QUALITY_CONFIG, ATTRIBUTE_CONFIG } from '../constants';
import { formatLargeNumber, calculateAttributePerfection } from '../utils';

interface EquipmentModalProps {
  selectedItem: Equipment;
  equippedItem: Equipment | null;
  source: 'inventory' | 'equipped';
  onClose: () => void;
  onEquip: (item: Equipment) => void;
  onUnequip: (slot: EquipmentSlot) => void;
  onRefine: (item: Equipment) => void;
  onUseTemperingStone: (item: Equipment, attrType: AttributeType) => void;
  temperingStones: number;
  isReadOnly?: boolean;
}

const formatAttribute = (attr: Attribute): string => {
  const config = ATTRIBUTE_CONFIG[attr.type];
  const valueStr = config.isPercent ? attr.value.toLocaleString() : formatLargeNumber(attr.value);
  return `${config.label} +${valueStr}${config.isPercent ? '%' : ''}`;
};

const ItemDetail: React.FC<{
    item: Equipment;
    title: string;
    comparisonItem?: Equipment | null;
    isActionable?: boolean;
    onUseTemperingStone?: (item: Equipment, attrType: AttributeType) => void;
    temperingStones?: number;
    isReadOnly?: boolean;
}> = ({ item, title, comparisonItem, isActionable = false, onUseTemperingStone, temperingStones = 0, isReadOnly = false }) => {
    const qualityClass = QUALITY_CONFIG[item.quality].cssClass;
    const comparisonAttrs = new Map(comparisonItem?.attributes.map(a => [a.type, a.value]));

    const qualityName = item.qualityLevel ? `${item.quality}${formatLargeNumber(item.qualityLevel)}重` : item.quality;
    const displayName = item.name.replace(`[${item.quality}]`, `[${qualityName}]`);

    return (
        <div>
            <h3 className="font-bold text-lg mb-2 text-yellow-400">{title}</h3>
            <div className={`font-bold mb-2 flex items-center gap-2 ${qualityClass}`}>
                {displayName}
            </div>
            <div className="text-gray-400 mb-1">境界: {item.equipmentRealm} | {item.slot}</div>
            <div className="text-yellow-400 font-semibold mb-2">战力: {formatLargeNumber(item.combatPower)}</div>
            <div className="border-t border-gray-700 my-1"></div>
            <ul className="space-y-1">
                {item.attributes.map((attr, index) => {
                    let diffIndicator = null;
                    if (comparisonItem) {
                        const equippedValue = (comparisonAttrs.get(attr.type) || 0) as number;
                        const diff = (attr.value as number) - equippedValue;
                        if (diff !== 0) {
                            const formattedDiff = formatLargeNumber(Math.abs(diff));
                            if (diff > 0) {
                                diffIndicator = <span className="text-green-400 ml-2">(+{formattedDiff})</span>;
                            } else {
                                diffIndicator = <span className="text-red-400 ml-2">(-{formattedDiff})</span>;
                            }
                        }
                    }

                    const perfection = calculateAttributePerfection(attr, item.realmIndex);

                    return (
                        <li key={index} className="text-cyan-400 flex justify-between items-center">
                           <div className="flex items-center gap-2">
                                <span>{formatAttribute(attr)}{diffIndicator}</span>
                                {perfection > 0 && (
                                    <span className="text-xs text-yellow-300/80 ml-2 font-mono">
                                        ({perfection.toFixed(1)}%)
                                    </span>
                                )}
                           </div>
                           {isActionable && !isReadOnly && onUseTemperingStone && (
                                <button
                                    onClick={() => onUseTemperingStone(item, attr.type)}
                                    disabled={perfection >= 100 || temperingStones <= 0}
                                    className="text-xs px-2 py-1 bg-cyan-700 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white transition-colors"
                                    title={perfection >= 100 ? "已达完美" : (temperingStones <= 0 ? "没有淬炼石" : "使用淬炼石")}
                                >
                                    淬炼
                                </button>
                           )}
                        </li>
                    );
                })}
                {item.attributes.length === 0 && (
                    <li className="text-gray-500">无特殊词条</li>
                )}
            </ul>
        </div>
    );
};

export const EquipmentModal: React.FC<EquipmentModalProps> = ({
  selectedItem, equippedItem, source, onClose, onEquip, onUnequip, onRefine, onUseTemperingStone, temperingStones, isReadOnly = false
}) => {
  const isComparing = source === 'inventory' && equippedItem && equippedItem.id !== selectedItem.id;
  const qualityClass = QUALITY_CONFIG[selectedItem.quality].cssClass;
  
  const refineButtonText = '炼化';
  const refineButtonTitle = `炼化装备获得 ${formatLargeNumber(selectedItem.combatPower)} 金币`;


  return (
    <div 
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl w-full max-w-lg lg:max-w-3xl m-4 animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className={`text-xl font-bold ${qualityClass} flex items-center gap-2`}>
            装备详情
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>

        <div className={`p-4 grid gap-4 ${isComparing ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          {isComparing && equippedItem && (
            <div className="pr-4 border-r border-gray-700">
                <ItemDetail item={equippedItem} title="当前装备" isReadOnly={isReadOnly}/>
            </div>
          )}

          <div className={isComparing ? 'pl-4' : ''}>
             <ItemDetail 
                item={selectedItem} 
                title={isComparing ? '选中装备' : '装备信息'} 
                comparisonItem={isComparing ? equippedItem : undefined}
                isActionable={true}
                onUseTemperingStone={onUseTemperingStone}
                temperingStones={temperingStones}
                isReadOnly={isReadOnly}
             />
          </div>
        </div>

        {!isReadOnly && (
          <div className="p-4 bg-gray-900/50 flex justify-end gap-3 rounded-b-lg">
            {source === 'inventory' && (
              <>
                <button
                  onClick={() => onRefine(selectedItem)}
                  className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors"
                  title={refineButtonTitle}
                >
                  {refineButtonText}
                </button>
                <button 
                  onClick={() => onEquip(selectedItem)}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
                >
                  {isComparing ? '替换' : '装备'}
                </button>
              </>
            )}
            {source === 'equipped' && (
              <button
                onClick={() => onUnequip(selectedItem.slot)}
                className="px-4 py-2 bg-yellow-600 text-black font-semibold rounded-md hover:bg-yellow-700 transition-colors"
              >
                卸下
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
