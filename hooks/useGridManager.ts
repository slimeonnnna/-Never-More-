
import React, { useCallback } from 'react';
import {
  GameState, GridBlock, GridBlockType, Monster, Chest, ChestType, SearchSettings, DeathRecord
} from '../types';
import { calculateCombatOutcome, reCalculateGridOutcomes } from '../services/combat';
import { generateMonster, calculateCharacterCombatPower, calculatePlayerStats, createMonsterInternal } from '../services/character';
import { generateItemBlockLoot } from '../services/loot';
import { REALMS } from '../realmConstants';
import { CHEST_TYPE_PROBABILITY } from '../constants';
import { formatLargeNumber } from '../utils';
import { generateFriendlyUnit } from '../services/friendlyUnitGenerator';

export const useGridManager = ({ gameState, setGameState, updateLog, addFeedback, setProjectileAnims, updateTopStats, setShowDefeatModal, setIsSearchOnCooldown }) => {

    const generateNewGrid = useCallback((playerForGen: typeof gameState.player, searchSettingsForGen: SearchSettings, blocksToRetain: GridBlock[] = []): { newGrid: GridBlock[], newTreasureBlockId: string | null, isMapHostile: boolean } => {
        const { gmMonsterRequest } = gameState;
        const newGrid: (GridBlock | null)[] = Array(16).fill(null);
        let availableIndices = Array.from({ length: 16 }, (_, i) => i);

        if (blocksToRetain.length > 0) {
            const currentGridMap: Map<string, number> = new Map(gameState.gridBlocks.map((b, i) => [b.id, i]));
            const placedRetained = new Set<string>();

            blocksToRetain.forEach(block => {
                const originalIndex = currentGridMap.get(block.id);
                if (originalIndex !== undefined && availableIndices.includes(originalIndex)) {
                    newGrid[originalIndex as number] = block;
                    availableIndices = availableIndices.filter(i => i !== (originalIndex as number));
                    placedRetained.add(block.id);
                }
            });

            blocksToRetain.forEach(block => {
                if (!placedRetained.has(block.id) && availableIndices.length > 0) {
                    const newIndex = availableIndices.shift()!;
                    newGrid[newIndex] = block;
                }
            });
        }

        const playerStartIndex = availableIndices.length > 0 ? availableIndices[Math.floor(Math.random() * availableIndices.length)] : -1;
        if (playerStartIndex !== -1) {
            newGrid[playerStartIndex] = { id: 'player-start', type: 'player', data: null };
            availableIndices = availableIndices.filter(i => i !== playerStartIndex);
        }

        const gridPlaceholders: { type: GridBlockType; index: number }[] = [];
        const tempMonsters: Monster[] = [];
        let treasurePlaced = false;
        let newTreasureBlockId: string | null = null;

        availableIndices.forEach(i => {
            const rand = Math.random();
            let blockType: GridBlockType;
            if (rand < 0.70) blockType = 'monster';
            else if (rand < 0.85) blockType = 'empty';
            else if (rand < 0.90) blockType = 'chest';
            else if (rand < 0.95) blockType = 'item';
            else {
                if (!treasurePlaced) {
                    blockType = 'guarded_treasure';
                    treasurePlaced = true;
                } else {
                    blockType = 'empty';
                }
            }
            gridPlaceholders.push({ type: blockType, index: i });
        });

        for (const placeholder of gridPlaceholders) {
            if (placeholder.type === 'monster') {
                const monster = generateMonster(playerForGen, searchSettingsForGen);
                tempMonsters.push(monster);
                newGrid[placeholder.index] = { id: monster.id, type: 'monster', data: monster };
            }
        }
        
        let friendlyUnitPlaced = false;
        if (!gameState.floorChallengeState.isActive && tempMonsters.length > 0 && (!gmMonsterRequest || gmMonsterRequest.isFriendly) && Math.random() < 0.1) {
             const strongestMonster = tempMonsters.reduce((a, b) => a.stats.combatPower > b.stats.combatPower ? a : b);
             const strongestMonsterIndex = newGrid.findIndex(b => b?.id === strongestMonster.id);

             if (strongestMonsterIndex !== -1) {
                const friendlyUnit = generateFriendlyUnit(strongestMonster);
                const friendlyBlock: GridBlock = {
                    id: friendlyUnit.id,
                    type: 'friendly',
                    data: friendlyUnit,
                };
                newGrid[strongestMonsterIndex] = friendlyBlock;
                updateLog(`你似乎遇到了一个中立的强者...`, 'text-pink-300');
                friendlyUnitPlaced = true;
            }
        }
        
        // --- GM Request Handling ---
        if (gmMonsterRequest) {
            const monster = createMonsterInternal({
                forcedRank: gmMonsterRequest.rank,
                forcedRealmIndex: gmMonsterRequest.realmIndex,
            });
            const monsterIndices = newGrid.map((b,i) => b?.type === 'monster' ? i : -1).filter(i => i !== -1);
            if(monsterIndices.length > 0) {
                const indexToReplace = monsterIndices[Math.floor(Math.random() * monsterIndices.length)];
                if(gmMonsterRequest.isFriendly) {
                    if(!friendlyUnitPlaced) {
                        const friendlyUnit = generateFriendlyUnit(monster);
                        newGrid[indexToReplace] = { id: friendlyUnit.id, type: 'friendly', data: friendlyUnit };
                    }
                } else {
                     newGrid[indexToReplace] = { id: monster.id, type: 'monster', data: monster };
                }
            }
        }

        const lowestMonsterRealm = tempMonsters.length > 0 ? Math.min(...tempMonsters.map(m => m.realmIndex)) : playerForGen.realmIndex;

        const getWeightedRandomChestType = (): ChestType => {
            const rand = Math.random();
            let cumulativeChance = 0;
            for (const config of CHEST_TYPE_PROBABILITY) {
                cumulativeChance += config.chance;
                if (rand < cumulativeChance) {
                    return config.type;
                }
            }
            return ChestType.Wood;
        };

        for (const placeholder of gridPlaceholders) {
            const i = placeholder.index;
            if (newGrid[i]) continue;
            switch (placeholder.type) {
                case 'chest': {
                    const chestType = getWeightedRandomChestType();
                    const chest: Chest = { id: `chest-${i}-${crypto.randomUUID()}`, type: chestType, equipmentRealm: REALMS[lowestMonsterRealm].name, realmIndex: lowestMonsterRealm };
                    newGrid[i] = { id: chest.id, type: 'chest', data: chest };
                    break;
                }
                case 'item': {
                    const itemData = generateItemBlockLoot();
                    newGrid[i] = { id: `item-${i}-${crypto.randomUUID()}`, type: 'item', data: itemData };
                    break;
                }
                case 'guarded_treasure': {
                    const blockId = `treasure-${i}-${crypto.randomUUID()}`;
                    newGrid[i] = { id: blockId, type: 'guarded_treasure', data: null };
                    newTreasureBlockId = blockId;
                    break;
                }
                default: {
                    newGrid[i] = { id: `empty-${i}-${crypto.randomUUID()}`, type: 'empty', data: null };
                    break;
                }
            }
        }

        updateTopStats({ monsters: tempMonsters });
        const finalGrid = newGrid.filter(b => b !== null) as GridBlock[];
        const isMapHostile = finalGrid.some(b => b.type === 'chest' || b.type === 'guarded_treasure');
        return { newGrid: reCalculateGridOutcomes(playerForGen.stats, finalGrid), newTreasureBlockId, isMapHostile };
    }, [gameState, updateLog, updateTopStats]);

    const handleRefreshGrid = useCallback(async () => {
        setIsSearchOnCooldown(true);
        setTimeout(() => setIsSearchOnCooldown(false), 5000);

        const { player, searchSettings, gridBlocks, isOffensiveSystemActive, challengeState, floorChallengeState, revengeState } = gameState;
        if (challengeState.isActive || floorChallengeState.isActive || floorChallengeState.isCompleted || revengeState.isActive) return;

        if (!isOffensiveSystemActive && !gameState.gmMonsterRequest) {
            const { newGrid, newTreasureBlockId, isMapHostile } = generateNewGrid(player, searchSettings);
            setGameState(prev => ({
                ...prev,
                gridBlocks: newGrid,
                isMapHostile,
                guardedTreasureState: newTreasureBlockId ? { highestQualityOnGrid: null, isUnlocked: false, treasureBlockId: newTreasureBlockId } : null
            }));
            updateLog('搜寻了新的区域。', 'text-gray-400');
            return;
        }

        if (gameState.gmMonsterRequest) {
            const { newGrid, newTreasureBlockId, isMapHostile } = generateNewGrid(player, searchSettings);
            setGameState(prev => ({
                ...prev,
                gridBlocks: newGrid,
                isMapHostile,
                guardedTreasureState: newTreasureBlockId ? { highestQualityOnGrid: null, isUnlocked: false, treasureBlockId: newTreasureBlockId } : null,
                gmMonsterRequest: null,
            }));
            return;
        }

        // Offensive System Logic
        const stickyAttackers = gridBlocks.filter(b => b.type === 'monster' && b.data && (b.data as Monster).stickiness && (b.data as Monster).stickiness > 0);
        const nonStickyMonsters = gridBlocks.filter(b => b.type === 'monster' && b.data && (!(b.data as Monster).stickiness || (b.data as Monster).stickiness === 0));
        
        const newAttacker = nonStickyMonsters.length > 0
            ? nonStickyMonsters.reduce((strongest, current) => ((current.data as Monster).stats.combatPower > (strongest.data as Monster).stats.combatPower ? current : strongest))
            : null;

        const attackersMap = new Map<string, GridBlock>();
        stickyAttackers.forEach(b => attackersMap.set(b.id, b));
        if (newAttacker) {
            attackersMap.set(newAttacker.id, newAttacker);
        }
        const allAttackers = Array.from(attackersMap.values());
        
        if (allAttackers.length === 0) {
            const { newGrid, newTreasureBlockId } = generateNewGrid(player, searchSettings);
            setGameState(prev => ({
                ...prev,
                gridBlocks: newGrid,
                guardedTreasureState: newTreasureBlockId ? { highestQualityOnGrid: null, isUnlocked: false, treasureBlockId: newTreasureBlockId } : null
            }));
            updateLog('搜寻了新的区域，一片宁静。', 'text-gray-400');
            return;
        }

        const playerBlock = gridBlocks.find(b => b.type === 'player');
        if (!playerBlock) return;
        
        const newProjectileAnims = allAttackers.map(b => ({ fromId: b.id, toId: playerBlock.id, id: `${b.id}-${Date.now()}` }));
        setProjectileAnims(newProjectileAnims);
        
        await new Promise(r => setTimeout(r, 350));

        let currentPlayerState = player;
        let playerSurvived = true;
        let killerInfo: { monster: Monster; damage: number } | null = null;

        for (const attackerBlock of allAttackers) {
            const monster = attackerBlock.data as Monster;
            const stickinessLevel = (attackerBlock.data as Monster).stickiness || 0;
            const penetration = stickinessLevel * 0.1;
            const totalReduction = currentPlayerState.stats.defense + currentPlayerState.stats.magicResist + currentPlayerState.stats.lifeRegen;
            const effectiveReduction = totalReduction * (1 - penetration);
            const damage = Math.max(0, monster.stats.attack - effectiveReduction);
            
            const newHealth = currentPlayerState.stats.health - damage;

            const logMessage = stickinessLevel > 0
                ? `粘性敌人【${monster.rank}】${monster.name}对你发动了攻击！(穿透: ${Math.round(penetration * 100)}%)`
                : `敌人【${monster.rank}】${monster.name}对你发动了突袭！`;
            updateLog(logMessage, 'text-orange-400', true);

            setGameState(prev => ({
                ...prev,
                gridBlocks: prev.gridBlocks.map(b => b.id === playerBlock.id ? { ...b, animation: 'hit' } : b)
            }));
            
            const damageText = newHealth <= 0 ? `${formatLargeNumber(newHealth)}` : `-${formatLargeNumber(damage)}`;
            addFeedback({
                onId: playerBlock.id,
                text: damageText,
                className: 'text-red-500 text-4xl'
            });

            const updatedPlayer = { ...currentPlayerState, stats: { ...currentPlayerState.stats, health: newHealth } };
            setGameState(prev => ({ 
                ...prev, 
                player: updatedPlayer,
                damageLog: [...prev.damageLog, {
                    monsterId: monster.id,
                    monsterName: monster.name,
                    damageTaken: damage,
                    timestamp: Date.now()
                }].slice(-20)
            }));
            currentPlayerState = updatedPlayer;

            if (newHealth <= 0) {
                playerSurvived = false;
                killerInfo = { monster: monster, damage };
                setGameState(prev => ({
                    ...prev,
                    gridBlocks: prev.gridBlocks.map(b => b.id === playerBlock.id ? { ...b, animation: 'fatal-hit' } : b)
                }));
                
                await new Promise(r => setTimeout(r, 1500));
                
                setShowDefeatModal(true);

                if (killerInfo) {
                    const newRecord: DeathRecord = {
                        id: `${killerInfo.monster.id}-${Date.now()}`,
                        timestamp: Date.now(),
                        monster: JSON.parse(JSON.stringify(killerInfo.monster)),
                        damageDealt: killerInfo.damage,
                        finalHealth: newHealth,
                    };
                    setGameState(prev => ({ ...prev, deathLog: [...prev.deathLog, newRecord] }));
                }

                const healthRestored = player.stats.attack + player.stats.defense + player.stats.magicResist;
                const defeatedPlayer = { ...player, temperingStones: 0, gold: 0, stats: { ...player.stats, health: healthRestored } };
                const { newGrid, newTreasureBlockId } = generateNewGrid(defeatedPlayer, searchSettings);
                setGameState(prev => ({
                    ...prev,
                    player: defeatedPlayer,
                    gridBlocks: newGrid,
                    guardedTreasureState: newTreasureBlockId ? { highestQualityOnGrid: null, isUnlocked: false, treasureBlockId: newTreasureBlockId } : null,
                    challengeState: { isActive: false, rankToUnlock: null },
                    floorChallengeState: { isActive: false, targetFloor: 0, isCompleted: false },
                    revengeState: { isActive: false, recordId: null, chestBlockId: null },
                }));
                
                break; 
            }

            await new Promise(r => setTimeout(r, 400));
        }

        if (playerSurvived) {
            const debuffedBlocksToCarryOver: GridBlock[] = [];
            const attackerIdsForAnimation = new Set<string>();

            for (const attackerBlock of allAttackers) {
                const monster = attackerBlock.data as Monster;
                
                const originalStats = monster.originalStats || {
                    maxHealth: monster.stats.maxHealth,
                    attack: monster.stats.attack,
                    defense: monster.stats.defense,
                };

                const reductionAmount = Math.max(1, Math.floor(currentPlayerState.stats.magicResist * 0.01));

                const newMaxHealth = Math.max(1, monster.stats.maxHealth - reductionAmount);
                const currentHealthRatio = monster.stats.health / monster.stats.maxHealth;
                const newHealth = Math.max(1, Math.floor(newMaxHealth * currentHealthRatio));

                const newAttack = Math.max(1, monster.stats.attack - reductionAmount);
                const newDefense = Math.max(1, monster.stats.defense - reductionAmount);
                
                const newStatsWithoutCP = {
                    ...monster.stats,
                    maxHealth: newMaxHealth,
                    health: newHealth,
                    attack: newAttack,
                    defense: newDefense,
                };
                
                const newCombatPower = calculateCharacterCombatPower(newStatsWithoutCP, false);
                
                const updatedMonster: Monster = {
                    ...monster,
                    stats: { ...newStatsWithoutCP, combatPower: newCombatPower },
                    originalStats: originalStats,
                    stickiness: (monster.stickiness || 0) + 1,
                };
                
                updateLog(`${monster.name}在追击你时，消耗了部分修为。`, 'text-orange-300');
                attackerIdsForAnimation.add(attackerBlock.id);
                
                debuffedBlocksToCarryOver.push({
                    ...attackerBlock,
                    data: updatedMonster,
                });
            }
            
            if (attackerIdsForAnimation.size > 0) {
                setGameState(prev => ({
                    ...prev,
                    gridBlocks: prev.gridBlocks.map(b => 
                        attackerIdsForAnimation.has(b.id) 
                        ? { ...b, animation: 'stat-down' } 
                        : b
                    )
                }));
                await new Promise(r => setTimeout(r, 1000));
            } else {
                await new Promise(r => setTimeout(r, 1000));
            }

            const { newGrid, newTreasureBlockId } = generateNewGrid(currentPlayerState, searchSettings, debuffedBlocksToCarryOver);
            
            setGameState(prev => {
                const finalPlayerStats = calculatePlayerStats(currentPlayerState);
                const finalGridWithOutcomes = reCalculateGridOutcomes(finalPlayerStats, newGrid);
                return {
                    ...prev,
                    player: { ...currentPlayerState, stats: finalPlayerStats },
                    gridBlocks: finalGridWithOutcomes,
                    guardedTreasureState: newTreasureBlockId ? { highestQualityOnGrid: null, isUnlocked: false, treasureBlockId: newTreasureBlockId } : null,
                };
            });
        }
    }, [gameState, generateNewGrid, addFeedback, setGameState, setProjectileAnims, setShowDefeatModal, updateLog, setIsSearchOnCooldown]);

    return {
        generateNewGrid,
        handleRefreshGrid,
    };
};
