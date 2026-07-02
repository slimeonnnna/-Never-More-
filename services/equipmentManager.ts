
import { Player, Equipment, EquipmentSlot, AttributeType } from '../types';
import { getRealmTierInfo, EQUIPMENT_SLOTS_ORDER, ORDERED_QUALITIES } from '../constants';
import { calculateTheoreticalMaxValueForAttr } from './equipmentCalculations';

export const compareItems = (a: Equipment, b: Equipment): number => {
    // 1. Realm Tier
    const aTier = getRealmTierInfo(a.realmIndex).tierIndex;
    const bTier = getRealmTierInfo(b.realmIndex).tierIndex;
    if (bTier !== aTier) return bTier - aTier;

    // 2. Quality
    const aQuality = ORDERED_QUALITIES.indexOf(a.quality) + (a.qualityLevel || 0);
    const bQuality = ORDERED_QUALITIES.indexOf(b.quality) + (b.qualityLevel || 0);
    if (bQuality !== aQuality) return bQuality - aQuality;

    // 3. Divinity Max Potential
    const aMaxDivinity = calculateTheoreticalMaxValueForAttr(a, AttributeType.Divinity);
    const bMaxDivinity = calculateTheoreticalMaxValueForAttr(b, AttributeType.Divinity);
    if (bMaxDivinity !== aMaxDivinity) {
        return bMaxDivinity - aMaxDivinity;
    }

    // 4. Combat Power (Final tie-breaker)
    return b.combatPower - a.combatPower;
};

export const autoEquipBestItems = (player: Player): { player: Player, changes: { slot: EquipmentSlot, equipped: Equipment, unequipped: Equipment | null }[] } => {
    let newInventory = [...player.inventory];
    let newEquipped = { ...player.equipped };
    const changes: { slot: EquipmentSlot, equipped: Equipment, unequipped: Equipment | null }[] = [];

    for (const slot of EQUIPMENT_SLOTS_ORDER) {
        const itemsForSlot = newInventory.filter(item => item.slot === slot);
        if (itemsForSlot.length === 0) continue;

        itemsForSlot.sort(compareItems);
        const bestInventoryItem = itemsForSlot[0];
        const currentEquippedItem = newEquipped[slot];

        let shouldEquip = false;
        if (!currentEquippedItem) {
            shouldEquip = true;
        } else {
            if (compareItems(currentEquippedItem, bestInventoryItem) > 0) {
                shouldEquip = true;
            }
        }

        if (shouldEquip) {
            changes.push({
                slot,
                equipped: bestInventoryItem,
                unequipped: currentEquippedItem || null
            });
            newInventory = newInventory.filter(item => item.id !== bestInventoryItem.id);
            if (currentEquippedItem) newInventory.push(currentEquippedItem);
            newEquipped[slot] = bestInventoryItem;
        }
    }

    if (changes.length === 0) {
        return { player, changes: [] };
    }

    const newPlayer: Player = { ...player, equipped: newEquipped, inventory: newInventory };
    return { player: newPlayer, changes };
};
