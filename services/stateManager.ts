import { GameState, Player, GridBlock } from '../types';
import { PLAYER_BASE_STATS } from '../constants';
import { REALMS } from '../realmConstants';

export const SAVE_KEY = 'rpg_save_v17';

export const createNewPlayer = (): Player => {
  const initialRealm = REALMS[0];
  const { totalHpBonus, totalPointsBonus } = initialRealm;

  let points = totalPointsBonus;
  const p_atk = Math.floor(Math.random() * (points + 1));
  points -= p_atk;
  const p_def = points;
  const magicResistBonus = Math.round(totalPointsBonus * 1.5);

  return {
    realmIndex: 0,
    xp: 0,
    xpToNextLevel: 100,
    stats: { ...PLAYER_BASE_STATS, health: PLAYER_BASE_STATS.maxHealth, combatPower: 0 },
    equipped: {},
    inventory: [],
    permanentBonuses: {
      attack: p_atk,
      defense: p_def,
      health: totalHpBonus,
      magicResist: magicResistBonus,
    },
    gold: 0,
    temperingStones: 0,
    currentFloor: 1,
    highestFloor: 1,
  };
};

export const createInitialGrid = (isFirstLoad: boolean = false): GridBlock[] => {
    const grid: GridBlock[] = Array(16).fill(null).map((_, i) => ({
        id: `empty-${i}-${crypto.randomUUID()}`,
        type: 'empty',
        data: null
    }));
    const playerStartIndex = isFirstLoad ? 12 : Math.floor(Math.random() * 16);
    grid[playerStartIndex] = { id: 'player-start', type: 'player', data: null };
    return grid;
};

export const defaultAutomationSettings = {
    autoFight: false,
    autoLoot: false,
    autoRefine: false,
    autoEquip: false,
    autoTemper: false,
};

export const loadState = (): GameState => {
    try {
      const savedGame = localStorage.getItem(SAVE_KEY);
      if (savedGame) {
        const savedData = JSON.parse(savedGame) as Partial<GameState>;
        const defaultPlayer = createNewPlayer();
        const player: Player = {
          ...defaultPlayer,
          ...savedData.player,
          stats: { ...defaultPlayer.stats, ...savedData.player?.stats },
          permanentBonuses: { ...defaultPlayer.permanentBonuses, ...savedData.player?.permanentBonuses },
          equipped: savedData.player?.equipped || {},
          inventory: savedData.player?.inventory || [],
          gold: savedData.player?.gold || 0,
          temperingStones: savedData.player?.temperingStones || 0,
          currentFloor: savedData.player?.currentFloor || 1,
          highestFloor: savedData.player?.highestFloor || 1,
        };
        if (typeof player.xp !== 'number') player.xp = 0;
        
        return {
            player,
            gridBlocks: savedData.gridBlocks || createInitialGrid(true),
            searchSettings: savedData.searchSettings || { mode: 'random', rankConstraint: null, isRealmConstrained: false },
            unlockedRanks: savedData.unlockedRanks || [],
            automationSettings: { ...defaultAutomationSettings, ...savedData.automationSettings },
            topCombatPowerEquipment: savedData.topCombatPowerEquipment || [],
            topQualityEquipment: savedData.topQualityEquipment || [],
            strongestEnemies: savedData.strongestEnemies || [],
            topRestoringEnemies: savedData.topRestoringEnemies || [],
            deathLog: savedData.deathLog || [],
            isOffensiveSystemActive: savedData.isOffensiveSystemActive || false,
            hasSeenOffensiveSystemPopup: savedData.hasSeenOffensiveSystemPopup || false,
            challengeState: savedData.challengeState || { isActive: false, rankToUnlock: null },
            floorChallengeState: savedData.floorChallengeState || { isActive: false, targetFloor: 0, isCompleted: false },
            revengeState: savedData.revengeState || { isActive: false, recordId: null, chestBlockId: null },
            gmMonsterRequest: null,
            guardedTreasureState: savedData.guardedTreasureState || null,
            isMapHostile: savedData.isMapHostile || false,
            killStats: savedData.killStats || {},
            strongestKill: savedData.strongestKill || null,
            chatHistories: savedData.chatHistories || {},
            damageLog: savedData.damageLog || [],
        };
      }
    } catch (error) {
      console.error("Failed to load saved game:", error);
      localStorage.removeItem(SAVE_KEY);
    }
    return {
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
      isMapHostile: false,
      killStats: {},
      strongestKill: null,
      chatHistories: {},
      damageLog: [],
    };
};

export const saveState = (gameState: GameState) => {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    } catch (error) {
        console.error("Failed to save game:", error);
    }
};