
import { Player, Monster, AutomationSettings, Equipment, CombatLog, FeedbackAnimation, GameState, MonsterRank } from '../types';
import { processLoot } from './loot';
import { calculatePlayerStats } from './character';
import { BREAKTHROUGH_REALM_INDICES, QUALITY_CONFIG, LOOT_DROP_RATES } from '../constants';
import { REALMS } from '../realmConstants';
import { formatLargeNumber, getFontSizeForQuality } from '../utils';
import { reRollDivinityOnDrop } from './equipmentModification';

type CombatVictoryResult = {
    player: Player;
    allLoot: Equipment[];
    logs: (Omit<CombatLog, 'id' | 'color'> & { color?: string })[];
    feedbacks: Omit<FeedbackAnimation, 'id'>[];
    topStatsUpdates: {
        equipment?: Equipment[];
        restoringFights?: { monster: Monster, healthRestored: number }[];
    };
    killStatsUpdate: {
        sect: string;
        identity: string;
    };
};

export const processCombatVictory = (
    player: Player,
    monster: Monster,
    automationSettings: AutomationSettings,
    healthChange: number,
    stickiness: number | undefined
): CombatVictoryResult => {
    const feedbacks: Omit<FeedbackAnimation, 'id'>[] = [];
    const logs: CombatVictoryResult['logs'] = [];
    const topStatsUpdates: CombatVictoryResult['topStatsUpdates'] = {};

    logs.push({ message: `击败了【${monster.rank}】${monster.name}。`, color: 'text-gray-400', isHtml: false });

    if (healthChange > 0) {
        feedbacks.push({ onId: monster.id, text: `+${formatLargeNumber(healthChange)}`, className: 'text-green-400 text-4xl' });
    } else if (healthChange < 0) {
        feedbacks.push({ onId: monster.id, text: `-${formatLargeNumber(Math.abs(healthChange))}`, className: 'text-red-500 text-4xl' });
    }

    // --- New Loot Logic ---
    let allLoot: Equipment[] = [...monster.inventory];

    // Handle equipped item drop chance
    const dropRateConfig = LOOT_DROP_RATES[monster.rank];
    const equippedItems = Object.values(monster.equipped).filter((e): e is Equipment => !!e);
    if (equippedItems.length > 0) {
        if (Math.random() < dropRateConfig.baseChance) {
            const droppedEquippedItem = equippedItems[Math.floor(Math.random() * equippedItems.length)];
            allLoot.push(droppedEquippedItem);
            
            const qualityClass = QUALITY_CONFIG[droppedEquippedItem.quality].cssClass;
            const styledName = `<span class="${qualityClass}">${droppedEquippedItem.name}</span>`;
            logs.push({ message: `你获得了损坏装备中幸存的 ${styledName}！`, isHtml: true, color: 'text-legendary', item: droppedEquippedItem });
        } else {
            logs.push({ message: `【${monster.name}】穿着的装备随着战斗被损坏了。`, color: 'text-gray-500' });
        }
    }
    
    // Tempering stone drop logic
    let stonesDropped = 0;
    let stoneDropChance = monster.stats.divinity * 0.005;
    if (monster.rank !== MonsterRank.Ancient) {
        stoneDropChance = Math.min(stoneDropChance, 0.10);
    }
    
    // Handle drop chances > 100%
    while (stoneDropChance > 0) {
        if (Math.random() < stoneDropChance) {
            stonesDropped++;
        }
        stoneDropChance -= 1.0;
    }
    // --- End New Loot Logic ---

    // --- Divinity re-roll logic starts here ---
    const finalLoot: Equipment[] = [];
    allLoot.forEach(item => {
        const { newItem, wasModified } = reRollDivinityOnDrop(item);
        if (wasModified) {
            const qualityClass = QUALITY_CONFIG[newItem.quality].cssClass;
            const styledName = `<span class="${qualityClass}">${newItem.name}</span>`;
            logs.push({ message: `“${styledName}”的神性流失了……`, isHtml: true, color: 'text-orange-300', item: newItem });
        }
        finalLoot.push(newItem);
    });
    allLoot = finalLoot; // Use the modified loot from now on.
    // --- Divinity re-roll logic ends here ---

    const xpReward = monster.xpReward;
    allLoot.forEach(item => {
        const qualityClass = QUALITY_CONFIG[item.quality].cssClass;
        const qualityName = item.qualityLevel ? `${item.quality}${formatLargeNumber(item.qualityLevel)}重` : item.quality;
        const styledName = `获得了 <span class="${qualityClass}">[${qualityName}]装备</span>`;
        feedbacks.push({ onId: monster.id, text: styledName, className: 'text-lg', isHtml: true, style: { fontSize: `${getFontSizeForQuality(item)}px` } });
        
        const logStyledName = `<span class="${qualityClass}">${item.name}</span>`;
        logs.push({ message: `获得了 ${logStyledName}`, color: 'text-teal-300', isHtml: true, item: item });
    });
    
    if (stonesDropped > 0) {
        feedbacks.push({ onId: monster.id, text: `<span class="text-legendary">获得了淬炼石 x${stonesDropped}</span>`, className: 'text-lg', isHtml: true });
    }

    if (allLoot.length > 0) topStatsUpdates.equipment = allLoot;
    if (healthChange > 0) topStatsUpdates.restoringFights = [{ monster, healthRestored: healthChange }];

    let playerWithHealthChange = { ...player, stats: { ...player.stats, health: player.stats.health + healthChange } };

    let { updatedPlayer, logs: lootLogs } = processLoot(playerWithHealthChange, allLoot, automationSettings);
    logs.push(...lootLogs.map(l => ({ ...l, color: 'text-teal-300' })));

    if (stonesDropped > 0) {
        updatedPlayer.temperingStones = (updatedPlayer.temperingStones || 0) + stonesDropped;
        logs.push({ message: `获得了 <span class="text-legendary">淬炼石 x${stonesDropped}</span>。`, color: 'text-legendary', isHtml: true });
    }

    const statsBeforeLevelUp = calculatePlayerStats(updatedPlayer);
    let newXp = updatedPlayer.xp + xpReward;
    let leveledUp = false;
    while (newXp >= updatedPlayer.xpToNextLevel && updatedPlayer.realmIndex < REALMS.length - 1 && !BREAKTHROUGH_REALM_INDICES.includes(updatedPlayer.realmIndex)) {
        leveledUp = true;
        newXp -= updatedPlayer.xpToNextLevel;
        const oldRealm = REALMS[updatedPlayer.realmIndex];
        const newRealmIndex = updatedPlayer.realmIndex + 1;
        const newRealm = REALMS[newRealmIndex];
        const hpGain = newRealm.totalHpBonus - oldRealm.totalHpBonus;
        const pointsGain = newRealm.totalPointsBonus - oldRealm.totalPointsBonus;
        const p_atk = Math.floor(pointsGain / 2);
        const p_def = pointsGain - p_atk;
        const mrGain = Math.round(pointsGain * 1.5);
        logs.push({ message: `境界提升！你已达到【${newRealm.name}】！`, color: 'text-purple-400', isHtml: false });
        updatedPlayer = {
            ...updatedPlayer,
            realmIndex: newRealmIndex,
            xpToNextLevel: newRealm.xpToNext,
            permanentBonuses: {
                ...updatedPlayer.permanentBonuses,
                attack: updatedPlayer.permanentBonuses.attack + p_atk,
                defense: updatedPlayer.permanentBonuses.defense + p_def,
                health: updatedPlayer.permanentBonuses.health + hpGain,
                magicResist: updatedPlayer.permanentBonuses.magicResist + mrGain
            }
        };
    }
    if (updatedPlayer.realmIndex >= REALMS.length - 1 || BREAKTHROUGH_REALM_INDICES.includes(updatedPlayer.realmIndex)) {
        newXp = Math.min(newXp, updatedPlayer.xpToNextLevel);
    }

    let finalPlayer = { ...updatedPlayer, xp: newXp };
    const statsAfterLevelUp = calculatePlayerStats(finalPlayer);
    const healthIncreaseFromLevel = leveledUp ? (statsAfterLevelUp.maxHealth - statsBeforeLevelUp.maxHealth) : 0;
    finalPlayer.stats.health += healthIncreaseFromLevel;

    const killStatsUpdate = {
        sect: monster.sect || '无宗门',
        identity: monster.identity || '散修'
    };

    return {
        player: finalPlayer,
        allLoot,
        logs,
        feedbacks,
        topStatsUpdates,
        killStatsUpdate
    };
};
