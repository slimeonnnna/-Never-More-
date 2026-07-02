
import {
  Equipment, Attribute, AttributeType, EquipmentSlot, EquipmentQuality, ChestType,
} from '../types';
import {
  EQUIPMENT_BASE_NAMES, EQUIPMENT_PREFIX_CHARS, ORDERED_QUALITIES, getRealmTierInfo, ATTRIBUTE_GENERATION_CONFIG, CHEST_CONFIG
} from '../constants';
import { calculateItemCombatPower } from './equipmentCalculations';
import { formatLargeNumber } from '../utils';

export const getWeightedRandomAttributeType = (): AttributeType => {
    const totalWeight = Object.values(ATTRIBUTE_GENERATION_CONFIG).reduce((sum, current) => sum + current.weight, 0);
    let random = Math.random() * totalWeight;

    for (const key in ATTRIBUTE_GENERATION_CONFIG) {
        const attrType = key as AttributeType;
        const config = ATTRIBUTE_GENERATION_CONFIG[attrType];
        if (random < config.weight) {
            return attrType;
        }
        random -= config.weight;
    }
    return AttributeType.Attack;
};

const determineQuality = (baseQuality: EquipmentQuality, baseQualityChance: number, floor: number): { quality: EquipmentQuality, qualityIndex: number, qualityLevel?: number } => {
    let minQualityIndex = ORDERED_QUALITIES.indexOf(baseQuality);
    let effectiveBaseChance = baseQualityChance;

    // The new floor-based logic applies ONLY to monster drops, which have a baseQuality of Common.
    if (baseQuality === EquipmentQuality.Common) {
        const baseFloor = Math.max(0, floor - 1);
        let baseChanceForCycle = 0.8;
        let floorsIntoCycle = baseFloor;

        if (baseFloor >= 80) {
            minQualityIndex = 1 + Math.floor((baseFloor - 80) / 50);
            baseChanceForCycle = 0.5;
            floorsIntoCycle = (baseFloor - 80) % 50;
        }
        
        minQualityIndex = Math.min(minQualityIndex, ORDERED_QUALITIES.length - 1);
        effectiveBaseChance = Math.max(0, baseChanceForCycle - (floorsIntoCycle * 0.01));
    }

    const rand = Math.random();

    if (rand < effectiveBaseChance) {
        return { quality: ORDERED_QUALITIES[minQualityIndex], qualityIndex: minQualityIndex };
    }

    // Probabilistic roll for higher tiers
    let cumulativeChance = effectiveBaseChance;
    let remainingProbability = 1.0 - effectiveBaseChance;

    for (let i = minQualityIndex + 1; i < ORDERED_QUALITIES.length; i++) {
        const prob = remainingProbability * 0.5;
        if (rand < cumulativeChance + prob) {
            return { quality: ORDERED_QUALITIES[i], qualityIndex: i };
        }
        cumulativeChance += prob;
        remainingProbability *= 0.5;
    }

    // Void+ Logic
    let qualityLevel = 1;
    let probForNextLevel = remainingProbability * 0.5;
    while (rand >= cumulativeChance + probForNextLevel && probForNextLevel > Number.EPSILON) {
        cumulativeChance += probForNextLevel;
        probForNextLevel *= 0.5;
        qualityLevel++;
    }
    return { quality: EquipmentQuality.Void, qualityIndex: ORDERED_QUALITIES.indexOf(EquipmentQuality.Void), qualityLevel };
};

export const rollAndAddAttribute = (rolledAttributes: Map<AttributeType, { value: number, count: number }>, itemRealmIndex: number, forcedType?: AttributeType) => {
    const type = forcedType || getWeightedRandomAttributeType();
    const itemTierInfo = getRealmTierInfo(itemRealmIndex);
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

    const finalValue = Math.round(value * (1 + (itemRealmIndex / 200)));
    const current = rolledAttributes.get(type) || { value: 0, count: 0 };
    rolledAttributes.set(type, {
        value: current.value + (finalValue || 1),
        count: current.count + 1
    });
};

export const generateEquipment = (
    itemRealmIndex: number,
    baseQuality: EquipmentQuality,
    baseQualityChance: number,
    floor: number = 1,
    overrideQuality?: EquipmentQuality,
    overrideSlot?: EquipmentSlot,
    overrideQualityLevel?: number
): Equipment | null => {
    const itemTierInfo = getRealmTierInfo(itemRealmIndex);
    const { quality, qualityIndex, qualityLevel } = overrideQuality 
        ? { quality: overrideQuality, qualityIndex: ORDERED_QUALITIES.indexOf(overrideQuality), qualityLevel: overrideQualityLevel } 
        : determineQuality(baseQuality, baseQualityChance, floor);

    const numRolls = (qualityIndex + 1) + (qualityLevel || 0);
    const rolledAttributes = new Map<AttributeType, { value: number, count: number }>();
    const legendaryQualityIndex = ORDERED_QUALITIES.indexOf(EquipmentQuality.Legendary);
    const mustHaveDivinity = qualityIndex >= legendaryQualityIndex;
    let numberOfRandomRolls = numRolls;

    if (mustHaveDivinity) {
        rollAndAddAttribute(rolledAttributes, itemRealmIndex, AttributeType.Divinity);
        numberOfRandomRolls--;
    }
    for (let i = 0; i < numberOfRandomRolls; i++) {
        rollAndAddAttribute(rolledAttributes, itemRealmIndex);
    }
    const attributes: Attribute[] = Array.from(rolledAttributes, ([type, data]) => ({ type, value: data.value, rollCount: data.count }));

    const slot = overrideSlot || Object.keys(EQUIPMENT_BASE_NAMES)[Math.floor(Math.random() * Object.keys(EQUIPMENT_BASE_NAMES).length)] as EquipmentSlot;
    const numPrefixChars = Math.floor(Math.random() * 4) + 1;
    let prefix = Array.from({ length: numPrefixChars }, () => EQUIPMENT_PREFIX_CHARS[Math.floor(Math.random() * EQUIPMENT_PREFIX_CHARS.length)]).join('');
    if (Math.random() < 0.1) prefix += '之';
    const baseName = EQUIPMENT_BASE_NAMES[slot][Math.floor(Math.random() * EQUIPMENT_BASE_NAMES[slot].length)];
    const nameTemplate = prefix + baseName;

    const qualityName = qualityLevel ? `${quality}${formatLargeNumber(qualityLevel)}重` : quality;
    const name = `[${itemTierInfo.name}][${qualityName}] ${nameTemplate}`;

    const item: Omit<Equipment, 'combatPower'> = {
        id: `item-${crypto.randomUUID()}-${Math.random()}`, name, slot, quality, qualityLevel, attributes,
        realmIndex: itemRealmIndex, equipmentRealm: itemTierInfo.name,
    };
    return { ...item, combatPower: calculateItemCombatPower(item) };
};

export const generateChestLoot = (chestType: ChestType, realmIndex: number, floor: number): Equipment[] => {
    const allLoot: Equipment[] = [];
    const chestConfig = CHEST_CONFIG[chestType];
    const firstLoot = generateEquipment(realmIndex, chestConfig.baseQuality, 0.8, floor);
    if (firstLoot) {
        allLoot.push(firstLoot);
        while (Math.random() < chestConfig.chainChance) {
            const extraLoot = generateEquipment(realmIndex, chestConfig.baseQuality, 0.8, floor);
            if (extraLoot) allLoot.push(extraLoot);
            else break;
        }
    }
    return allLoot;
};
