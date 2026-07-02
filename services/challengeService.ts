
import { Player, GridBlock, MonsterRank, GameState, Monster } from '../types';
import { createMonsterInternal, getLowestPossibleRealmIndex } from './character';
import { calculateCombatOutcome } from './combat';

export const initiateFloorChallenge = (
    player: Player,
    targetFloor: number,
    setGameState: (updater: (prev: GameState) => GameState) => void,
    updateTopStats: (updates: { monsters?: Monster[] }) => void
) => {
    // The monster for floor N's challenge is generated based on the stats of floor N-1.
    const challengeGenerationFloor = targetFloor - 1;
    const lowestRealmForChallenge = getLowestPossibleRealmIndex(challengeGenerationFloor);
    
    const challengeMonster = createMonsterInternal({
        forcedRank: MonsterRank.Ancient,
        forcedRealmIndex: lowestRealmForChallenge,
        floor: challengeGenerationFloor // Monster gets divinity bonus for the floor it's on
    });

    const newGrid: GridBlock[] = Array(16).fill(null).map((_, i) => ({ id: `cf-empty-${i}-${crypto.randomUUID()}`, type: 'empty', data: null }));
    const playerIndex = 12; // Place player at a fixed position
    newGrid[playerIndex] = { id: 'player-start', type: 'player', data: null };

    let monsterPlaced = false;
    while (!monsterPlaced) {
        const randomIndex = Math.floor(Math.random() * 16);
        if (randomIndex !== playerIndex) {
            newGrid[randomIndex] = { id: challengeMonster.id, type: 'monster', data: challengeMonster, combatOutcome: calculateCombatOutcome(player.stats, challengeMonster) };
            monsterPlaced = true;
        }
    }
    
    setGameState(prev => ({ 
        ...prev, 
        gridBlocks: newGrid, 
        guardedTreasureState: null, 
        floorChallengeState: { isActive: true, targetFloor: targetFloor, isCompleted: false } 
    }));
    updateTopStats({ monsters: [challengeMonster] });
};
