


import {
  Player, PlayerStats, Monster, SearchSettings, MonsterRank, AttributeType, Equipment
} from '../types';
import {
  PLAYER_BASE_STATS, MONSTER_RANK_CONFIG, MONSTER_BASE_STATS, SURNAMES, MALE_GIVEN_NAMES, FEMALE_GIVEN_NAMES, COMPOUND_SURNAMES
} from '../constants';
import { REALMS } from '../realmConstants';
import { generateCharacterSheet } from './friendlyUnitGenerator';

/**
 * Calculates the combat power based on a set of stats for a Player or Monster.
 */
export const calculateCharacterCombatPower = (stats: Partial<PlayerStats & Monster['stats']>, isPlayer: boolean): number => {
    const attack = stats.attack ?? 0;
    const defense = stats.defense ?? 0;
    const maxHealth = stats.maxHealth ?? 0;

    if (isPlayer) {
        const magicResist = stats.magicResist ?? 0;
        const lifeRegen = stats.lifeRegen ?? 0;
        const power = (attack * 1) +
                      (defense * 1) +
                      magicResist * 0.33 +
                      (lifeRegen * 10);
        return Math.round(power);
    } else {
        // Monster combat power calculation
        const adPower = attack + defense;
        const healthPower = maxHealth * 0.01;
        const cappedHealthPower = Math.min(healthPower, adPower);
        const power = adPower + cappedHealthPower;
        return Math.round(power);
    }
};

// --- Stat Calculation ---

export const calculatePlayerStats = (player: Player): PlayerStats => {
  const baseStats: Omit<PlayerStats, 'combatPower' | 'health'> & { health: number } = { 
    ...PLAYER_BASE_STATS,
    health: player.stats.health, 
  };
  
  baseStats.attack += player.permanentBonuses.attack;
  baseStats.defense += player.permanentBonuses.defense;
  baseStats.maxHealth += player.permanentBonuses.health;
  baseStats.magicResist += player.permanentBonuses.magicResist;
  
  Object.values(player.equipped).forEach(item => {
    if (!item) return;
    item.attributes.forEach(attr => {
      switch (attr.type) {
        case AttributeType.Attack:
          baseStats.attack += attr.value;
          break;
        case AttributeType.Defense:
          baseStats.defense += attr.value;
          break;
        case AttributeType.MagicResist:
          baseStats.magicResist += attr.value;
          break;
        case AttributeType.LifeRegen:
          baseStats.lifeRegen += attr.value;
          break;
        case AttributeType.Divinity:
          baseStats.divinity += attr.value;
          break;
      }
    });
  });

  // Divinity bonus for Magic Resist
  const magicResistDivinityBonus = 1 + (baseStats.divinity * 0.03);
  baseStats.magicResist = Math.round(baseStats.magicResist * magicResistDivinityBonus);

  // Divinity bonus for Attack and Defense
  const divinityBonus = 1 + (baseStats.divinity * 0.01);
  baseStats.attack = Math.round(baseStats.attack * divinityBonus);
  baseStats.defense = Math.round(baseStats.defense * divinityBonus);

  const finalStats = { ...baseStats };

  if (finalStats.health <= 0 && player.stats.health > 0) {
      finalStats.health = 1;
  }
  
  const combatPower = calculateCharacterCombatPower(finalStats, true);

  return {
    ...finalStats,
    combatPower,
  };
};


// --- Monster Generation ---
const getRandomMonsterRank = (): MonsterRank => {
    const rand = Math.random();
    let cumulativeChance = 0;
    const rankOrder: MonsterRank[] = [MonsterRank.Minion, MonsterRank.Elite, MonsterRank.Lord, MonsterRank.Monarch1, MonsterRank.Monarch2, MonsterRank.Monarch3, MonsterRank.Ancient];

    for (const rank of rankOrder) {
        cumulativeChance += MONSTER_RANK_CONFIG[rank].chance;
        if (rand < cumulativeChance) {
            return rank;
        }
    }
    return MonsterRank.Ancient; // Fallback in case of rounding errors
};

