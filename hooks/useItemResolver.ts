import React, { useCallback } from 'react';
import { GridBlock, Monster, Chest, Equipment, EquipmentQuality } from '../types';
import { processItemInteractionResult } from '../services/itemResult';
import { ORDERED_QUALITIES } from '../constants';

export const useItemResolver = ({
    gameState, setGameState, updateLog, addFeedback, triggerFeedbackQueue,
    updateTopStats,
}) => {
    const { player, guardedTreasureState } = gameState;

    const triggerAnimation = useCallback((blockId: string, type: 'combat' | 'loot') => {
        setGameState(prev => ({ ...prev, gridBlocks: prev.gridBlocks.map(b => b.id === blockId ? { ...b, animation: type } : b) }));
        setTimeout(() => {
            setGameState(prev => ({ ...prev, gridBlocks: prev.gridBlocks.map(b => b.id === blockId ? { ...b, animation: null } : b) }));
        }, 500);
    }, [setGameState]);

    const handleItemInteraction = useCallback((block: GridBlock) => {
        if (block.isLocked) {
            addFeedback({ onId: block.id, text: '🔒', className: 'text-4xl' });
            updateLog('宝箱被锁住了，需要先完成复仇目标。', 'text-yellow-400');
            return;
        }
        if (block.type === 'guarded_treasure' && !guardedTreasureState?.isUnlocked) {
             addFeedback({ onId: block.id, text: '?', className: 'text-4xl' });
             updateLog('宝藏被怪物镇守着，需要先击败其上下左右的敌人。', 'text-yellow-400');
             return;
        }
        
        triggerAnimation(block.id, 'loot');

        const {
            player: updatedPlayer,
            allLoot,
            logs,
            feedbacks,
            topStatsUpdates,
            isTreasure
        } = processItemInteractionResult(
            player,
            block,
            guardedTreasureState,
            gameState.automationSettings,
            gameState.gridBlocks
        );

        triggerFeedbackQueue(feedbacks, 250);
        logs.forEach(log => updateLog(log.message, log.color, log.isHtml));
        if (Object.keys(topStatsUpdates).length > 0) updateTopStats(topStatsUpdates);

        setGameState(prev => {
            let newGuardedTreasureState = prev.guardedTreasureState;
            if (allLoot.length > 0 && newGuardedTreasureState) {
                const currentHighestQualityIndex = newGuardedTreasureState.highestQualityOnGrid ? ORDERED_QUALITIES.indexOf(newGuardedTreasureState.highestQualityOnGrid) : -1;
                const highestNewLootItem = allLoot.reduce((best, current) => {
                    const bestValue = ORDERED_QUALITIES.indexOf(best.quality) + (best.qualityLevel || 0);
                    const currentValue = ORDERED_QUALITIES.indexOf(current.quality) + (current.qualityLevel || 0);
                    return currentValue > bestValue ? current : best;
                }, allLoot[0]);
                const highestNewLootItemValue = ORDERED_QUALITIES.indexOf(highestNewLootItem.quality) + (highestNewLootItem.qualityLevel || 0);
                if (highestNewLootItemValue > currentHighestQualityIndex) {
                    newGuardedTreasureState = { ...newGuardedTreasureState, highestQualityOnGrid: highestNewLootItem.quality };
                }
            }

            if (isTreasure) {
                newGuardedTreasureState = null;
            }
             
            return {
                ...prev,
                player: updatedPlayer,
                gridBlocks: prev.gridBlocks.map(b => b.id === block.id ? { ...b, type: 'empty' as const, data: null } : b),
                guardedTreasureState: newGuardedTreasureState,
                isMapHostile: true // Ensure map remains hostile
            };
        });
    }, [gameState, player, guardedTreasureState, updateLog, addFeedback, triggerFeedbackQueue, updateTopStats, setGameState, triggerAnimation]);

    return { handleItemInteraction };
};