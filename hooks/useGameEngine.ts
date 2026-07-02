
import React, { useCallback, useRef } from 'react';
import { useGameLog } from './useGameLog';
import { useTopStats } from './useTopStats';
import { useGridManager } from './useGridManager';
import { usePlayerActions } from './usePlayerActions';
import { useGameModes } from './useGameModes';
import { useInteractionManager } from './useInteractionManager';
import { useAutomation } from './useAutomation';
import { createNewPlayer, createInitialGrid, defaultAutomationSettings, SAVE_KEY } from '../services/stateManager';
import { SearchSettings, Equipment, EquipmentQuality, EquipmentSlot, MonsterRank, GridBlock, Monster } from '../types';
import { generateEquipment } from '../services/equipmentGeneration';
import { REALMS } from '../realmConstants';
import { formatLargeNumber } from '../utils';

export const useGameEngine = (props: any) => {
    const { gameState, setGameState, ...uiStateAndSetters } = props;
    const { setLogs, setShowOffensiveInfoModal, setShowDefeatModal, setSelectedItem, setInteractionActionState, onAIDeductGold } = uiStateAndSetters;
    const isAutomating = useRef(false);

    const hookContext = {
        gameState, setGameState,
        ...uiStateAndSetters,
        isAutomating,
    };

    const gameLog = useGameLog(hookContext);
    const topStats = useTopStats(hookContext);
    const gridManager = useGridManager({ ...hookContext, ...gameLog, ...topStats });
    const playerActions = usePlayerActions({ ...hookContext, ...gameLog });
    const gameModes = useGameModes({ ...hookContext, ...gameLog, ...topStats, ...gridManager });
    const interactionManager = useInteractionManager({ ...hookContext, ...gameLog, ...topStats, ...gameModes, ...gridManager });
    const automation = useAutomation({ ...hookContext, ...gameLog, ...topStats, ...playerActions });

    const handleCloseOffensiveInfoModal = useCallback(() => {
        setShowOffensiveInfoModal(false);
        setGameState(prev => ({ ...prev, hasSeenOffensiveSystemPopup: true }));
    }, [setShowOffensiveInfoModal, setGameState]);

    const handleCloseDefeatModal = useCallback(() => {
        setShowDefeatModal(false);
        gameLog.updateLog(`危急时刻，你的潜能爆发，恢复了部分体力。`, 'text-green-300');
    }, [setShowDefeatModal, gameLog]);

    const handleConfirmReset = useCallback(() => {
        uiStateAndSetters.setShowResetConfirm(false);
        gameLog.updateLog('游戏已重置。祝你好运，冒险者！', 'text-yellow-300 font-bold');
        localStorage.removeItem(SAVE_KEY);
        setGameState({ 
            player: createNewPlayer(),
            gridBlocks: createInitialGrid(true),
            searchSettings: { mode: 'random', rankConstraint: null, isRealmConstrained: false },
            unlockedRanks: [],
            automationSettings: defaultAutomationSettings,
            topCombatPowerEquipment: [],
            topQualityEquipment: [],
            strongestEnemies: [],
            topRestoringEnemies: [],
            deathLog: [],
            isOffensiveSystemActive: false,
            hasSeenOffensiveSystemPopup: false,
            challengeState: { isActive: false, rankToUnlock: null },
            floorChallengeState: { isActive: false, targetFloor: 0, isCompleted: false },
            revengeState: { isActive: false, recordId: null, chestBlockId: null },
            gmMonsterRequest: null,
            guardedTreasureState: null,
        });
        setLogs([]);
    }, [setGameState, setLogs, uiStateAndSetters, gameLog]);

    const handleSearchSettingsChange = useCallback((newSettings: Partial<SearchSettings>) => {
        const currentSettings = gameState.searchSettings;
        if (newSettings.mode !== undefined && newSettings.mode !== currentSettings.mode) {
            let modeText = '';
            switch(newSettings.mode) {
                case 'random': modeText = '恢复随机'; break;
                case 'similarStrength': modeText = '实力相近'; break;
                case 'constrained': modeText = '搜寻限制'; break;
            }
            gameLog.updateLog(`搜寻模式已更改为: ${modeText}`, 'text-cyan-300');
        }
        if (newSettings.rankConstraint !== undefined && newSettings.rankConstraint !== currentSettings.rankConstraint) {
            const rankText = newSettings.rankConstraint ? `【${newSettings.rankConstraint}】` : '无限制';
            gameLog.updateLog(`战力阶级限制已更改为: ${rankText}`, 'text-cyan-300');
        }
        if (newSettings.isRealmConstrained !== undefined && newSettings.isRealmConstrained !== currentSettings.isRealmConstrained) {
            gameLog.updateLog(`境界限制已${newSettings.isRealmConstrained ? '激活' : '取消'}`, 'text-cyan-300');
        }

        if (newSettings.mode === 'random') {
          setGameState(prev => ({ ...prev, searchSettings: { mode: 'random', rankConstraint: null, isRealmConstrained: false }}));
        } else {
          setGameState(prev => ({ ...prev, searchSettings: { ...prev.searchSettings, ...newSettings }}));
        }
    }, [setGameState, gameLog, gameState.searchSettings]);

    const handleGmGenerateEquipment = useCallback((config: { realmIndex: number, quality: EquipmentQuality, qualityLevel: number, slot: EquipmentSlot }) => {
        const newItem = generateEquipment(
            config.realmIndex,
            EquipmentQuality.Common, // base doesn't matter
            0, // chance doesn't matter
            1, // floor doesn't matter
            config.quality, // override quality
            config.slot, // override slot
            config.quality === EquipmentQuality.Void ? config.qualityLevel : undefined // override level
        );
    
        if (newItem) {
            setGameState(prev => {
                const newInventory = [...prev.player.inventory, newItem];
                // Ensure inventory doesn't overflow. For now, this is fine.
                return {...prev, player: {...prev.player, inventory: newInventory}};
            });
            gameLog.updateLog(`GM: 获得了装备。`, 'text-lime-300', false, newItem);
        }
    }, [setGameState, gameLog]);

    const handleGmGenerateMonster = useCallback((config: { realmIndex: number, rank: MonsterRank, isFriendly: boolean }) => {
        setGameState(prev => ({ ...prev, gmMonsterRequest: config }));
        gameLog.updateLog(`GM: 下次搜寻时将生成一个 ${REALMS[config.realmIndex].name} 的 ${config.rank} ${config.isFriendly ? '中立' : '敌人'}`, 'text-lime-300');
    }, [setGameState, gameLog]);

    const handleSpareMe = useCallback((block: GridBlock) => {
        const monster = block.data as Monster;
        if (!monster) return;
    
        const playerPower = gameState.player.stats.combatPower;
        const monsterPower = monster.stats.combatPower;
        let cost = 0;
        let canSpare = false;
    
        if (monsterPower > playerPower) {
            canSpare = true;
            cost = (monsterPower - playerPower) * 10;
            if (cost < monsterPower) {
                cost = monsterPower;
            }
            cost = Math.min(cost, monsterPower * 2);
        }
    
        if (!canSpare) {
            gameLog.updateLog(`你比【${monster.name}】更强，无需请求宽恕。`, 'text-yellow-400');
            return;
        }

        if (gameState.player.gold < cost) {
            gameLog.updateLog(`金币不足，无法让【${monster.name}】高抬贵手。需要 ${formatLargeNumber(cost)} 金币。`, 'text-red-400');
            return;
        }
    
        gameLog.updateLog(`你支付了 ${formatLargeNumber(cost)} 金币，【${monster.name}】决定放你一马，消失了。`, 'text-yellow-400');
    
        setGameState(prev => {
            const newPlayer = {
                ...prev.player,
                gold: prev.player.gold - cost,
            };
    
            const newGrid = prev.gridBlocks.map(b => 
                b.id === block.id 
                ? { ...b, type: 'empty' as const, data: null, combatOutcome: null, stickiness: undefined } 
                : b
            );
    
            const newHistories = { ...prev.chatHistories };
            delete newHistories[block.id];
    
            return {
                ...prev,
                player: newPlayer,
                gridBlocks: newGrid,
                chatHistories: newHistories
            };
        });
        
        setInteractionActionState(null);
    }, [gameState, setGameState, gameLog, setInteractionActionState]);

    const handleAIGiveItem = useCallback((item: Equipment) => {
        setGameState(prev => {
            const newInventory = [...prev.player.inventory, item];
            return { ...prev, player: { ...prev.player, inventory: newInventory } };
        });
        gameLog.updateLog(`你获得了物品：${item.name}`, 'text-purple-300', false, item);
    }, [setGameState, gameLog]);

    const handleAIGiveGold = useCallback((amount: number) => {
        setGameState(prev => ({
            ...prev,
            player: { ...prev.player, gold: prev.player.gold + amount }
        }));
        gameLog.updateLog(`你获得了 ${formatLargeNumber(amount)} 金币`, 'text-yellow-400');
    }, [setGameState, gameLog]);

    const handleAIHealPlayer = useCallback((amount: number) => {
        setGameState(prev => {
            const newHealth = Math.min(prev.player.stats.maxHealth, prev.player.stats.health + amount);
            return {
                ...prev,
                player: { ...prev.player, stats: { ...prev.player.stats, health: newHealth } }
            };
        });
        gameLog.updateLog(`你恢复了 ${formatLargeNumber(amount)} 点体力`, 'text-green-400');
    }, [setGameState, gameLog]);

    const handleAIRemoveBlock = useCallback((blockId: string) => {
        setGameState(prev => {
            const newGrid = prev.gridBlocks.map(b => 
                b.id === blockId 
                ? { ...b, type: 'empty' as const, data: null, combatOutcome: null, stickiness: undefined } 
                : b
            );
            const newHistories = { ...prev.chatHistories };
            delete newHistories[blockId];
            return { ...prev, gridBlocks: newGrid, chatHistories: newHistories };
        });
    }, [setGameState]);

    const handleAIDeductGold = useCallback((amount: number) => {
        setGameState(prev => {
            const actualDeduction = Math.min(prev.player.gold, amount);
            return {
                ...prev,
                player: { ...prev.player, gold: prev.player.gold - actualDeduction }
            };
        });
        gameLog.updateLog(`你支付了 ${formatLargeNumber(amount)} 金币`, 'text-orange-400');
    }, [setGameState, gameLog]);

    const handleAIMakeFriendly = useCallback((blockId: string) => {
        setGameState(prev => {
            const newGrid = prev.gridBlocks.map(b => {
                if (b.id === blockId && b.type === 'monster' && b.data) {
                    const monster = b.data as Monster;
                    return { 
                        ...b, 
                        type: 'friendly' as const,
                        data: { 
                            ...monster, 
                            isFriendly: true,
                            stickiness: 0,
                        } 
                    };
                }
                return b;
            });
            return { ...prev, gridBlocks: newGrid };
        });
        gameLog.updateLog(`对方决定放过你，并化敌为中立！`, 'text-green-400 font-bold');
    }, [setGameState, gameLog]);

    return {
        ...gameLog,
        ...topStats,
        ...gridManager,
        ...playerActions,
        ...gameModes,
        ...interactionManager,
        ...automation,
        handleCloseOffensiveInfoModal,
        handleCloseDefeatModal,
        handleConfirmReset,
        handleSearchSettingsChange,
        handleGmGenerateEquipment,
        handleGmGenerateMonster,
        handleSpareMe,
        handleAIGiveItem,
        handleAIGiveGold,
        handleAIDeductGold,
        handleAIHealPlayer,
        handleAIRemoveBlock,
        handleAIMakeFriendly,
        isAutomating,
    };
};
