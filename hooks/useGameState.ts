
import React from 'react';
import { useGameSession } from './useGameSession';
import { useUIStateManager } from './useUIStateManager';
import { useGameEngine } from './useGameEngine';
import { useGameLifecycle } from './useGameLifecycle';

export const useGameState = () => {
    const { gameState, setGameState } = useGameSession();
    const uiState = useUIStateManager({ setGameState });
    const gameEngine = useGameEngine({ gameState, setGameState, ...uiState });

    useGameLifecycle({ gameState, setGameState, ...uiState, ...gameEngine });

    return {
        gameState,
        setGameState,
        ...uiState,
        ...gameEngine,
    };
};
