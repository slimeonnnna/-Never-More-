import React, { useCallback } from 'react';
import {
  GridBlock, Monster, DeathRecord, MonsterRank,
} from '../types';
import { calculateCombatOutcome } from '../services/combat';
import { formatLargeNumber } from '../utils';
import { ORDERED_QUALITIES } from '../constants';
import { processCombatVictory } from '../services/combatResult';

export const useCombatResolver = ({
    gameState, setGameState, updateLog, addFeedback, triggerFeedbackQueue,
    updateTopStats, setShowDefeatModal, setForfeitTriggered,
    handleDeleteDeathRecord, generateNewGrid, setProjectileAnims
}) => {
    const { player, challengeState, floorChallengeState, revengeState } = gameState;

    const triggerAnimation = useCallback((blockId: string, type: 'combat' | 'loot' | 'hit') => {
        setGameState(prev => ({ ...prev, gridBlocks: prev.gridBlocks.map(b => b.id === blockId ? { ...b, animation: type } : b) }));
        setTimeout(() => {
            setGameState(prev => ({ ...prev, gridBlocks: prev.gridBlocks.map(b => b.id === blockId ? { ...b, animation: null } : b) }));
        }, 500);
    }, [setGameState]);

    const handleWinSequence = useCallback((block: GridBlock, healthChange: number) => {
        const monster = block.data as Monster;
        triggerAnimation(block.id, 'combat');
        
        if (floorChallengeState.isActive) {
            const { targetFloor } = floorChallengeState;
            updateLog(`楼层挑战成功！你现在可以晋升至第 ${targetFloor} 层！`, 'text-legendary font-bold');
        
            const { player: finalPlayer, allLoot, logs, feedbacks, topStatsUpdates } = processCombatVictory(player, monster, gameState.automationSettings, healthChange, block.stickiness);
        
            triggerFeedbackQueue(feedbacks, 250);
            logs.forEach(log => updateLog(log.message, log.color, log.isHtml));
            if (Object.keys(topStatsUpdates).length > 0) updateTopStats(topStatsUpdates);
        
            setGameState(prev => ({
                ...prev,
                player: finalPlayer,
                gridBlocks: prev.gridBlocks.map(b => b.id === block.id ? { ...b, type: 'empty' as const, data: null, combatOutcome: null, stickiness: undefined } : b),
                floorChallengeState: { isActive: false, targetFloor, isCompleted: true },
            }));
        
            return; 
        }

        const isRevengeKill = revengeState.isActive && revengeState.recordId && block.data && (block.data as Monster).id.includes((revengeState.recordId as string).split('-')[0]);

        if (isRevengeKill) {
            updateLog('复仇成功！宝箱已解锁。', 'text-legendary');
            setGameState(prev => ({ ...prev, gridBlocks: prev.gridBlocks.map(b => b.id === prev.revengeState?.chestBlockId ? { ...b, isLocked: false } : b), revengeState: { isActive: false, recordId: null, chestBlockId: null } }));
            handleDeleteDeathRecord(revengeState.recordId as string);
            setForfeitTriggered(true);
        }
        if (challengeState.isActive && challengeState.rankToUnlock) {
            updateLog(`挑战成功！你已解锁搜寻【${challengeState.rankToUnlock}】阶级敌人的能力！`, 'text-green-300 font-bold');
            setGameState(prev => ({ ...prev, unlockedRanks: [...new Set([...prev.unlockedRanks, challengeState.rankToUnlock as any])], challengeState: { isActive: false, rankToUnlock: null } }));
            setForfeitTriggered(true);
        }

        const { player: finalPlayer, allLoot, logs, feedbacks, topStatsUpdates, killStatsUpdate } = processCombatVictory(player, monster, gameState.automationSettings, healthChange, block.stickiness);
        
        triggerFeedbackQueue(feedbacks, 250);
        logs.forEach(log => updateLog(log.message, log.color, log.isHtml));
        if (Object.keys(topStatsUpdates).length > 0) updateTopStats(topStatsUpdates);

        setGameState(prev => {
            let newHighestQualityOnGrid = prev.guardedTreasureState?.highestQualityOnGrid ?? null;
            if (allLoot.length > 0 && prev.guardedTreasureState) {
                const currentHighestQualityIndex = newHighestQualityOnGrid ? ORDERED_QUALITIES.indexOf(newHighestQualityOnGrid) : -1;
                const highestNewLootItem = allLoot.reduce((best, current) => {
                    const bestValue = ORDERED_QUALITIES.indexOf(best.quality) + (best.qualityLevel || 0);
                    const currentValue = ORDERED_QUALITIES.indexOf(current.quality) + (current.qualityLevel || 0);
                    return currentValue > bestValue ? current : best;
                }, allLoot[0]);
                const highestNewLootItemValue = ORDERED_QUALITIES.indexOf(highestNewLootItem.quality) + (highestNewLootItem.qualityLevel || 0);
                if (highestNewLootItemValue > currentHighestQualityIndex) {
                    newHighestQualityOnGrid = highestNewLootItem.quality;
                }
            }

            // Check if guarded treasure should be unlocked
            let isUnlocked = prev.guardedTreasureState?.isUnlocked ?? false;
            const updatedGrid = prev.gridBlocks.map(b => b.id === block.id ? { ...b, type: 'empty' as const, data: null, combatOutcome: null, stickiness: undefined } : b);
            
            if (prev.guardedTreasureState && !isUnlocked) {
                const treasureIndex = updatedGrid.findIndex(b => b.type === 'guarded_treasure');
                if (treasureIndex !== -1) {
                    const width = 4;
                    const tx = treasureIndex % width;
                    const ty = Math.floor(treasureIndex / width);
                    const adjIndices = [
                        (ty > 0) ? (ty - 1) * width + tx : -1,
                        (ty < 3) ? (ty + 1) * width + tx : -1,
                        (tx > 0) ? ty * width + (tx - 1) : -1,
                        (tx < 3) ? ty * width + (tx + 1) : -1
                    ].filter(idx => idx !== -1);

                    const hasAdjacentMonster = adjIndices.some(idx => updatedGrid[idx].type === 'monster' || updatedGrid[idx].type === 'friendly');
                    if (!hasAdjacentMonster) {
                        isUnlocked = true;
                        updateLog('镇守宝藏的怪物已被击败，宝藏已开启！', 'text-green-400 font-bold');
                    }
                }
            }

            const monster = block.data as Monster;
            const killStats = prev.killStats || {};
            const currentSectData = killStats[killStatsUpdate.sect] || { identities: {}, totalPoints: 0 };
            const currentIdentities = currentSectData.identities || {};
            const killPoints = Math.pow(2, monster.realmIndex + 1);
            const newSectStats = {
                ...killStats,
                [killStatsUpdate.sect]: {
                    identities: {
                        ...currentIdentities,
                        [killStatsUpdate.identity]: (currentIdentities[killStatsUpdate.identity] || 0) + 1
                    },
                    totalPoints: (currentSectData.totalPoints || 0) + killPoints
                }
            };

            // Update strongest kill
            let newStrongestKill = prev.strongestKill;
            const rankOrder = {
                [MonsterRank.Minion]: 0,
                [MonsterRank.Elite]: 1,
                [MonsterRank.Lord]: 2,
                [MonsterRank.Monarch1]: 3,
                [MonsterRank.Monarch2]: 4,
                [MonsterRank.Monarch3]: 5,
                [MonsterRank.Ancient]: 6,
            };

            const isNewStronger = !newStrongestKill || 
                monster.realmIndex > newStrongestKill.realmIndex || 
                (monster.realmIndex === newStrongestKill.realmIndex && rankOrder[monster.rank] > rankOrder[newStrongestKill.rank]) ||
                (monster.realmIndex === newStrongestKill.realmIndex && monster.rank === newStrongestKill.rank && monster.stats.combatPower > (newStrongestKill as any).combatPower);

            if (isNewStronger) {
                newStrongestKill = {
                    monsterName: monster.name,
                    sect: monster.sect || '无宗门',
                    identity: monster.identity || '散修',
                    realmIndex: monster.realmIndex,
                    rank: monster.rank,
                    combatPower: monster.stats.combatPower
                } as any;
            }

            const newHistories = { ...prev.chatHistories };
            delete newHistories[block.id];

            return {
                ...prev,
                player: finalPlayer,
                gridBlocks: updatedGrid,
                guardedTreasureState: prev.guardedTreasureState ? { ...prev.guardedTreasureState, highestQualityOnGrid: newHighestQualityOnGrid, isUnlocked } : null,
                killStats: newSectStats,
                strongestKill: newStrongestKill,
                chatHistories: newHistories,
            };
        });
    }, [triggerAnimation, revengeState, setGameState, setForfeitTriggered, challengeState, player, updateLog, updateTopStats, floorChallengeState, triggerFeedbackQueue, handleDeleteDeathRecord, gameState.automationSettings]);

    const handlePlayerDefeat = useCallback(async (monsterBlock: GridBlock, damageDealt: number) => {
        updateLog(`你被【${(monsterBlock.data as Monster).rank}】${(monsterBlock.data as Monster).name}击败了！`, 'text-red-500');
        const playerBlock = gameState.gridBlocks.find(b => b.type === 'player');

        if (playerBlock) {
            setGameState(prev => ({ ...prev, gridBlocks: prev.gridBlocks.map(b => b.id === playerBlock.id ? { ...b, animation: 'fatal-hit' } : b) }));
        }

        const newRecord: DeathRecord = {
            id: `${(monsterBlock.data as Monster).id}-${crypto.randomUUID()}`,
            timestamp: Date.now(),
            monster: JSON.parse(JSON.stringify(monsterBlock.data)),
            damageDealt,
            finalHealth: gameState.player.stats.health - damageDealt,
        };
        setGameState(prev => ({ ...prev, deathLog: [...prev.deathLog, newRecord].slice(-10) }));

        await new Promise(r => setTimeout(r, 1500));
        setShowDefeatModal(true);

        const healthRestored = gameState.player.stats.attack + gameState.player.stats.defense + gameState.player.stats.magicResist;
        const lostGold = gameState.player.gold || 0;
        const defeatedPlayer = { ...gameState.player, temperingStones: 0, gold: 0, stats: { ...gameState.player.stats, health: healthRestored } };
        
        if (lostGold > 0) {
            updateLog(`你失去了所有的金币 (${formatLargeNumber(lostGold)})！`, 'text-red-500 font-bold');
        }
        
        const { newGrid, newTreasureBlockId, isMapHostile } = generateNewGrid(defeatedPlayer, gameState.searchSettings);
        
        setGameState(prev => ({
            ...prev,
            player: defeatedPlayer,
            gridBlocks: newGrid,
            isMapHostile,
            guardedTreasureState: newTreasureBlockId ? { highestQualityOnGrid: null, isUnlocked: false, treasureBlockId: newTreasureBlockId } : null,
            challengeState: { isActive: false, rankToUnlock: null },
            floorChallengeState: { isActive: false, targetFloor: 0, isCompleted: false },
            revengeState: { isActive: false, recordId: null, chestBlockId: null },
        }));
    }, [gameState, setGameState, setShowDefeatModal, updateLog, generateNewGrid]);
    
    const initiateManualCombatRound = useCallback(async (monsterBlock: GridBlock) => {
        const monster = monsterBlock.data as Monster;
        const playerBlock = gameState.gridBlocks.find(b => b.type === 'player');
        if (!playerBlock) return;

        const playerDamage = Math.max(0, player.stats.attack - monster.stats.defense);
        const monsterDamage = Math.max(0, monster.stats.attack - player.stats.defense);
        const playerRegen = player.stats.lifeRegen;

        const newProjectileAnims = [
            { fromId: playerBlock.id, toId: monsterBlock.id, id: `p-${crypto.randomUUID()}` },
            { fromId: monsterBlock.id, toId: playerBlock.id, id: `m-${crypto.randomUUID()}` }
        ];
        setProjectileAnims(prev => [...prev, ...newProjectileAnims]);

        await new Promise(r => setTimeout(r, 350));

        const newPlayerHealth = player.stats.health - monsterDamage + playerRegen;
        const newMonsterHealth = monster.stats.health - playerDamage;

        addFeedback({ onId: monsterBlock.id, text: `-${formatLargeNumber(playerDamage)}`, className: 'text-red-500 text-3xl' });
        if (monsterDamage > 0) {
             addFeedback({ onId: playerBlock.id, text: `-${formatLargeNumber(monsterDamage)}`, className: 'text-red-500 text-3xl' });
             setGameState(prev => ({
                ...prev,
                damageLog: [...prev.damageLog, {
                    monsterId: monster.id,
                    monsterName: monster.name,
                    damageTaken: monsterDamage,
                    timestamp: Date.now()
                }].slice(-20)
             }));
        }
        if (playerRegen > 0) {
             addFeedback({ onId: playerBlock.id, text: `+${formatLargeNumber(playerRegen)}`, className: 'text-green-400 text-2xl', style: { transform: 'translate(-50%, 40px)' } });
        }

        const updatedMonsterData: Monster = { ...monster, stats: { ...monster.stats, health: newMonsterHealth } };

        setGameState(prev => ({
            ...prev,
            player: { ...prev.player, stats: { ...prev.player.stats, health: newPlayerHealth } },
            gridBlocks: prev.gridBlocks.map(b => {
                if (b.id === monsterBlock.id) return { ...b, data: updatedMonsterData, animation: 'hit' };
                if (b.id === playerBlock.id) return { ...b, animation: 'hit' };
                return b;
            })
        }));

        await new Promise(r => setTimeout(r, 400));
        
        if (newMonsterHealth <= 0) {
            handleWinSequence(monsterBlock, monsterBlock.combatOutcome?.healthChange ?? 0);
        } else if (newPlayerHealth <= 0) {
            handlePlayerDefeat(monsterBlock, monsterDamage);
        } else {
             setGameState(prev => ({
                ...prev,
                gridBlocks: prev.gridBlocks.map(b => 
                    b.id === monsterBlock.id 
                    ? { ...b, combatOutcome: calculateCombatOutcome(prev.player.stats, updatedMonsterData) }
                    : b
                )
            }));
        }

    }, [gameState, player.stats, addFeedback, setGameState, handleWinSequence, handlePlayerDefeat, setProjectileAnims]);

    return { handleWinSequence, handlePlayerDefeat, initiateManualCombatRound };
};