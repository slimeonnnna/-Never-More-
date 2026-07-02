import { Monster, Equipment, EquipmentSlot, EquipmentQuality, AttributeType, Attribute } from '../types';
import { REALMS } from '../realmConstants';
import { EQUIPMENT_SLOTS_ORDER, ORDERED_QUALITIES, PLAYER_BASE_STATS, EQUIPMENT_PREFIX_CHARS, EQUIPMENT_BASE_NAMES, getRealmTierInfo, ATTRIBUTE_GENERATION_CONFIG } from '../constants';
import { generateLoot } from './loot';
import { calculateItemCombatPower } from './equipmentCalculations';


const calculateSingleRollMaxValue = (attrType: AttributeType, realmIndex: number): number => {
    const itemTierInfo = getRealmTierInfo(realmIndex);
    if (itemTierInfo.tierIndex === -1) return 1;

    const attrGenConfig = ATTRIBUTE_GENERATION_CONFIG[attrType];
    if (!attrGenConfig) return 1;

    const baseMaxValue = attrGenConfig.range[1];
    const tierMultiplier = Math.pow(50, itemTierInfo.tierIndex);
    let tierMax: number;

    if (attrType === AttributeType.Divinity) {
         tierMax = baseMaxValue + itemTierInfo.tierIndex;
    } else {
         tierMax = baseMaxValue * tierMultiplier;
    }

    const singleRollMax = Math.round(tierMax * (1 + (realmIndex / 200)));
    return Math.max(1, singleRollMax);
}

const calculateRequiredRolls = (attrType: AttributeType, totalValue: number, realmIndex: number): number => {
    if (totalValue <= 0) return 0;
    const maxSingleRollValue = calculateSingleRollMaxValue(attrType, realmIndex);
    return Math.ceil(totalValue / maxSingleRollValue);
}

/**
 * Generates an equipment sheet (equipped items and inventory) for any character by reverse-engineering from its stats.
 */