const generateSectAndIdentity = (realmIndex: number): { sect: string, identity: string } => {
    // 5% 概率为散修
    if (Math.random() < 0.05) {
        return { sect: '无宗门', identity: '散修' };
    }

    const mortalPrefixes = ['青云', '铁血', '飞星', '灵月', '狂风', '烈火', '寒冰', '惊雷', '紫阳', '苍穹'];
    const mortalSuffixes = ['宗', '派', '门', '谷', '阁'];
    
    const planarPrefixes = ['虚空', '星辰', '混沌', '轮回', '幽冥', '光明', '黑暗', '时空', '湮灭', '创世'];
    const planarSuffixes = ['殿', '宫', '联盟', '帝国', '圣殿'];
    
    const holyPrefixes = ['永恒', '不朽', '起源', '终焉', '太初', '鸿蒙', '无极', '造化', '神圣', '禁忌'];
    const holySuffixes = ['圣地', '神国', '道统', '仙庭', '神殿'];

    let sect = '';
    let identity = '';

    if (realmIndex <= 23) { // 佣兵 to 英雄 (Mortal Realm)
        sect = mortalPrefixes[Math.floor(Math.random() * mortalPrefixes.length)] + mortalSuffixes[Math.floor(Math.random() * mortalSuffixes.length)];
        if (realmIndex >= 14) { // 英雄
            identity = '长老';
        } else if (realmIndex >= 7) { // 职业者
            identity = '核心弟子';
        } else { // 佣兵
            identity = Math.random() < 0.5 ? '内门弟子' : '外门弟子';
        }
    } else if (realmIndex >= 24 && realmIndex <= 33) { // 传奇 to 圣域超凡 (Planar Realm)
        if (realmIndex >= 24 && realmIndex <= 26 && Math.random() < 0.5) {
            // 50% chance for Legendary to be Mortal Sect Master
            sect = mortalPrefixes[Math.floor(Math.random() * mortalPrefixes.length)] + mortalSuffixes[Math.floor(Math.random() * mortalSuffixes.length)];
            identity = Math.random() < 0.5 ? '宗主' : '太上长老';
        } else {
            sect = planarPrefixes[Math.floor(Math.random() * planarPrefixes.length)] + planarSuffixes[Math.floor(Math.random() * planarSuffixes.length)];
            if (realmIndex === 33) { // 圣域超凡
                identity = Math.random() < 0.5 ? '宗主' : '太上长老';
            } else if (realmIndex >= 31) { // 初始/高等超凡
                identity = Math.random() < 0.5 ? '长老' : '管理者';
            } else { // 传奇史诗
                identity = '核心成员';
            }
        }
    } else { // 圣者 to 超脱及以上 (Holy Land)
        sect = holyPrefixes[Math.floor(Math.random() * holyPrefixes.length)] + holySuffixes[Math.floor(Math.random() * holySuffixes.length)];
        if (realmIndex >= 40) { // 主宰及以上
            identity = '幕后掌权者';
        } else if (realmIndex >= 37) { // 域主
            identity = Math.random() < 0.5 ? '长老级管事' : '核心成员';
        } else { // 圣者
            identity = '核心成员';
        }
    }

    return { sect, identity };
};

export const getLowestPossibleRealmIndex = (floor: number): number => {
    const baseFloor = Math.max(0, floor - 1);
    let minRealmIndex = 0;

    if (baseFloor >= 80) {
        minRealmIndex = 1 + Math.floor((baseFloor - 80) / 50);
    }

    return Math.min(minRealmIndex, REALMS.length - 1);
};

