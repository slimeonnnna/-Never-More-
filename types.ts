

import React from 'react';

export enum EquipmentSlot {
  Helmet = '头盔',
  Weapon = '武器',
  Shield = '护盾',
  Chest = '上衣',
  Gloves = '护手',
  Pants = '裤子',
  Boots = '鞋子',
  Cloak = '披风',
  LeftRing = '左手戒指',
  RightRing = '右手戒指',
  Necklace = '项链',
  Bracelet = '手镯',
}

export enum EquipmentQuality {
  Common = '普通',
  Uncommon = '精良',
  Rare = '稀有',
  Heirloom = '传承',
  Mythic = '神话',
  Legendary = '传说',
  Epic = '史诗',
  Ancient = '亘古',
  Supreme = '至尊',
  Chaos = '混沌',
  Void = '虚空',
}

export enum AttributeType {
  Attack = '攻击力',
  Defense = '防御力',
  MagicResist = '魔防',
  LifeRegen = '体力恢复',
  Divinity = '神性',
}

export enum MonsterRank {
    Minion = '喽啰',
    Elite = '精英',
    Lord = '领主',
    Monarch1 = '君王一阶',
    Monarch2 = '君王二阶',
    Monarch3 = '君王三阶',
    Ancient = '远古',
}

export interface Attribute {
  type: AttributeType;
  value: number;
  rollCount?: number;
}

export interface Equipment {
  id: string;
  name: string;
  slot: EquipmentSlot;
  quality: EquipmentQuality;
  attributes: Attribute[];
  realmIndex: number;
  equipmentRealm: string;
  combatPower: number;
  qualityLevel?: number; // For Void+N
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  magicResist: number;
  lifeRegen: number;
  divinity: number;
  combatPower: number;
}

export interface Player {
  realmIndex: number;
  xp: number;
  xpToNextLevel: number;
  stats: PlayerStats;
  equipped: Partial<Record<EquipmentSlot, Equipment>>;
  inventory: Equipment[];
  gold: number;
  permanentBonuses: {
    attack: number;
    defense: number;
    health: number;
    magicResist: number;
  };
  temperingStones: number;
  currentFloor: number;
  highestFloor: number;
}

export interface Monster {
  id: string; // Add id for grid key
  name: string;
  gender: '男' | '女';
  rank: MonsterRank;
  realmIndex: number;
  stats: {
    health: number;
    maxHealth: number;
    attack: number;
    defense: number;
    lifeRegen: number;
    divinity: number;
    combatPower: number;
  };
  xpReward: number;
  originalStats?: {
    maxHealth: number;
    attack: number;
    defense: number;
  };
  isFriendly?: boolean;
  stickiness?: number;
  floorBonusDivinity?: number;
  equipped: Partial<Record<EquipmentSlot, Equipment>>;
  inventory: Equipment[];
  sect?: string;
  identity?: string;
  gold?: number;
}

export interface CombatLog {
  id: string;
  message: string;
  color: string;
  isHtml?: boolean;
  item?: Equipment;
}

export interface CombatOutcome {
    healthChange: number;
    playerWon: boolean;
    rounds: number;
    winnableStats?: {
        roundsToWin: number;
        healthCost: number;
    } | null;
}

export interface TooltipData {
  item: Equipment;
  x: number;
  y: number;
}

export type SearchMode = 'random' | 'similarStrength' | 'constrained';

export interface SearchSettings {
  mode: SearchMode;
  rankConstraint: MonsterRank | null;
  isRealmConstrained: boolean;
}

export interface ChallengeState {
  isActive: boolean;
  rankToUnlock: MonsterRank | null;
}

// --- New Floor System Types ---
export interface FloorChallengeState {
  isActive: boolean;
  targetFloor: number;
  isCompleted?: boolean;
}


// --- New Grid-based Combat Types ---

export enum ChestType {
    Wood = '木箱',
    Iron = '铁箱',
    Copper = '铜箱',
    Silver = '银箱',
    Gold = '金箱',
    Ancient = '远古箱',
}

export interface Chest {
    id: string;
    type: ChestType;
    equipmentRealm: string;
    realmIndex: number;
}

export type ItemBlockDataType = 'equipment' | 'potion';
export interface ItemBlockData {
    type: ItemBlockDataType;
    item?: Equipment; // Only if type is 'equipment'
}

export type GridBlockType = 'player' | 'monster' | 'chest' | 'item' | 'empty' | 'guarded_treasure' | 'friendly';

export type GridBlock = {
    id: string;
    type: GridBlockType;
    data: Monster | Chest | ItemBlockData | null;
    combatOutcome?: CombatOutcome | null;
    animation?: 'combat' | 'loot' | 'hit' | 'fatal-hit' | 'stat-down' | null;
    stickiness?: number; // 0 for initial, 1 for 10% pen, 2 for 20% pen, etc.
    isLocked?: boolean; // For revenge chest
};

// --- Animation ---
export interface ProjectileAnimation {
    fromId: string;
    toId: string;
    id: string;
}
export interface FeedbackAnimation {
    id: string;
    onId: string;
    text: string;
    className: string;
    isHtml?: boolean;
    style?: React.CSSProperties;
}


// --- Automation ---
export interface AutomationSettings {
    autoFight: boolean;
    autoLoot: boolean;
    autoRefine: boolean;
    autoEquip: boolean;
    autoTemper: boolean;
}

// --- Top Stats ---
export interface RestoringEnemyRecord {
    monster: Monster;
    healthRestored: number;
}

// --- Revenge System ---
export interface DeathRecord {
  id: string;
  timestamp: number;
  monster: Monster;
  damageDealt: number;
  finalHealth: number;
}

export interface RevengeState {
  isActive: boolean;
  recordId: string | null;
  chestBlockId: string | null;
}


export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

export interface GameState {
  player: Player;
  gridBlocks: GridBlock[];
  searchSettings: SearchSettings;
  unlockedRanks: MonsterRank[];
  automationSettings: AutomationSettings;
  topCombatPowerEquipment: Equipment[];
  topQualityEquipment: Equipment[];
  strongestEnemies: Monster[];
  topRestoringEnemies: RestoringEnemyRecord[];
  deathLog: DeathRecord[];
  isOffensiveSystemActive?: boolean;
  hasSeenOffensiveSystemPopup?: boolean;
  challengeState: ChallengeState;
  floorChallengeState: FloorChallengeState;
  revengeState: RevengeState;
  gmMonsterRequest: {
    rank: MonsterRank;
    realmIndex: number;
    isFriendly: boolean;
  } | null;
  isMapHostile: boolean;
  killStats: {
    [sect: string]: {
      identities: { [identity: string]: number };
      totalPoints: number;
    };
  };
  strongestKill: {
    monsterName: string;
    sect: string;
    identity: string;
    realmIndex: number;
    rank: MonsterRank;
  } | null;
  chatHistories: Record<string, ChatMessage[]>;
  damageLog: {
    monsterId: string;
    monsterName: string;
    damageTaken: number;
    timestamp: number;
  }[];
  guardedTreasureState: {
    highestQualityOnGrid: EquipmentQuality | null;
    isUnlocked: boolean;
    treasureBlockId: string | null;
  } | null;
}