export function generateCharacterSheet(monster: Omit<Monster, 'equipped' | 'inventory'>): { equipped: Partial<Record<EquipmentSlot, Equipment>>, inventory: Equipment[] } {
    // 1. Calculate the base stats a player would have at the monster's realm level.
    const realmData = REALMS[monster.realmIndex];
    const permBonusPoints = realmData?.totalPointsBonus || 0;
    const permBonusAttack = Math.floor(permBonusPoints / 2);
    const permBonusDefense = permBonusPoints - permBonusAttack;

    const basePlayerAttack = PLAYER_BASE_STATS.attack + permBonusAttack;
    const basePlayerDefense = PLAYER_BASE_STATS.defense + permBonusDefense;
    
    // 2. Reverse-engineer the total stats required from equipment, excluding floor bonus divinity.
    const floorBonusDivinity = monster.floorBonusDivinity || 0;
    const totalGearDivinity = Math.round(monster.stats.divinity - floorBonusDivinity);

    // De-inflate the monster's final stats to find its base stats (from realm+rank) before ANY divinity was applied.
    const baseMonsterAttack = monster.stats.attack / Math.pow(1.01, monster.stats.divinity);
    const baseMonsterDefense = monster.stats.defense / Math.pow(1.01, monster.stats.divinity);
    
    // 3. The total raw stats the equipment must provide is the difference between the monster's base and a player's base at that realm.
    const totalGearAttack = Math.max(0, Math.round(baseMonsterAttack - basePlayerAttack));
    const totalGearDefense = Math.max(0, Math.round(baseMonsterDefense - basePlayerDefense));
    
    // 4. Distribute total required stats among 12 equipment slots.
    const slotStats = EQUIPMENT_SLOTS_ORDER.map(() => ({
        attack: 0,
        defense: 0,
        divinity: 0,
        magicResist: 0,
        lifeRegen: 0
    }));

    const distributeValue = (totalValue: number, key: 'attack' | 'defense' | 'divinity') => {
        if (totalValue <= 0) return;

        // For very large numbers, use proportional distribution to avoid freezing.
        if (totalValue > 2_000_000) {
            const randoms = Array.from({ length: 12 }, () => Math.random());
            const sumOfRandoms = randoms.reduce((sum, r) => sum + r, 0);

            let distributedSum = 0;
            for (let i = 0; i < 12; i++) {
                const value = Math.floor(totalValue * (randoms[i] / sumOfRandoms));
                slotStats[i][key] += value;
                distributedSum += value;
            }

            let remainder = totalValue - distributedSum;
            while (remainder > 0) {
                const randomIndex = Math.floor(Math.random() * 12);
                slotStats[randomIndex][key] += 1;
                remainder--;
            }
        } else {
            let remaining = totalValue;
            while (remaining > 0) {
                const randomIndex = Math.floor(Math.random() * 12);
                slotStats[randomIndex][key] += 1;
                remaining--;
            }
        }
    };

    distributeValue(totalGearAttack, 'attack');
    distributeValue(totalGearDefense, 'defense');
    distributeValue(totalGearDivinity, 'divinity');

    // 4.5. Add cosmetic stats (MagicResist, LifeRegen) randomly.
    const itemTierInfo = getRealmTierInfo(monster.realmIndex);

    const generateCosmeticValue = (attrType: AttributeType): number => {
        const config = ATTRIBUTE_GENERATION_CONFIG[attrType];
        const baseMin = config.range[0];
        const baseMax = config.range[1];
        
        const tierMultiplier = Math.pow(50, itemTierInfo.tierIndex);
        let value;

        if (attrType === AttributeType.LifeRegen) {
            const min = baseMin;
            const max = baseMax * tierMultiplier;
            value = Math.floor(Math.random() * (max - min + 1)) + min;
        } else { // MagicResist
            const min = itemTierInfo.tierIndex > 0 ? 1 : baseMin;
            const max = baseMax * tierMultiplier;
            value = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        return Math.round(value * (1 + (monster.realmIndex / 200)));
    };
    
    for (let i = 0; i < EQUIPMENT_SLOTS_ORDER.length; i++) {
        if (Math.random() < 0.3) {
            slotStats[i].magicResist = generateCosmeticValue(AttributeType.MagicResist);
        }
        if (Math.random() < 0.15) {
            slotStats[i].lifeRegen = generateCosmeticValue(AttributeType.LifeRegen);
        }
    }

    // 5. For each slot, create an item whose quality and affixes match the stats it needs to provide.
    const equipmentSet: Partial<Record<EquipmentSlot, Equipment>> = {};

    for (let i = 0; i < EQUIPMENT_SLOTS_ORDER.length; i++) {
        const slot = EQUIPMENT_SLOTS_ORDER[i];
        const statsForThisSlot = slotStats[i];
        const attributes: Attribute[] = [];
        let totalRequiredRolls = 0;

        const addAttribute = (type: AttributeType, value: number) => {
            if (value <= 0) return;
            const rolls = calculateRequiredRolls(type, value, monster.realmIndex);
            totalRequiredRolls += rolls;
            attributes.push({ type, value, rollCount: rolls });
        };
        
        addAttribute(AttributeType.Attack, statsForThisSlot.attack);
        addAttribute(AttributeType.Defense, statsForThisSlot.defense);
        addAttribute(AttributeType.Divinity, statsForThisSlot.divinity);
        addAttribute(AttributeType.MagicResist, statsForThisSlot.magicResist);
        addAttribute(AttributeType.LifeRegen, statsForThisSlot.lifeRegen);
        
        if (attributes.length === 0) {
            continue;
        }

        const qualityIndex = Math.max(0, totalRequiredRolls - 1);
        let quality: EquipmentQuality;
        let qualityLevel: number | undefined;

        const voidIndex = ORDERED_QUALITIES.indexOf(EquipmentQuality.Void);
        if (qualityIndex >= voidIndex) {
            quality = EquipmentQuality.Void;
            qualityLevel = qualityIndex - voidIndex + 1;
        } else {
            quality = ORDERED_QUALITIES[qualityIndex];
            qualityLevel = undefined;
        }
        
        const numPrefixChars = Math.floor(Math.random() * 2) + 1;
        let prefix = Array.from({ length: numPrefixChars }, () => EQUIPMENT_PREFIX_CHARS[Math.floor(Math.random() * EQUIPMENT_PREFIX_CHARS.length)]).join('');
        const baseName = EQUIPMENT_BASE_NAMES[slot][Math.floor(Math.random() * EQUIPMENT_BASE_NAMES[slot].length)];
        const nameTemplate = prefix + baseName;

        const qualityName = qualityLevel ? `${quality}${qualityLevel}重` : quality;
        const name = `[${itemTierInfo.name}][${qualityName}] ${nameTemplate}`;

        const item: Omit<Equipment, 'combatPower'> = {
            id: `friendly-item-${slot}-${crypto.randomUUID()}-${Math.random()}`,
            name,
            slot,
            quality,
            qualityLevel,
            attributes,
            realmIndex: monster.realmIndex,
            equipmentRealm: itemTierInfo.name,
        };
        equipmentSet[slot] = { ...item, combatPower: calculateItemCombatPower(item) };
    }


    // 6. Generate a plausible inventory for the character.
    const { equipment: inventory } = generateLoot(monster as Monster, monster.realmIndex, false);

    return { equipped: equipmentSet, inventory };
}


/**
 * Generates a friendly unit by creating its character sheet and setting the isFriendly flag.
 */
export function generateFriendlyUnit(monster: Monster): Monster {
    const { equipped, inventory } = generateCharacterSheet(monster);
    return { ...monster, equipped, inventory, isFriendly: true };
}