export const createMonsterInternal = (params: { forcedRank?: MonsterRank | null, forcedRealmIndex?: number, floor?: number }): Monster => {
  const gender: '男' | '女' = Math.random() < 0.5 ? '男' : '女';
  
  // 1. Determine surname (50% compound, 50% single)
  const useCompoundSurname = Math.random() < 0.5;
  const surname = useCompoundSurname
    ? COMPOUND_SURNAMES[Math.floor(Math.random() * COMPOUND_SURNAMES.length)]
    : SURNAMES[Math.floor(Math.random() * SURNAMES.length)];

  // 2. Determine given name (70% 2-char, 30% 1-char)
  const givenNameList = gender === '男' ? MALE_GIVEN_NAMES : FEMALE_GIVEN_NAMES;
  const useTwoCharGivenName = Math.random() < 0.7;
  let givenName = '';
  if (useTwoCharGivenName) {
    const name1 = givenNameList[Math.floor(Math.random() * givenNameList.length)];
    const name2 = givenNameList[Math.floor(Math.random() * givenNameList.length)];
    givenName = name1 + name2;
  } else {
    givenName = givenNameList[Math.floor(Math.random() * givenNameList.length)];
  }

  const monsterName = surname + givenName;

  const rank = params.forcedRank ?? getRandomMonsterRank();
  const rankConfig = MONSTER_RANK_CONFIG[rank];
  const floor = params.floor ?? 1;
  
  let monsterRealmIndex: number;
  if (params.forcedRealmIndex !== undefined) {
      monsterRealmIndex = params.forcedRealmIndex;
  } else {
    const minRealmIndex = getLowestPossibleRealmIndex(floor);
    const baseFloor = Math.max(0, floor - 1);
    let baseChance = 0.8;
    let floorsIntoCycle = baseFloor;

    if (baseFloor >= 80) {
        baseChance = 0.5;
        floorsIntoCycle = (baseFloor - 80) % 50;
    }

    const effectiveBaseChance = Math.max(0, baseChance - (floorsIntoCycle * 0.01));

    const rand = Math.random();
    let realmIndex: number;

    if (rand < effectiveBaseChance && minRealmIndex < REALMS.length) {
        realmIndex = minRealmIndex;
    } else {
        let cumulativeChance = effectiveBaseChance;
        let remainingProbability = 1.0 - effectiveBaseChance;
        let found = false;

        for (let i = minRealmIndex + 1; i < REALMS.length; i++) {
            const prob = remainingProbability * 0.5;
            if (rand < cumulativeChance + prob) {
                realmIndex = i;
                found = true;
                break;
            }
            cumulativeChance += prob;
            remainingProbability *= 0.5;
        }
        if (!found) {
            realmIndex = REALMS.length - 1;
        }
    }
    monsterRealmIndex = realmIndex;
  }
  
  const realmData = REALMS[monsterRealmIndex];
  
  const { sect, identity } = generateSectAndIdentity(monsterRealmIndex);

  const realmHp = realmData.totalHpBonus;
  const realmPoints = realmData.totalPointsBonus;

  const attackAllocationRatio = 0.5 + Math.random() * 0.5;
  const realmAtk = Math.floor(realmPoints * attackAllocationRatio);
  const realmDef = realmPoints - realmAtk;
  
  const baseMaxHealth = Math.round(realmHp * rankConfig.hpMultiplier);
  const baseAttack = Math.round(realmAtk * rankConfig.adMultiplier);
  const baseDefense = Math.round(realmDef * rankConfig.adMultiplier);
  
  const [minDiv, maxDiv] = rankConfig.divinityRange;
  let divinity = Math.floor(Math.random() * (maxDiv - minDiv + 1)) + minDiv;
  
  if (rank === MonsterRank.Ancient) {
      while(Math.random() < 0.95) {
          divinity++;
      }
  }

  const floorBonusDivinity = Math.max(0, floor - 1);
  const totalDivinity = divinity + floorBonusDivinity;

  // New compounding stat multiplier logic
  let finalMaxHealth = baseMaxHealth;
  let finalAttack = baseAttack;
  let finalDefense = baseDefense;

  for (let i = 0; i < totalDivinity; i++) {
    finalMaxHealth *= 1.05;
    finalAttack *= 1.01;
    finalDefense *= 1.01;
  }
  
  const monsterStats: Omit<Monster['stats'], 'combatPower'> = {
      ...MONSTER_BASE_STATS,
      maxHealth: Math.round(finalMaxHealth),
      health: Math.round(finalMaxHealth),
      attack: Math.round(finalAttack),
      defense: Math.round(finalDefense),
      divinity: totalDivinity,
      lifeRegen: 0, // Enemies no longer regenerate health
  };
  
  const combatPower = calculateCharacterCombatPower(monsterStats, false);
  
  const baseXp = Math.pow(2, monsterRealmIndex);
  const xpReward = Math.round(baseXp * rankConfig.xpMultiplier);

  const gold = Math.floor(Math.random() * combatPower * 2);

  const monsterCore = {
    id: `monster-${crypto.randomUUID()}-${Math.random()}`,
    name: monsterName,
    gender: gender,
    rank: rank,
    realmIndex: monsterRealmIndex,
    sect,
    identity,
    stats: {
        ...monsterStats,
        combatPower,
    },
    xpReward,
    floorBonusDivinity: floorBonusDivinity > 0 ? floorBonusDivinity : undefined,
    gold,
  };

  const { equipped, inventory } = generateCharacterSheet(monsterCore);

  return { ...monsterCore, equipped, inventory };
};

export const generateMonster = (player: Player, settings: SearchSettings): Monster => {
  const floor = player.currentFloor;
  if (settings.mode === 'similarStrength') {
    const targetPower = player.stats.combatPower;
    if (targetPower <= 0) return createMonsterInternal({ floor }); // Fallback for new players

    const lowerBound = targetPower * 0.95;
    const upperBound = targetPower * 1.05;
    const MAX_ATTEMPTS = 200;
    
    const ALL_RANKS = Object.values(MonsterRank);

    let bestFit: Monster | null = null;
    let bestFitDifference = Infinity;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const randomRank = ALL_RANKS[Math.floor(Math.random() * ALL_RANKS.length)];
        const candidate = createMonsterInternal({ forcedRank: randomRank, floor });
        
        const candidatePower = candidate.stats.combatPower;
        if (candidatePower >= lowerBound && candidatePower <= upperBound) {
            return candidate;
        }

        const difference = Math.abs(candidatePower - targetPower);
        if (difference < bestFitDifference) {
            bestFitDifference = difference;
            bestFit = candidate;
        }
    }
    
    return bestFit || createMonsterInternal({ floor });
  }

  if (settings.mode === 'constrained') {
      return createMonsterInternal({
          forcedRank: settings.rankConstraint,
          forcedRealmIndex: settings.isRealmConstrained ? player.realmIndex : undefined,
          floor: settings.isRealmConstrained ? undefined : floor, // use floor only if realm is not constrained
      });
  }
  
  return createMonsterInternal({ floor });
};