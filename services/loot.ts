import {
  Player, Monster, Equipment, EquipmentQuality, ItemBlockData, AutomationSettings, AttributeType, CombatLog, MonsterRank
} from '../types';
import {
  LOOT_DROP_RATES, EQUIPMENT_REALM_TIERS, QUALITY_BASE_PROBABILITY, QUALITY_CONFIG, getRealmTierInfo
} from '../constants';
import { generateEquipment } from './equipmentGeneration';
import { devourVoidEquipment } from './equipmentModification';
import { compareItems } from './equipmentManager';
import { formatLargeNumber } from '../utils';
import { attemptRefineUpgrade } from './refining';

const determineLootRealmIndex = (monsterRealmIndex: number): number => {
    const monsterTierInfo = getRealmTierInfo(monsterRealmIndex);
    const monsterTierIndex = monsterTierInfo.tierIndex;

    if (monsterTierIndex <= 0) {
        // For Mercenary tier, it always drops Mercenary gear of a random realm within the tier.
        const [minRealm, maxRealm] = EQUIPMENT_REALM_TIERS[0].range;
        return Math.floor(Math.random() * (maxRealm - minRealm + 1)) + minRealm;
    }

    const rand = Math.random();
    let cumulativeChance = 0;
    let targetTierIndex = -1;

    // Cascade from the monster's tier down to tier 0 (Mercenary)
    for (let i = monsterTierIndex; i >= 0; i--) {
        let chanceForThisTier;
        if (i === monsterTierIndex) {
            // 30% chance for same-tier equipment
            chanceForThisTier = 0.3;
        } else if (i > 0) {
            // 50% of the remaining probability for the next lower tier
            chanceForThisTier = (1.0 - cumulativeChance) * 0.5;
        } else { // i === 0 (Mercenary tier)
            // The rest of the probability
            chanceForThisTier = 1.0 - cumulativeChance;
        }

        if (rand < cumulativeChance + chanceForThisTier) {
            targetTierIndex = i;
            break;
        }
        cumulativeChance += chanceForThisTier;
    }

    if (targetTierIndex === -1) {
        targetTierIndex = 0; // Fallback to lowest tier
    }

    const targetTier = EQUIPMENT_REALM_TIERS[targetTierIndex];
    const [minRealm, maxRealm] = targetTier.range;
    return Math.floor(Math.random() * (maxRealm - minRealm + 1)) + minRealm;
};


export const generateLoot = (monster: Monster, floor: number, isSticky: boolean = false): { equipment: Equipment[]; temperingStones: number } => {
  const allLoot: Equipment[] = [];
  const dropRateConfig = LOOT_DROP_RATES[monster.rank];
  
  // Equipment Drop
  if (isSticky || Math.random() < dropRateConfig.baseChance) {
      const itemRealmIndex = determineLootRealmIndex(monster.realmIndex);

      const firstLoot = generateEquipment(itemRealmIndex, EquipmentQuality.Common, QUALITY_BASE_PROBABILITY, floor);
      if (firstLoot) {
          allLoot.push(firstLoot);
          while (Math.random() < dropRateConfig.chainChance) {
              // Subsequent drops in the chain have the same realm as the first.
              const extraLoot = generateEquipment(itemRealmIndex, EquipmentQuality.Common, QUALITY_BASE_PROBABILITY, floor);
              if (extraLoot) allLoot.push(extraLoot);
              else break;
          }
      }
  }

  // Tempering Stone Drop
  let temperingStonesDropped = 0;
  let stoneDropChance = monster.stats.divinity * 0.005;
  if (monster.rank !== MonsterRank.Ancient) {
    stoneDropChance = Math.min(stoneDropChance, 0.10);
  }
  
  // Handle drop chances > 100%
  while (stoneDropChance > 0) {
    if (Math.random() < stoneDropChance) {
        temperingStonesDropped++;
    }
    stoneDropChance -= 1.0;
  }
  
  return { equipment: allLoot, temperingStones: temperingStonesDropped };
};

export const generateItemBlockLoot = (): ItemBlockData => {
    // Now only generates potions.
    return { type: 'potion' };
};

export const bulkProcessItems = (player: Player): {
    player: Player;
    log: string | null;
    newlyCreatedItems: Equipment[];
} => {
    if (!player.inventory || player.inventory.length === 0) {
        return { player, log: null, newlyCreatedItems: [] };
    }

    const itemsToProcess = [...player.inventory];
    const newlyCreatedItems: Equipment[] = [];

    const totalGoldGain = itemsToProcess.reduce((sum, item) => {
        const upgradedItem = attemptRefineUpgrade(item, player);
        if (upgradedItem) {
            newlyCreatedItems.push(upgradedItem);
        }
        return sum + item.combatPower;
    }, 0);

    const newPlayer: Player = {
        ...player,
        inventory: [], // All inventory items are processed and removed.
        gold: (player.gold || 0) + totalGoldGain,
    };

    const finalLog = `炼化 ${itemsToProcess.length} 件装备，获得 ${formatLargeNumber(totalGoldGain)} 金币。`;

    return { player: newPlayer, log: finalLog, newlyCreatedItems };
};


