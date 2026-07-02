
import React, { useCallback } from 'react';
import {
  SearchSettings, MonsterRank, GridBlock, Monster, Chest, DeathRecord, ChestType
} from '../types';
import { calculateCombatOutcome } from '../services/combat';
import { generateMonster } from '../services/character';
import { REALMS } from '../realmConstants';
import { initiateFloorChallenge } from '../services/challengeService';

export const useGameModes = ({ gameState, setGameState, updateLog, updateTopStats, generateNewGrid, setShowGoToFloorModal, setForfeitTriggered }) => {
    const { player, challengeState, floorChallengeState, revengeState } = gameState;

    const handleInitiateChallenge = useCallback((rank: MonsterRank) => {
        updateLog(`挑战开始：击败【${player.realmIndex >= 0 ? REALMS[player.realmIndex].name : ''} - ${rank}】以解锁永久搜寻。`, 'text-yellow-400');

        const challengeSettings: SearchSettings = { mode: 'constrained', rankConstraint: rank, isRealmConstrained: true };
        const { newGrid } = generateNewGrid(player, challengeSettings);

        for (let i = 0; i < 16; i++) {
            if (newGrid[i]?.type === 'player') continue;
            const monster = generateMonster(player, challengeSettings);
            newGrid[i] = { id: monster.id, type: 'monster', data: monster, combatOutcome: calculateCombatOutcome(player.stats, monster) };
        }
        setGameState(prev => ({ ...prev, gridBlocks: newGrid, challengeState: { isActive: true, rankToUnlock: rank }, guardedTreasureState: null }));
        updateTopStats({ monsters: newGrid.filter(b => b.type === 'monster').map(b => b.data as Monster) });
    }, [player, updateLog, updateTopStats, generateNewGrid, setGameState]);

    const handleForfeitChallenge = useCallback(() => {
        if (challengeState.isActive) {
            updateLog('你放弃了境界挑战。', 'text-gray-400');
            setGameState(prev => ({ ...prev, challengeState: { isActive: false, rankToUnlock: null } }));
        }
        if (floorChallengeState.isActive) {
            updateLog('你放弃了楼层挑战。', 'text-gray-400');
            setGameState(prev => ({ ...prev, floorChallengeState: { isActive: false, targetFloor: 0, isCompleted: false } }));
        }
        if (revengeState.isActive) {
            updateLog('你放弃了复仇。', 'text-gray-400');
            setGameState(prev => ({ ...prev, revengeState: { isActive: false, recordId: null, chestBlockId: null } }));
        }
        setForfeitTriggered(true);
    }, [challengeState.isActive, floorChallengeState.isActive, revengeState.isActive, updateLog, setGameState, setForfeitTriggered]);

    const handleDeleteDeathRecord = useCallback((recordId: string) => {
        setGameState(prev => ({
            ...prev,
            deathLog: prev.deathLog.filter(r => r.id !== recordId),
        }));
        updateLog('一条死亡记录已被删除。', 'text-gray-400');
    }, [setGameState, updateLog]);

    const handleRevenge = useCallback((record: DeathRecord) => {
        updateLog(`你已向【${record.monster.rank}】${record.monster.name} 发起复仇！`, 'text-red-500 font-bold');

        const newGrid: GridBlock[] = Array(16).fill(null).map((_, i) => ({
            id: `revenge-empty-${i}-${crypto.randomUUID()}`, type: 'empty', data: null,
        }));

        newGrid[12] = { id: 'player-start', type: 'player', data: null };

        const monsterForRevenge = { ...record.monster, id: `revenge-${record.monster.id}`, stats: { ...record.monster.stats, health: record.monster.stats.maxHealth } };
        newGrid[3] = {
            id: monsterForRevenge.id, type: 'monster', data: monsterForRevenge,
            combatOutcome: calculateCombatOutcome(player.stats, monsterForRevenge),
        };

        const chest: Chest = {
            id: `revenge-chest-${crypto.randomUUID()}`, type: ChestType.Ancient,
            equipmentRealm: REALMS[record.monster.realmIndex].name,
            realmIndex: record.monster.realmIndex
        };

        const availableIndices = [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15];
        const chestIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        newGrid[chestIndex] = {
            id: chest.id, type: 'chest', data: chest, isLocked: true,
        };

        setGameState(prev => ({
            ...prev, gridBlocks: newGrid,
            revengeState: { isActive: true, recordId: record.id, chestBlockId: chest.id },
            challengeState: { isActive: false, rankToUnlock: null },
            floorChallengeState: { isActive: false, targetFloor: 0, isCompleted: false },
            guardedTreasureState: null,
        }));
    }, [player.stats, setGameState, updateLog]);

    const handlePreviousFloor = useCallback(() => {
        if (player.currentFloor <= 1) return;
        const newFloor = player.currentFloor - 1;
        const tempPlayer = { ...player, currentFloor: newFloor };
        const { newGrid, newTreasureBlockId } = generateNewGrid(tempPlayer, gameState.searchSettings);
        setGameState(prev => ({
            ...prev, player: tempPlayer, gridBlocks: newGrid,
            guardedTreasureState: newTreasureBlockId ? { highestQualityOnGrid: null, isUnlocked: false, treasureBlockId: newTreasureBlockId } : null,
        }));
        updateLog(`已前往第 ${newFloor} 层`, 'text-gray-400');
    }, [player, gameState.searchSettings, generateNewGrid, updateLog, setGameState]);

    const handleNextFloor = useCallback(() => {
        if (player.currentFloor < player.highestFloor) {
            const newFloor = player.currentFloor + 1;
            const tempPlayer = { ...player, currentFloor: newFloor };
            const { newGrid, newTreasureBlockId, isMapHostile } = generateNewGrid(tempPlayer, gameState.searchSettings);
            setGameState(prev => ({
                ...prev, player: tempPlayer, gridBlocks: newGrid,
                isMapHostile,
                guardedTreasureState: newTreasureBlockId ? { highestQualityOnGrid: null, isUnlocked: false, treasureBlockId: newTreasureBlockId } : null,
            }));
            updateLog(`已前往第 ${newFloor} 层`, 'text-gray-400');
        } else {
            const targetFloor = player.highestFloor + 1;
            updateLog(`开始挑战第 ${targetFloor} 层！`, 'text-yellow-400 font-bold');
            initiateFloorChallenge(player, targetFloor, setGameState, updateTopStats);
        }
    }, [player, gameState.searchSettings, generateNewGrid, updateLog, updateTopStats, setGameState]);

    const handleGoToFloor = useCallback((floor: number) => {
        if (floor > 0 && floor <= player.highestFloor) {
            setShowGoToFloorModal(false);
            const tempPlayer = { ...player, currentFloor: floor };
            const { newGrid, newTreasureBlockId, isMapHostile } = generateNewGrid(tempPlayer, gameState.searchSettings);
            setGameState(prev => ({
                ...prev, player: tempPlayer, gridBlocks: newGrid,
                isMapHostile,
                guardedTreasureState: newTreasureBlockId ? { highestQualityOnGrid: null, isUnlocked: false, treasureBlockId: newTreasureBlockId } : null,
            }));
            updateLog(`已快速前往第 ${floor} 层`, 'text-blue-300');
        } else if (floor > player.highestFloor) {
             setShowGoToFloorModal(false);
             updateLog(`开始快速挑战第 ${floor} 层！`, 'text-yellow-400 font-bold');
             initiateFloorChallenge(player, floor, setGameState, updateTopStats);
        } else {
            updateLog(`无效的楼层。请输入 1 到 ${player.highestFloor} 之间的数字，或更高的数字以发起挑战。`, 'text-red-400');
        }
    }, [player, gameState.searchSettings, generateNewGrid, updateLog, setGameState, setShowGoToFloorModal, updateTopStats]);

    const handleAscendFloor = useCallback(() => {
        const { targetFloor } = gameState.floorChallengeState;
        if (!targetFloor) return;
    
        const newPlayerState = {
            ...gameState.player,
            currentFloor: targetFloor,
            highestFloor: targetFloor,
        };
    
        const { newGrid, newTreasureBlockId } = generateNewGrid(newPlayerState, gameState.searchSettings);
    
        setGameState(prev => ({
            ...prev,
            player: newPlayerState,
            gridBlocks: newGrid,
            guardedTreasureState: newTreasureBlockId ? { highestQualityOnGrid: null, isUnlocked: false, treasureBlockId: newTreasureBlockId } : null,
            floorChallengeState: { isActive: false, targetFloor: 0, isCompleted: false } // Reset state
        }));
    
        updateLog(`成功抵达第 ${targetFloor} 层。`, 'text-blue-300');
    
    }, [gameState.floorChallengeState, gameState.player, gameState.searchSettings, generateNewGrid, setGameState, updateLog]);

    return {
        handleInitiateChallenge,
        handleForfeitChallenge,
        handleDeleteDeathRecord,
        handleRevenge,
        handlePreviousFloor,
        handleNextFloor,
        handleGoToFloor,
        handleAscendFloor,
    };
};
