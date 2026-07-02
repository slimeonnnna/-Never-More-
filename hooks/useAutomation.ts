import React, { useCallback } from 'react';
import { GameState, GridBlock, Monster, Equipment, EquipmentQuality, AttributeType, MonsterRank } from '../types';
import { processCombatVictory } from '../services/combatResult';
import { processItemInteractionResult } from '../services/itemResult';
import { getRealmTierInfo, ORDERED_QUALITIES } from '../constants';
import { isPathPossible, calculateAttributePerfection } from '../utils';

export const useAutomation = ({
    gameState, setGameState, isAutomating,
    updateLog, triggerFeedbackQueue,
    updateTopStats,
    handleUseTemperingStone,
}) => {
    
    const processActionInBatch = useCallback((currentGameState: GameState, block: GridBlock) => {
        let result: any = {
            player: currentGameState.player,
            allLoot: [],
            logs: [],
            feedbacks: [],
            topStatsUpdates: {},
            isTreasure: false,
        };

        if (block.type === 'monster' && block.combatOutcome?.playerWon) {
            const monster = block.data as Monster;
            const healthChange = block.combatOutcome.healthChange;
            result = processCombatVictory(currentGameState.player, monster, currentGameState.automationSettings, healthChange, block.stickiness);
        } else if (block.type === 'chest' || block.type === 'item') {
            result = processItemInteractionResult(currentGameState.player, block, currentGameState.guardedTreasureState, currentGameState.automationSettings, currentGameState.gridBlocks);
        }
        
        let guardedTreasureState = currentGameState.guardedTreasureState;
        if (result.allLoot.length > 0 && guardedTreasureState) {
            const currentHighestQualityIndex = guardedTreasureState.highestQualityOnGrid ? ORDERED_QUALITIES.indexOf(guardedTreasureState.highestQualityOnGrid) : -1;
            const highestNewLootItem = result.allLoot.reduce((best: Equipment, current: Equipment) => {
                const bestValue = ORDERED_QUALITIES.indexOf(best.quality) + (best.qualityLevel || 0);
                const currentValue = ORDERED_QUALITIES.indexOf(current.quality) + (current.qualityLevel || 0);
                return currentValue > bestValue ? current : best;
            }, result.allLoot[0]);
            const highestNewLootItemValue = ORDERED_QUALITIES.indexOf(highestNewLootItem.quality) + (highestNewLootItem.qualityLevel || 0);
            if (highestNewLootItemValue > currentHighestQualityIndex) {
                guardedTreasureState = { ...guardedTreasureState, highestQualityOnGrid: highestNewLootItem.quality };
            }
        }
        
        let killStats = currentGameState.killStats || {};
        let strongestKill = currentGameState.strongestKill;

        if (block.type === 'monster' && result.killStatsUpdate) {
            const monster = block.data as Monster;
            const killStatsUpdate = result.killStatsUpdate;
            const currentSectData = killStats[killStatsUpdate.sect] || { identities: {}, totalPoints: 0 };
            const currentIdentities = currentSectData.identities || {};
            const killPoints = Math.pow(2, monster.realmIndex + 1);
            
            killStats = {
                ...killStats,
                [killStatsUpdate.sect]: {
                    identities: {
                        ...currentIdentities,
                        [killStatsUpdate.identity]: (currentIdentities[killStatsUpdate.identity] || 0) + 1
                    },
                    totalPoints: (currentSectData.totalPoints || 0) + killPoints
                }
            };

            const rankOrder = {
                [MonsterRank.Minion]: 0,
                [MonsterRank.Elite]: 1,
                [MonsterRank.Lord]: 2,
                [MonsterRank.Monarch1]: 3,
                [MonsterRank.Monarch2]: 4,
                [MonsterRank.Monarch3]: 5,
                [MonsterRank.Ancient]: 6,
            };

            const isNewStronger = !strongestKill || 
                monster.realmIndex > strongestKill.realmIndex || 
                (monster.realmIndex === strongestKill.realmIndex && rankOrder[monster.rank] > rankOrder[strongestKill.rank]) ||
                (monster.realmIndex === strongestKill.realmIndex && monster.rank === strongestKill.rank && monster.stats.combatPower > (strongestKill as any).combatPower);

            if (isNewStronger) {
                strongestKill = {
                    monsterName: monster.name,
                    sect: monster.sect || '无宗门',
                    identity: monster.identity || '散修',
                    realmIndex: monster.realmIndex,
                    rank: monster.rank,
                    combatPower: monster.stats.combatPower
                } as any;
            }
        }

        return {
            nextState: { 
                ...currentGameState, 
                player: result.player, 
                guardedTreasureState,
                killStats,
                strongestKill
            },
            actionLogs: result.logs,
            actionFeedbacks: result.feedbacks,
            actionTopStats: result.topStatsUpdates
        };
    }, []);

    const handleAutomationBatch = useCallback((blocks: GridBlock[]) => {
        isAutomating.current = true;
        const allLogs: any[] = [];
        const allFeedbacks: any[] = [];
        const allTopStatsItems: any = { monsters: [], equipment: [], restoringFights: [] };
    
        let runningGameState = gameState;
    
        const otherBlocks = blocks.filter(b => b.type !== 'guarded_treasure');
        if (otherBlocks.length > 0) {
            const result = otherBlocks.reduce((current, block) => {
                const { nextState, actionLogs, actionFeedbacks, actionTopStats } = processActionInBatch(current.state, block);
                current.logs.push(...actionLogs);
                current.feedbacks.push(...actionFeedbacks);
                if (actionTopStats.monsters) current.topStats.monsters.push(...actionTopStats.monsters);
                if (actionTopStats.equipment) current.topStats.equipment.push(...actionTopStats.equipment);
                if (actionTopStats.restoringFights) current.topStats.restoringFights.push(...actionTopStats.restoringFights);
                return { ...current, state: nextState };
            }, { state: runningGameState, logs: allLogs, feedbacks: allFeedbacks, topStats: allTopStatsItems });
            runningGameState = result.state;
        }
    
        const treasureBlock = blocks.find(b => b.type === 'guarded_treasure');
        const isCleared = !runningGameState.gridBlocks.some(b => (b.type === 'monster' || b.type === 'chest') && !otherBlocks.some(ob => ob.id === b.id));
        
        if (treasureBlock && isCleared) {
            const { player, logs, feedbacks, topStatsUpdates } = processItemInteractionResult(
                runningGameState.player,
                treasureBlock,
                runningGameState.guardedTreasureState,
                runningGameState.automationSettings,
                runningGameState.gridBlocks
            );
            allLogs.push(...logs);
            allFeedbacks.push(...feedbacks);
            if (topStatsUpdates.equipment) allTopStatsItems.equipment.push(...topStatsUpdates.equipment);
            runningGameState = { ...runningGameState, player, guardedTreasureState: null };
        }
    
        setGameState(runningGameState);
        allLogs.forEach(log => updateLog(log.message, log.color, log.isHtml));
        triggerFeedbackQueue(allFeedbacks, 150);
    
        if (allTopStatsItems.monsters.length > 0 || allTopStatsItems.equipment.length > 0 || allTopStatsItems.restoringFights.length > 0) {
            updateTopStats(allTopStatsItems);
        }
        
        const blockIdsToClear = new Set(blocks.map(b => b.id));
        setGameState(prev => ({ ...prev, gridBlocks: prev.gridBlocks.map(b => blockIdsToClear.has(b.id) ? { ...b, animation: (b.type === 'monster' || b.type === 'guarded_treasure') ? 'combat' : 'loot' } : b) }));
        
        setTimeout(() => {
          setGameState(prev => {
            const finalGrid = prev.gridBlocks.map(b => blockIdsToClear.has(b.id) ? { ...b, type: 'empty' as any, data: null, animation: null, combatOutcome: null, stickiness: undefined } : b);
            return {...prev, gridBlocks: finalGrid };
          });
          isAutomating.current = false;
        }, 500); // Increased delay for animations to be more visible
    }, [gameState, processActionInBatch, updateLog, updateTopStats, triggerFeedbackQueue, setGameState, isAutomating]);
    
    const { player } = gameState;

    const handleAutoLootAndFight = useCallback(() => {
        const { gridBlocks, automationSettings, guardedTreasureState } = gameState;
        const playerIndex = gridBlocks.findIndex(b => b.type === 'player');
        if (playerIndex === -1) return;

        const actionsToTake: GridBlock[] = [];
        if (automationSettings.autoLoot) {
            const lootableBlocks = gridBlocks.filter(b => {
                const isLootableType = b.type === 'chest' || b.type === 'item' || (b.type === 'guarded_treasure' && guardedTreasureState?.isUnlocked);
                if (!isLootableType) return false;
                const blockIndex = gridBlocks.findIndex(grid => grid.id === b.id);
                return isPathPossible(gridBlocks, playerIndex, blockIndex, gameState.isMapHostile);
            });
            actionsToTake.push(...lootableBlocks);
        }
        if (automationSettings.autoFight) {
            const fightableMonsters = gridBlocks.filter(b => 
                b.type === 'monster' && 
                (b.combatOutcome?.playerWon || b.combatOutcome?.healthChange === 0) && 
                isPathPossible(gridBlocks, playerIndex, gridBlocks.findIndex(grid => grid.id === b.id), gameState.isMapHostile)
            );
            actionsToTake.push(...fightableMonsters);
        }
        
        if (actionsToTake.length > 0) {
            handleAutomationBatch(actionsToTake);
        }
    }, [gameState, handleAutomationBatch, isAutomating]);

    const handleAutoTemper = useCallback(() => {
        if (!gameState.automationSettings.autoTemper || player.temperingStones <= 0) return false;
        
        const allPlayerItems = [
            ...player.inventory, 
            ...Object.values(player.equipped).filter((i): i is Equipment => !!i)
        ];

        const temperableItems = allPlayerItems.filter(item => 
            item.attributes.some(attr => calculateAttributePerfection(attr, item.realmIndex) < 100)
        );

        if (temperableItems.length > 0) {
            temperableItems.sort((a, b) => {
                const aTier = getRealmTierInfo(a.realmIndex).tierIndex;
                const bTier = getRealmTierInfo(b.realmIndex).tierIndex;
                if (bTier !== aTier) return bTier - aTier;
    
                const aQuality = ORDERED_QUALITIES.indexOf(a.quality) + (a.qualityLevel || 0);
                const bQuality = ORDERED_QUALITIES.indexOf(b.quality) + (b.qualityLevel || 0);
                if (bQuality !== aQuality) return bQuality - aQuality;
    
                return b.combatPower - a.combatPower;
            });
            
            const itemToTemper = temperableItems[0];
            const attributesWithPerfection = itemToTemper.attributes
                .map(attr => ({ ...attr, perfection: calculateAttributePerfection(attr, itemToTemper.realmIndex) }))
                .filter(attr => attr.perfection < 100 && attr.rollCount);
                
            if (attributesWithPerfection.length > 0) {
                attributesWithPerfection.sort((a, b) => a.perfection - b.perfection);
                const attrToTemper = attributesWithPerfection[0] as AttributeType & { type: AttributeType };

                handleUseTemperingStone(itemToTemper, attrToTemper.type, true);
                return true;
            }
        }

        return false;
    }, [player, gameState.automationSettings.autoTemper, handleUseTemperingStone, updateLog]);

    const handleAutomationSettingsChange = useCallback((newSettings: Partial<typeof gameState.automationSettings>) => {
        setGameState(prev => ({ ...prev, automationSettings: { ...prev.automationSettings, ...newSettings }}));
    }, [setGameState]);
    
    const handleToggleAllAutomations = useCallback(() => {
        setGameState(prev => {
            const allCurrentlyEnabled = prev.automationSettings.autoFight && prev.automationSettings.autoLoot && prev.automationSettings.autoRefine && prev.automationSettings.autoEquip && prev.automationSettings.autoTemper;
            const targetState = !allCurrentlyEnabled;
            const newState = { autoFight: targetState, autoLoot: targetState, autoRefine: targetState, autoEquip: targetState, autoTemper: targetState };
            updateLog(`已${targetState ? '开启' : '关闭'}所有自动功能。`, 'text-blue-300');
            return { ...prev, automationSettings: newState };
        });
    }, [setGameState, updateLog]);

    return {
        handleAutoLootAndFight,
        handleAutoTemper,
        handleAutomationSettingsChange,
        handleToggleAllAutomations,
    };
};