export const processLoot = (
  player: Player,
  items: Equipment[],
  automationSettings: AutomationSettings
): { updatedPlayer: Player; logs: (Omit<CombatLog, 'id' | 'color'>)[] } => {
  let modifiablePlayer = { ...player, equipped: { ...player.equipped }, inventory: [...player.inventory] };
  const logs: (Omit<CombatLog, 'id' | 'color'>)[] = [];

  let totalGoldFromRefine = 0;
  let itemsRefinedCount = 0;
  
  const itemsToProcess = [...items];
  const processedNewItemIds = new Set<string>();

  while(itemsToProcess.length > 0) {
    const newItem = itemsToProcess.shift();
    if (!newItem || processedNewItemIds.has(newItem.id)) continue;
    
    processedNewItemIds.add(newItem.id);

    const currentItem = modifiablePlayer.equipped[newItem.slot];
    const qualityClass = QUALITY_CONFIG[newItem.quality].cssClass;
    const styledNewItemName = `<span class="${qualityClass}">${newItem.name}</span>`;

    // --- Special Void Devour Logic ---
    if (newItem.quality === EquipmentQuality.Void && currentItem?.quality === EquipmentQuality.Void && automationSettings.autoEquip) {
        const newItemTier = getRealmTierInfo(newItem.realmIndex).tierIndex;
        const currentItemTier = getRealmTierInfo(currentItem.realmIndex).tierIndex;

        let newIsWinner = false;
        if (newItemTier > currentItemTier) {
            newIsWinner = true;
        } else if (newItemTier === currentItemTier) {
            const newDivinity = newItem.attributes.find(a => a.type === AttributeType.Divinity)?.value || 0;
            const currentDivinity = currentItem.attributes.find(a => a.type === AttributeType.Divinity)?.value || 0;
            if (newDivinity > currentDivinity) {
                newIsWinner = true;
            } else if (newDivinity === currentDivinity) {
                if (newItem.combatPower > currentItem.combatPower) {
                    newIsWinner = true;
                }
            }
        }
        
        const winner = newIsWinner ? newItem : currentItem;
        const loser = newIsWinner ? currentItem : newItem;
        
        const { upgradedItem, enhancementLogs } = devourVoidEquipment(winner, loser);

        modifiablePlayer.equipped[newItem.slot] = upgradedItem;
        processedNewItemIds.add(loser.id);

        const winnerName = `<span class="${QUALITY_CONFIG[winner.quality].cssClass}">${winner.name}</span>`;
        const loserName = `<span class="${QUALITY_CONFIG[loser.quality].cssClass}">${loser.name}</span>`;
        const newLevelName = upgradedItem.qualityLevel ? `${upgradedItem.quality}${upgradedItem.qualityLevel}重` : upgradedItem.quality;
        const finalName = `<span class="${QUALITY_CONFIG[upgradedItem.quality].cssClass}">${newLevelName}</span>`;

        logs.push({ message: `${winnerName} 吞噬了 ${loserName}，进化为 ${finalName}！`, isHtml: true, item: upgradedItem });
        logs.push(...enhancementLogs.map(log => ({ message: log, isHtml: true })));
        
        continue;
    }
    
    // --- General Equip/Refine Logic ---
    const isUpgrade = !currentItem || compareItems(currentItem, newItem) > 0;

    if (isUpgrade) {
        if (automationSettings.autoEquip) {
            modifiablePlayer.equipped[newItem.slot] = newItem;
            logs.push({ message: `自动装备了 ${styledNewItemName}`, isHtml: true });

            if (currentItem) { // If an item was replaced
                if (automationSettings.autoRefine) {
                    const upgradedItem = attemptRefineUpgrade(currentItem, modifiablePlayer);
                    if (upgradedItem) {
                        itemsToProcess.push(upgradedItem);
                        logs.push({ message: `自动炼化时运气爆发，获得了新装备！`, isHtml: true, item: upgradedItem });
                    }
                    totalGoldFromRefine += currentItem.combatPower;
                    itemsRefinedCount++;
                } else {
                    modifiablePlayer.inventory.push(currentItem);
                }
            }
        } else { // It's an upgrade but auto-equip is off.
            modifiablePlayer.inventory.push(newItem);
        }
    } else { // Not an upgrade
        if (automationSettings.autoRefine && newItem.quality !== EquipmentQuality.Void) {
             const upgradedItem = attemptRefineUpgrade(newItem, modifiablePlayer);
            if (upgradedItem) {
                itemsToProcess.push(upgradedItem);
                logs.push({ message: `自动炼化时运气爆发，获得了新装备！`, isHtml: true, item: upgradedItem });
            }
            totalGoldFromRefine += newItem.combatPower;
            itemsRefinedCount++;
        } else {
            // If it's a void item, or autoRefine is off, add to inventory.
            modifiablePlayer.inventory.push(newItem);
        }
    }
  }


  if (itemsRefinedCount > 0) {
      logs.push({ message: `自动炼化 ${itemsRefinedCount} 件非虚空装备，获得 ${formatLargeNumber(totalGoldFromRefine)} 金币。`, isHtml: false });
  }

  modifiablePlayer.gold = (modifiablePlayer.gold || 0) + totalGoldFromRefine;
  return { updatedPlayer: modifiablePlayer, logs };
};