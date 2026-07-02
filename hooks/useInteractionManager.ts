
import React, { useCallback } from 'react';
import { GridBlock, Monster } from '../types';
import { isPathPossible } from '../utils';
import { useCombatResolver } from './useCombatResolver';
import { useItemResolver } from './useItemResolver';

export const useInteractionManager = (context) => {
    const { gameState, addFeedback, updateLog, generateNewGrid, setSelectedFriendlyUnit, setInteractionState, setInteractionActionState } = context;
    const { gridBlocks, challengeState, floorChallengeState, revengeState } = gameState;

    const combatResolver = useCombatResolver({ ...context, generateNewGrid });
    const { handleItemInteraction } = useItemResolver(context);

    const handleBlockClick = useCallback(async (block: GridBlock, element: HTMLElement) => {
        if (challengeState.isActive || floorChallengeState.isActive || revengeState.isActive) {
            if (block.type !== 'monster') {
                updateLog('挑战期间无法进行其他操作。', 'text-yellow-400');
                return;
            }
        }
        
        const playerIndex = gridBlocks.findIndex(b => b.type === 'player');
        const blockIndex = gridBlocks.findIndex(b => b.id === block.id);

        if (playerIndex === -1 || !isPathPossible(gridBlocks, playerIndex, blockIndex, gameState.isMapHostile)) {
            addFeedback({ onId: block.id, text: '路径不通', className: 'text-yellow-400' });
            return;
        }

        switch (block.type) {
            case 'monster':
            case 'friendly': {
                setInteractionState({ block, element });
                break;
            }
            case 'chest':
            case 'item':
            case 'guarded_treasure': {
                handleItemInteraction(block);
                break;
            }
        }
    }, [gridBlocks, challengeState.isActive, floorChallengeState.isActive, revengeState.isActive, updateLog, addFeedback, handleItemInteraction, setInteractionState]);
    
    const handleViewCharacter = useCallback((block: GridBlock) => {
        const character = block.data as Monster;
        if (!character) return;

        setSelectedFriendlyUnit(character);
        setInteractionState(null);
    }, [setInteractionState, setSelectedFriendlyUnit]);

    const handleInteractCharacter = useCallback((block: GridBlock) => {
        setInteractionState(null);
        setInteractionActionState({ block });
    }, [setInteractionState, setInteractionActionState]);

    const handleBattleCharacter = useCallback(async (block: GridBlock) => {
        setInteractionState(null);
        if (!block.combatOutcome) return;
        
        const monster = block.data as Monster;

        if (monster.isFriendly) {
            updateLog(`你向中立单位【${monster.rank}】${monster.name}发起了攻击...`, 'text-orange-300');
        } else {
             updateLog(`你向【${monster.rank}】${monster.name}发起了攻击...`, 'text-orange-300');
        }

        if (block.combatOutcome.playerWon) {
            combatResolver.handleWinSequence(block, block.combatOutcome.healthChange);
        } else {
            await combatResolver.initiateManualCombatRound(block);
        }
    }, [setInteractionState, updateLog, combatResolver]);


    return { 
        handleBlockClick,
        handleViewCharacter,
        handleInteractCharacter,
        handleBattleCharacter
    };
};
