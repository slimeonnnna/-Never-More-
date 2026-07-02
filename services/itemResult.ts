
import { Player, GridBlock, Monster, Chest, Equipment, EquipmentQuality, ItemBlockData, AutomationSettings, GameState, FeedbackAnimation, CombatLog } from '../types';
import { processLoot } from './loot';
import { generateEquipment, generateChestLoot } from './equipmentGeneration';
import { formatLargeNumber, getFontSizeForQuality } from '../utils';
import { ORDERED_QUALITIES, QUALITY_CONFIG } from '../constants';

type ItemInteractionResult = {
    player: Player;
    allLoot: Equipment[];
    logs: (Omit<CombatLog, 'id' | 'color'> & { color?: string })[];
    feedbacks: Omit<FeedbackAnimation, 'id'>[];
    topStatsUpdates: {
        equipment?: Equipment[];
    };
    isTreasure: boolean;
};

export const processItemInteractionResult = (
    player: Player,
    block: GridBlock,
    guardedTreasureState: GameState['guardedTreasureState'],
    automationSettings: AutomationSettings,
    gridBlocks: GridBlock[],
): ItemInteractionResult => {
    const feedbacks: Omit<FeedbackAnimation, 'id'>[] = [];
    const logs: ItemInteractionResult['logs'] = [];
    let allLoot: Equipment[] = [];
    let healthGain = 0;
    const topStatsUpdates: ItemInteractionResult['topStatsUpdates'] = {};
    let isTreasure = false;

    if (block.type === 'chest') {
        const chest = block.data as Chest;
        allLoot = generateChestLoot(chest.type, chest.realmIndex, player.currentFloor);
        logs.push({ message: `打开了 ${chest.type}。`, color: 'text-yellow-300' });
    } else if (block.type === 'item') {
        const itemData = block.data as ItemBlockData;
        if (itemData.type === 'potion') {
            healthGain = player.stats.magicResist;
            feedbacks.push({ onId: block.id, text: `+${formatLargeNumber(healthGain)}`, className: 'text-green-400 text-4xl' });
            logs.push({ message: `喝下体力药水，恢复了 ${formatLargeNumber(healthGain)} 体力。`, color: 'text-green-300' });
        }
    } else if (block.type === 'guarded_treasure') {
        isTreasure = true;
        const getNextQuality = (quality: EquipmentQuality | null): EquipmentQuality => {
             if (!quality) return EquipmentQuality.Uncommon;
             const currentIndex = ORDERED_QUALITIES.indexOf(quality);
             const nextIndex = Math.min(currentIndex + 1, ORDERED_QUALITIES.length - 1);
             return ORDERED_QUALITIES[nextIndex];
        };
        const targetQuality = getNextQuality(guardedTreasureState?.highestQualityOnGrid ?? null);
        
        const monstersOnGrid = gridBlocks.filter(b => b.type === 'monster' && b.data);
        let equipmentRealmIndex;
        if (monstersOnGrid.length > 0) {
            const strongestMonster = monstersOnGrid.reduce((strongest, current) => 
                (current.data as Monster).stats.combatPower > (strongest.data as Monster).stats.combatPower ? current : strongest
            );
            equipmentRealmIndex = (strongestMonster.data as Monster).realmIndex;
        } else {
            equipmentRealmIndex = player.realmIndex;
        }

        const treasureLoot = generateEquipment(equipmentRealmIndex, EquipmentQuality.Common, 0, player.currentFloor, targetQuality);
        if (treasureLoot) {
            allLoot.push(treasureLoot);
            logs.push({ message: '打开了<span class="text-legendary">怪物镇守的宝藏</span>！', color: 'text-legendary', isHtml: true });
        }
    }

    if (allLoot.length > 0) {
        topStatsUpdates.equipment = allLoot;
        allLoot.forEach(item => {
             const qualityClass = QUALITY_CONFIG[item.quality].cssClass;
             const qualityName = item.qualityLevel ? `${item.quality}${item.qualityLevel}重` : item.quality;
             const styledName = `获得了 <span class="${qualityClass}">[${qualityName}]装备</span>`;
             feedbacks.push({ onId: block.id, text: styledName, className: 'text-lg', isHtml: true, style: { fontSize: `${getFontSizeForQuality(item)}px` } });
             
             const logStyledName = `<span class="${qualityClass}">${item.name}</span>`;
             logs.push({ message: `获得了 ${logStyledName}`, color: 'text-yellow-300', isHtml: true, item: item });
        });
    }

    const { updatedPlayer, logs: lootLogs } = processLoot(player, allLoot, automationSettings);
    logs.push(...lootLogs.map(l => ({ ...l, color: 'text-teal-300' })));
    
    updatedPlayer.stats.health += healthGain;
    
    return {
        player: updatedPlayer,
        allLoot,
        logs,
        feedbacks,
        topStatsUpdates,
        isTreasure,
    };
}