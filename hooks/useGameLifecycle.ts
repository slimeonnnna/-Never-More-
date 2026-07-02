
import { useEffect } from 'react';
import { calculatePlayerStats } from '../services/character';
import { reCalculateGridOutcomes } from '../services/combat';

export const useGameLifecycle = ({ 
    gameState, setGameState, handleAutoLootAndFight, handleAutoTemper, forfeitTriggered, setForfeitTriggered,
    handleRefreshGrid, updateLog, setIsSearchOnCooldown, setShowOffensiveInfoModal,
    projectileAnims, isAutomating
}) => {
    
    // Activate offensive system
    useEffect(() => {
        if (!gameState.isOffensiveSystemActive) {
          const totalEquipmentCount = gameState.player.inventory.length + Object.values(gameState.player.equipped).filter(Boolean).length;
          const shouldActivate = gameState.player.stats.attack > 100 || gameState.player.stats.defense > 100 || totalEquipmentCount > 20;
          if (shouldActivate) {
            setGameState(prev => ({ ...prev, isOffensiveSystemActive: true }));
            if (!gameState.hasSeenOffensiveSystemPopup) {
                setShowOffensiveInfoModal(true);
            }
          }
        }
    }, [gameState.player.stats.attack, gameState.player.stats.defense, gameState.player.inventory, gameState.player.equipped, gameState.isOffensiveSystemActive, gameState.hasSeenOffensiveSystemPopup, setGameState, setShowOffensiveInfoModal]);
    
    // Post-forfeit grid refresh
    useEffect(() => {
        if (forfeitTriggered) {
            if (!gameState.challengeState.isActive && !gameState.floorChallengeState.isActive && !gameState.revengeState.isActive) {
                handleRefreshGrid();
                setForfeitTriggered(false);
            }
        }
    }, [forfeitTriggered, gameState.challengeState.isActive, gameState.floorChallengeState.isActive, gameState.revengeState.isActive, handleRefreshGrid, setForfeitTriggered]);

    // Recalculate player stats
    useEffect(() => {
        const newStats = calculatePlayerStats(gameState.player);
        const newGridWithOutcomes = reCalculateGridOutcomes(newStats, gameState.gridBlocks);
        setGameState(prev => ({ ...prev, player: { ...prev.player, stats: newStats }, gridBlocks: newGridWithOutcomes }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState.player.equipped, gameState.player.permanentBonuses, gameState.player.currentFloor, setGameState]);

    // Unlock guarded treasure
    useEffect(() => {
        if (gameState.guardedTreasureState && !gameState.guardedTreasureState.isUnlocked) {
            const isCleared = !gameState.gridBlocks.some(b => b.type === 'monster' || b.type === 'chest');
            if (isCleared) {
                updateLog('所有敌人都已清除，<span class="text-legendary">宝藏已解锁！</span>', 'text-legendary', true);
                setGameState(prev => ({
                    ...prev,
                    guardedTreasureState: prev.guardedTreasureState ? { ...prev.guardedTreasureState, isUnlocked: true } : null
                }));
            }
        }
    }, [gameState.gridBlocks, gameState.guardedTreasureState, updateLog, setGameState]);

    // Cooldown ends
    useEffect(() => {
        const isGridCleared = !gameState.gridBlocks.some(b => b.type === 'monster' || b.type === 'chest');
        if (isGridCleared) {
            setIsSearchOnCooldown(false);
        }
    }, [gameState.gridBlocks, setIsSearchOnCooldown]);

    // Main automation loop
    useEffect(() => {
        if (projectileAnims.length > 0) return;
        if (gameState.challengeState.isActive || gameState.floorChallengeState.isActive || gameState.revengeState.isActive) return;

        const runAutomation = () => {
            if (isAutomating.current) return;
            const temperPerformed = handleAutoTemper();
            if (temperPerformed) {
                isAutomating.current = true;
                setTimeout(() => { isAutomating.current = false; }, 500);
                return;
            }
            handleAutoLootAndFight();
        };
        
        const timeoutId = setTimeout(runAutomation, 500);
        return () => clearTimeout(timeoutId);
    }, [gameState, handleAutoLootAndFight, handleAutoTemper, projectileAnims, isAutomating]);
};
