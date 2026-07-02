
import { GridBlock, Attribute, AttributeType, Equipment, EquipmentQuality } from './types';
import { getRealmTierInfo, ATTRIBUTE_GENERATION_CONFIG, ORDERED_QUALITIES } from './constants';

const preGoogolUnits = [
    // Smallest to largest for easier processing
    { name: '万', power: 4 }, { name: '亿', power: 8 }, { name: '兆', power: 12 },
    { name: '京', power: 16 }, { name: '垓', power: 20 }, { name: '秭', power: 24 },
    { name: '穰', power: 28 }, { name: '沟', power: 32 }, { name: '涧', power: 36 },
    { name: '正', power: 40 }, { name: '载', power: 44 }, { name: '极', power: 48 },
    { name: '恒河沙', power: 52 }, { name: '阿僧祗', power: 56 }, { name: '那由他', power: 60 },
    { name: '不可思议', power: 64 }, { name: '无量', power: 68 }, { name: '大数', power: 72 },
    { name: '无边', power: 76 }, { name: '无数', power: 80 }, { name: '无知', power: 84 },
    { name: '无想', power: 88 }, { name: '无觉', power: 92 },
];
const GOOGOL_UNIT = { name: '古戈尔', power: 100 };
const units = [...preGoogolUnits, GOOGOL_UNIT];

const formatWithUnits = (n: number, unitsToUse: {name: string, power: number}[]) => {
    if (n < 10000) {
        return Math.round(n).toLocaleString();
    }
    
    let maxUnitIdx = -1;
    for (let i = 0; i < unitsToUse.length; i++) {
        if (n >= (10 ** unitsToUse[i].power)) {
            maxUnitIdx = i;
        } else {
            break;
        }
    }

    if (maxUnitIdx === -1) {
        return Math.round(n).toLocaleString();
    }
    
    if (maxUnitIdx > 0) {
        const prevUnit = unitsToUse[maxUnitIdx - 1];
        const valueInPrevUnit = Math.floor(n / (10 ** prevUnit.power));
        if (valueInPrevUnit < 100_000) {
             return `${valueInPrevUnit}${prevUnit.name}`;
        }
    }
    
    const finalUnit = unitsToUse[maxUnitIdx];
    const value = Math.floor(n / (10 ** finalUnit.power));
    return `${value}${finalUnit.name}`;
};

export const formatLargeNumber = (num: number): string => {
    if (typeof num !== 'number' || !isFinite(num)) {
        return num === Infinity ? 'MAX' : String(num);
    }

    const sign = num < 0 ? '-' : '';
    let n = Math.abs(num);
    
    const googolPowerValue = Math.pow(10, GOOGOL_UNIT.power);

    if (n < googolPowerValue) {
        return sign + formatWithUnits(n, units);
    }
    
    let googolCount = 0;
    
    while (n >= googolPowerValue) {
        n /= googolPowerValue;
        googolCount++;
    }

    const prefix = formatWithUnits(n, preGoogolUnits);
    const googolSuffix = GOOGOL_UNIT.name.repeat(googolCount);

    return `${sign}${prefix}${googolSuffix}`;
};

export const isPathPossible = (grid: GridBlock[], playerIndex: number, targetIndex: number, isMapHostile: boolean): boolean => {
    if (playerIndex === -1 || targetIndex === -1) return false;

    const width = 4;
    const height = 4;
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // 4-way cardinal directions
    
    // Check if a block is passable
    const isBlockPassable = (block: GridBlock) => {
        if (['empty', 'player', 'item', 'guarded_treasure'].includes(block.type)) return true;
        if (block.type === 'monster' || block.type === 'friendly') {
            const isSticky = block.stickiness && block.stickiness > 0;
            return !isMapHostile && !isSticky;
        }
        return false;
    };
    
    // BFS to find all reachable empty/player/item spots from the player's position
    const queue: number[] = [playerIndex];
    const visited = new Set<number>([playerIndex]);
    const reachableSpots = new Set<number>([playerIndex]);

    while (queue.length > 0) {
        const currentIndex = queue.shift()!;
        const currentX = currentIndex % width;
        const currentY = Math.floor(currentIndex / width);

        for (const [dx, dy] of directions) {
            const neighborX = currentX + dx;
            const neighborY = currentY + dy;
            
            if (neighborX >= 0 && neighborX < width && neighborY >= 0 && neighborY < height) {
                const neighborIndex = neighborY * width + neighborX;
                if (!visited.has(neighborIndex) && isBlockPassable(grid[neighborIndex])) {
                    visited.add(neighborIndex);
                    queue.push(neighborIndex);
                    reachableSpots.add(neighborIndex);
                }
            }
        }
    }
    
    // If the target itself is a passable block, it's reachable
    if (isBlockPassable(grid[targetIndex]) && reachableSpots.has(targetIndex)) {
        return true;
    }

    // A target is reachable if it's cardinally adjacent to any reachable empty spot.
    const targetX = targetIndex % width;
    const targetY = Math.floor(targetIndex / width);

    for (const [dx, dy] of directions) {
        const adjX = targetX + dx;
        const adjY = targetY + dy;
        
        if (adjX >= 0 && adjX < width && adjY >= 0 && adjY < height) {
             const adjIndex = adjY * width + adjX;
             if (reachableSpots.has(adjIndex)) {
                return true;
             }
        }
    }

    return false;
};

export const calculateAttributePerfection = (attribute: Attribute, itemRealmIndex: number): number => {
    if (!attribute.rollCount || attribute.rollCount === 0) {
        // Return 0 for old items without rollCount to indicate missing data.
        return 0;
    }

    const itemTierInfo = getRealmTierInfo(itemRealmIndex);
    if (itemTierInfo.tierIndex === -1) return 0;

    const attrGenConfig = ATTRIBUTE_GENERATION_CONFIG[attribute.type];
    if (!attrGenConfig) return 0;

    const baseMaxValue = attrGenConfig.range[1];
    let tierMax: number;
    const tierMultiplier = Math.pow(50, itemTierInfo.tierIndex);

    if (attribute.type === AttributeType.Divinity) {
         tierMax = baseMaxValue + itemTierInfo.tierIndex;
    } else { // Attack, Defense, MagicResist, LifeRegen
         tierMax = baseMaxValue * tierMultiplier;
    }

    // Apply the same small bonus from the realm index within the tier to the max value
    const singleRollMax = Math.round(tierMax * (1 + (itemRealmIndex / 200)));
    const totalMax = singleRollMax * attribute.rollCount;

    if (totalMax <= 0) {
        return attribute.value === 0 ? 100 : 0;
    }
    
    const perfection = (attribute.value / totalMax) * 100;

    // Cap at 100 in case of rounding differences
    return Math.min(100, perfection);
};

export const getFontSizeForQuality = (item: Equipment): number => {
    const qualityIndex = ORDERED_QUALITIES.indexOf(item.quality);
    const qualityLevel = item.qualityLevel || 0;
    const effectiveIndex = qualityIndex + (qualityLevel > 0 ? qualityLevel - 1 : 0);

    const baseSize = 14; // Font size for Common
    const maxSize = 48; // Font size for highest qualities
    const step = 3;      // Increase in px for each quality tier

    const fontSize = baseSize + effectiveIndex * step;
    return Math.min(maxSize, fontSize);
};
