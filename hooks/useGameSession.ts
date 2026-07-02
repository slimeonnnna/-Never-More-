import { useState, useEffect } from 'react';
import { GameState } from '../types';
import { loadState, saveState } from '../services/stateManager';

export const useGameSession = () => {
  const [gameState, setGameState] = useState<GameState>(loadState);

  useEffect(() => {
    saveState(gameState);
  }, [gameState]);

  return { gameState, setGameState };
};
