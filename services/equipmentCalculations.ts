
import {
  Equipment, Attribute, AttributeType,
} from '../types';
import {
  ATTRIBUTE_GENERATION_CONFIG, getRealmTierInfo,
} from '../constants';

export const calculateItemCombatPower = (item: Omit<Equipment, 'combatPower'>): number => {
    let totalPower = 0;
    const attributesMap = new Map(item.attributes.map(attr => [attr.type, attr.value]));

    attributesMap.forEach((value, type) => {
        switch (type) {
            case AttributeType.Attack:
            case AttributeType.Defense:
                totalPower += value * 2;
                break;
            case AttributeType.MagicResist:
                 totalPower += value * 1;
                break;
            case AttributeType.LifeRegen:
                totalPower += value * 10;
                break;
        }
    });
    
    if (attributesMap.has(AttributeType.Divinity)) {
        const divinityValue = attributesMap.get(AttributeType.Divinity)!;
        let attackValueForPowerCalc = 0;

        if (attributesMap.has(AttributeType.Attack)) {
            attackValueForPowerCalc = attributesMap.get(AttributeType.Attack)!;
        } else {
            const itemTierInfo = getRealmTierInfo(item.realmIndex);
            const attackConfig = ATTRIBUTE_GENERATION_CONFIG[AttributeType.Attack];
            const baseMax = attackConfig.range[1];
            
            const minAttack = 1;
            const maxAttack = baseMax * Math.pow(50, itemTierInfo.tierIndex);
            
            attackValueForPowerCalc = Math.floor((minAttack + maxAttack) / 2);
        }
        
        totalPower += divinityValue * attackValueForPowerCalc;
    }

    return Math.round(totalPower);
};

export const calculateTheoreticalMaxValueForAttr = (item: Equipment, attrType: AttributeType): number => {
    const attribute = item.attributes.find(a => a.type === attrType);
    if (!attribute || !attribute.rollCount || attribute.rollCount === 0) {
        return 0;
    }

    const itemTierInfo = getRealmTierInfo(item.realmIndex);
    if (itemTierInfo.tierIndex === -1) return 0;

    const attrGenConfig = ATTRIBUTE_GENERATION_CONFIG[attrType];
    if (!attrGenConfig) return 0;

    const baseMaxValue = attrGenConfig.range[1];
    let tierMax: number;
    const tierMultiplier = Math.pow(50, itemTierInfo.tierIndex);

    if (attrType === AttributeType.Divinity) {
         tierMax = baseMaxValue + itemTierInfo.tierIndex;
    } else {
         tierMax = baseMaxValue * tierMultiplier;
    }

    const singleRollMax = Math.round(tierMax * (1 + (item.realmIndex / 200)));
    const totalMax = singleRollMax * attribute.rollCount;
    return totalMax;
};
