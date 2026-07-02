
import { Equipment, AttributeType, Attribute } from '../types';
import { ATTRIBUTE_CONFIG, getRealmTierInfo, ATTRIBUTE_GENERATION_CONFIG, QUALITY_CONFIG } from '../constants';
import { formatLargeNumber } from '../utils';
import { calculateItemCombatPower } from './equipmentCalculations';
import { rollAndAddAttribute, getWeightedRandomAttributeType } from './equipmentGeneration';

export const addRandomAttributes = (item: Equipment, count: number): { item: Equipment; logs: string[] } => {
    if (count <= 0) return { item, logs: [] };

    const logs: string[] = [];
    const itemTierInfo = getRealmTierInfo(item.realmIndex);
    
    const attributesMap = new Map<AttributeType, { value: number, count: number }>(
        item.attributes.map(attr => [attr.type, { value: attr.value, count: attr.rollCount || 1 }])
    );

    for (let i = 0; i < count; i++) {
        const type = getWeightedRandomAttributeType();
        
        const config = ATTRIBUTE_GENERATION_CONFIG[type];
        const baseMin = config.range[0];
        const baseMax = config.range[1];
        
        const tierMultiplier = Math.pow(50, itemTierInfo.tierIndex);
        let value;

        if (type === AttributeType.Divinity) {
            const min = baseMin;
            const max = baseMax + itemTierInfo.tierIndex;
            value = Math.floor(Math.random() * (max - min + 1)) + min;
        } else if (type === AttributeType.LifeRegen) {
            const min = baseMin;
            const max = baseMax * tierMultiplier;
            value = Math.floor(Math.random() * (max - min + 1)) + min;
        } else { 
            const min = itemTierInfo.tierIndex > 0 ? 1 : baseMin;
            const max = baseMax * tierMultiplier;
            value = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        
        const finalValue = Math.round(value * (1 + (item.realmIndex / 200))) || 1;
        
        const current = attributesMap.get(type) || { value: 0, count: 0 };
        attributesMap.set(type, {
            value: current.value + finalValue,
            count: current.count + 1
        });
        
        const attrLabel = ATTRIBUTE_CONFIG[type].label;
        logs.push(`新增词条: <span class="text-cyan-300">${attrLabel}</span> +${formatLargeNumber(finalValue)}。`);
    }

    const newAttributes: Attribute[] = Array.from(attributesMap, ([type, data]) => ({ type, value: data.value, rollCount: data.count }));

    const newItemWithoutCP: Omit<Equipment, 'combatPower'> = { ...item, attributes: newAttributes };
    const newCombatPower = calculateItemCombatPower(newItemWithoutCP);
    const upgradedItem: Equipment = { ...newItemWithoutCP, combatPower: newCombatPower };
    
    return { item: upgradedItem, logs };
};

export const devourVoidEquipment = (winner: Equipment, loser: Equipment): { upgradedItem: Equipment; enhancementLogs: string[] } => {
    const winnerLevel = winner.qualityLevel || 0;
    const loserLevel = loser.qualityLevel || 0;
    const newQualityLevel = winnerLevel + loserLevel + 1;
    const numAttributesToAdd = newQualityLevel - winnerLevel;

    let baseItemForUpgrade: Equipment = {
        ...winner,
        qualityLevel: newQualityLevel,
    };
    
    const oldQualityName = winner.qualityLevel ? `${winner.quality}${winner.qualityLevel}重` : winner.quality;
    const newQualityName = `虚空${formatLargeNumber(newQualityLevel)}重`;
    baseItemForUpgrade.name = winner.name.replace(`[${oldQualityName}]`, `[${newQualityName}]`);
    
    const { item: upgradedItem, logs } = addRandomAttributes(baseItemForUpgrade, numAttributesToAdd);
    
    return { upgradedItem, enhancementLogs: logs };
};

export const reRollDivinityOnDrop = (item: Equipment): { newItem: Equipment, wasModified: boolean } => {
    const divinityAttr = item.attributes.find(a => a.type === AttributeType.Divinity);

    if (!divinityAttr || !divinityAttr.rollCount || divinityAttr.rollCount <= 1) {
        return { newItem: item, wasModified: false };
    }

    const rollsToReRoll = divinityAttr.rollCount - 1;
    
    const newAttributesMap = new Map<AttributeType, { value: number, count: number }>();
    item.attributes.forEach(attr => {
        if (attr.type !== AttributeType.Divinity) {
            newAttributesMap.set(attr.type, { value: attr.value, count: attr.rollCount || 1 });
        }
    });

    // Add back one roll of Divinity.
    rollAndAddAttribute(newAttributesMap, item.realmIndex, AttributeType.Divinity);

    // Re-roll the other rolls.
    for (let i = 0; i < rollsToReRoll; i++) {
        rollAndAddAttribute(newAttributesMap, item.realmIndex);
    }
    
    const finalAttributes: Attribute[] = Array.from(newAttributesMap, ([type, data]) => ({ type, value: data.value, rollCount: data.count }));

    const newItemWithoutCP: Omit<Equipment, 'combatPower'> = { ...item, attributes: finalAttributes };
    const newCombatPower = calculateItemCombatPower(newItemWithoutCP);
    const newItem: Equipment = { ...newItemWithoutCP, combatPower: newCombatPower };

    return { newItem, wasModified: true };
};
