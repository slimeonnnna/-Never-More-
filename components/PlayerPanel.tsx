


import React, { useState, useRef, useEffect } from 'react';
import { Player, Equipment, EquipmentSlot, SearchSettings, MonsterRank, ChallengeState, Monster, RestoringEnemyRecord, DeathRecord } from '../types';
import { ItemSlot } from './ItemSlot';
import { SearchSettingsPanel } from './SearchSettingsPanel';
import { EQUIPMENT_SLOTS_ORDER, BREAKTHROUGH_REALM_INDICES } from '../constants';
import { REALMS } from '../realmConstants';
import { formatLargeNumber } from '../utils';
import { TopStatsPanel } from './TopStatsPanel';
import { CollapsiblePanel } from './CollapsiblePanel';

interface PlayerPanelProps {
  player: Player;
  onItemClick: (item: Equipment, source: 'inventory' | 'equipped') => void;
  onAutoEquip: () => void;
  onBulkRefine: () => void;
  onResetGame: () => void;
  onBreakthrough: () => void;
  searchSettings: SearchSettings;
  unlockedRanks: MonsterRank[];
  onSettingsChange: (newSettings: Partial<SearchSettings>) => void;
  onInitiateChallenge: (rank: MonsterRank) => void;
  challengeState: ChallengeState;
  topCombatPowerEquipment: Equipment[];
  topQualityEquipment: Equipment[];
  strongestEnemies: Monster[];
  topRestoringEnemies: RestoringEnemyRecord[];
  deathLog: DeathRecord[];
  killStats: {
    [sect: string]: {
      identities: { [identity: string]: number };
      totalPoints: number;
    };
  };
  onTopStatsEquipmentClick: (item: Equipment) => void;
  onTopStatsMonsterClick: (monster: Monster) => void;
  onRevenge: (record: DeathRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  hasStickyEnemies: boolean;
  onShowGMPanel: () => void;
  onShowApiSettings: () => void;
}

const StatDisplay: React.FC<{ label: string; value: string; valueClass?: string }> = ({label, value, valueClass}) => (
    <div className="bg-gray-900/70 p-2 rounded-md text-center">
        <div className="text-gray-400 text-xs">{label}</div>
        <div className={`text-md font-semibold ${valueClass || ''}`}>{value}</div>
    </div>
);

export const PlayerPanel: React.FC<PlayerPanelProps> = ({ 
    player, onItemClick, onAutoEquip, onBulkRefine, onResetGame, onBreakthrough,
    searchSettings, unlockedRanks, onSettingsChange, onInitiateChallenge, challengeState,
    topCombatPowerEquipment, topQualityEquipment, strongestEnemies, topRestoringEnemies,
    deathLog, killStats, onTopStatsEquipmentClick, onTopStatsMonsterClick, onRevenge, onDeleteRecord,
    hasStickyEnemies, onShowGMPanel, onShowApiSettings
}) => {
  const { stats, realmIndex, xp, xpToNextLevel } = player;
  const [isTopStatsPanelOpen, setIsTopStatsPanelOpen] = useState(false);

  const canBulkRefine = player.inventory.length > 0;
  const currentRealmName = REALMS[realmIndex]?.name || '未知境界';
  
  const isAtBreakthroughRealm = BREAKTHROUGH_REALM_INDICES.includes(realmIndex);
  const canBreakthrough = isAtBreakthroughRealm && xp >= xpToNextLevel && xpToNextLevel !== Infinity;
  const displayXp = isAtBreakthroughRealm ? Math.min(xp, xpToNextLevel) : xp;
  const xpProgress = xpToNextLevel > 0 && xpToNextLevel !== Infinity ? (displayXp / xpToNextLevel) * 100 : 100;

  const inventoryTitle = (
    <div className="flex items-center gap-3">
      <span>背包</span>
      <span className="text-sm font-normal text-gray-400 flex items-center gap-3">
        <span className="text-legendary">💎{formatLargeNumber(player.temperingStones || 0)}</span>
        <span className="text-yellow-400">💰{formatLargeNumber(player.gold || 0)}</span>
      </span>
    </div>
  );

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg flex flex-col gap-4 h-full border border-gray-700 overflow-y-auto">
      {/* --- Character Info (Static) --- */}
      <div className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 onClick={onShowGMPanel} className="text-2xl font-bold text-yellow-400 cursor-pointer hover:text-yellow-300 transition-colors">角色信息</h2>
            <div className="flex gap-1">
                <button onClick={onShowApiSettings} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="AI 设置">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                </button>
                <button onClick={() => setIsTopStatsPanelOpen(true)} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="查看信息记录">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            </div>
          </div>
          
          <TopStatsPanel
            isOpen={isTopStatsPanelOpen}
            onClose={() => setIsTopStatsPanelOpen(false)}
            topCombatPowerEquipment={topCombatPowerEquipment}
            topQualityEquipment={topQualityEquipment}
            strongestEnemies={strongestEnemies}
            topRestoringEnemies={topRestoringEnemies}
            deathLog={deathLog}
            killStats={killStats || {}}
            onEquipmentClick={onTopStatsEquipmentClick}
            onMonsterClick={onTopStatsMonsterClick}
            onRevenge={onRevenge}
            onDeleteRecord={onDeleteRecord}
          />

          {/* Realm & XP */}
          <div className="mt-4">
            <div className="flex justify-between font-bold mb-1 items-center">
                <div className="flex items-center gap-2">
                    <span>境界: {currentRealmName}</span>
                    {canBreakthrough && (
                        <button
                            onClick={onBreakthrough}
                            className="px-3 py-1 bg-yellow-500 text-black text-sm font-bold rounded-md hover:bg-yellow-400 transition-colors shadow-lg animate-pulse"
                        >
                            突破
                        </button>
                    )}
                </div>
                <span>修为: {formatLargeNumber(displayXp)} / {xpToNextLevel === Infinity ? 'MAX' : formatLargeNumber(xpToNextLevel)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${xpProgress}%` }}></div>
            </div>
          </div>
          
          {/* Combat Power */}
          <div className="text-center my-4">
            <div className="text-gray-400 text-sm">综合战力</div>
            <div className="text-2xl font-bold text-yellow-300">{formatLargeNumber(stats.combatPower)}</div>
          </div>

          {/* Core Stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatDisplay label="体力" value={`${formatLargeNumber(Math.round(stats.health))}`} valueClass="text-green-400" />
            <StatDisplay label="攻击力" value={formatLargeNumber(stats.attack)} />
            <StatDisplay label="防御力" value={formatLargeNumber(stats.defense)} />
            <StatDisplay label="魔防" value={formatLargeNumber(stats.magicResist)} />
            <StatDisplay label="体力恢复" value={formatLargeNumber(stats.lifeRegen || 0)} />
            <StatDisplay label="神性" value={formatLargeNumber(stats.divinity)} />
          </div>
      </div>
      
      {/* --- Collapsible Panels --- */}
      <CollapsiblePanel title="装备栏" defaultExpanded={false}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 justify-items-center max-h-64 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-700">
              {EQUIPMENT_SLOTS_ORDER.map(slot => {
                const item = player.equipped[slot] || null;
                return (
                  <div key={slot} className="flex flex-col items-center w-full">
                    <div className="w-full bg-gray-900/50 p-1 rounded-md">
                        <ItemSlot
                          item={item}
                          onClick={() => item && onItemClick(item, 'equipped')}
                          isEquipped={true}
                        />
                    </div>
                    <span className="text-xs text-gray-400 mt-1 whitespace-nowrap">{slot}</span>
                  </div>
                )
              })}
          </div>
      </CollapsiblePanel>

      <CollapsiblePanel title={inventoryTitle} defaultExpanded={false}>
            <div className="flex flex-wrap justify-end p-2 gap-2">
                <button 
                    onClick={onBulkRefine}
                    disabled={!canBulkRefine}
                    className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors shadow-md disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                   一键处理
                </button>
                <button 
                    onClick={onAutoEquip}
                    className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 transition-colors shadow-md"
                >
                    一键换装
                </button>
                 <button
                    onClick={onResetGame}
                    className="px-4 py-2 bg-red-700 text-white font-semibold rounded-md hover:bg-red-800 transition-colors shadow-md"
                  >
                    重新开始
                  </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-gray-900/50 p-2 rounded-md max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
               {(() => {
                  const inventorySize = 30;
                  const items = [...player.inventory];
                  while (items.length < inventorySize) {
                    items.push(null as any); // Pad with nulls
                  }
                  return items.map((item, index) => (
                      <ItemSlot
                        key={item ? item.id : `empty-${index}`}
                        item={item}
                        onClick={() => item && onItemClick(item, 'inventory')}
                      />
                  ));
                })()}
            </div>
      </CollapsiblePanel>

      <CollapsiblePanel title="搜寻设置" isDisabled={hasStickyEnemies}>
             <SearchSettingsPanel 
                settings={searchSettings}
                unlockedRanks={unlockedRanks}
                onSettingsChange={onSettingsChange}
                onInitiateChallenge={onInitiateChallenge}
                challengeState={challengeState}
                isDisabled={hasStickyEnemies}
            />
      </CollapsiblePanel>
    </div>
  );
};