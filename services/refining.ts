
import { Equipment, EquipmentQuality, Player, AttributeType } from '../types';
import { ORDERED_QUALITIES, ATTRIBUTE_GENERATION_CONFIG, getRealmTierInfo } from '../constants';
import { generateEquipment } from './equipmentGeneration';
import { calculateItemCombatPower } from './equipmentCalculations';

export const REFINING_UPGRADE_CHANCE = 0.05;

export const attemptRefineUpgrade = (itemToRefine: Equipment, player: Player): Equipment | null => {
  if (Math.random() >= REFINING_UPGRADE_CHANCE) {
    return null;
  }
  
  const currentQualityIndex = ORDERED_QUALITIES.indexOf(itemToRefine.quality);
  if (currentQualityIndex >= ORDERED_QUALITIES.length - 1) {
    // Already at max quality (Void), cannot upgrade further this way.
    return null;
  }
  
  const nextQuality = ORDERED_QUALITIES[currentQualityIndex + 1];
  
  // Use generateEquipment and force the quality.
  const newItem = generateEquipment(
    itemToRefine.realmIndex, 
    EquipmentQuality.Common, // base quality doesn't matter
    0, // base quality chance doesn't matter
    player.currentFloor,
    nextQuality
  );
  
  if (!newItem) {
    return null;
  }

  // Ensure Divinity attribute exists.
  const hasDivinity = newItem.attributes.some(attr => attr.type === AttributeType.Divinity);
  if (hasDivinity) {
    return newItem;
  }
  
  // Add Divinity attribute if it's missing.
  const itemTierInfo = getRealmTierInfo(newItem.realmIndex);
  const config = ATTRIBUTE_GENERATION_CONFIG[AttributeType.Divinity];
  const min = config.range[0];
  const max = config.range[1] + itemTierInfo.tierIndex;
  const value = Math.floor(Math.random() * (max - min + 1)) + min;
  const finalValue = Math.round(value * (1 + (newItem.realmIndex / 200)));

  const divinityAttribute = {
      type: AttributeType.Divinity,
      value: finalValue || 1,
      rollCount: 1,
  };
  
  newItem.attributes.push(divinityAttribute);
  newItem.combatPower = calculateItemCombatPower(newItem);
  
  return newItem;
};
