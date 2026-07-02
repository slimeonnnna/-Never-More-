
import React, { useState } from 'react';
import { Equipment, Monster, RestoringEnemyRecord, DeathRecord } from '../types';
import { QUALITY_CONFIG, MONSTER_RANK_CONFIG } from '../constants';
import { REALMS } from '../realmConstants';
import { formatLargeNumber } from '../utils';

interface TopStatsPanelProps {
    isOpen: boolean;
    onClose: () => void;
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
    onEquipmentClick: (item: Equipment) => void;
    onMonsterClick: (monster: Monster) => void;
    onRevenge: (record: DeathRecord) => void;
    onDeleteRecord: (recordId: string) => void;
}

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="border-b border-gray-700">
            <button
                onClick={() => setIsExpanded(p => !p)}
                className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-700/50 transition-colors"
                aria-expanded={isExpanded}
            >
                <span className="font-semibold text-yellow-300">{title}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isExpanded && <div className="p-3 bg-black/20 animate-fade-in">{children}</div>}
        </div>
    );
};

const EquipmentListItem: React.FC<{ item: Equipment, rank: number, onClick: () => void }> = ({ item, rank, onClick }) => {
    const qualityClass = QUALITY_CONFIG[item.quality].cssClass;
    const qualityName = item.qualityLevel ? `${item.quality}${formatLargeNumber(item.qualityLevel)}重` : item.quality;
    const displayName = item.name.replace(`[${item.quality}]`, `[${qualityName}]`);
    
    return (
        <button onClick={onClick} className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-gray-600/50 transition-colors">
            <span className="font-bold text-gray-400 w-6 text-center">{rank}.</span>
            <div className="flex-1 min-w-0">
                <p className={`${qualityClass} font-semibold truncate`}>{displayName}</p>
                <div className="flex flex-wrap text-xs text-gray-400 gap-x-3">
                    <span>境界: {item.equipmentRealm}</span>
                    <span>战力: <span className="text-yellow-400">{formatLargeNumber(item.combatPower)}</span></span>
                </div>
            </div>
        </button>
    );
};

const MonsterListItem: React.FC<{ monster: Monster, rank: number, onClick: () => void }> = ({ monster, rank, onClick }) => {
    const rankClass = MONSTER_RANK_CONFIG[monster.rank].cssClass;
    return (
        <button onClick={onClick} className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-gray-600/50 transition-colors">
            <span className="font-bold text-gray-400 w-6 text-center">{rank}.</span>
            <div className="flex-1 min-w-0">
                <p className={`${rankClass} font-semibold truncate`}>{monster.rank} {monster.name}</p>
                <div className="flex flex-wrap text-xs text-gray-400 gap-x-3">
                    <span>境界: {REALMS[monster.realmIndex].name}</span>
                    <span>战力: <span className="text-yellow-400">{formatLargeNumber(monster.stats.combatPower)}</span></span>
                </div>
            </div>
        </button>
    );
}

const RestoringEnemyListItem: React.FC<{ record: RestoringEnemyRecord, rank: number }> = ({ record, rank }) => {
    const { monster, healthRestored } = record;
    const rankClass = MONSTER_RANK_CONFIG[monster.rank].cssClass;
    return (
        <div className="flex items-center gap-2 p-2 rounded-md">
             <span className="font-bold text-gray-400 w-6 text-center">{rank}.</span>
             <div className="flex-1 min-w-0">
                <p className={`${rankClass} font-semibold truncate`}>{monster.rank} {monster.name}</p>
                <div className="flex flex-wrap text-xs text-gray-400 gap-x-3">
                    <span>恢复体力: <span className="text-green-400 font-semibold">+{formatLargeNumber(healthRestored)}</span></span>
                </div>
            </div>
        </div>
    );
};

const MonsterDetailsForRevenge: React.FC<{ monster: Monster }> = ({ monster }) => {
    const rankConfig = MONSTER_RANK_CONFIG[monster.rank];
    const stats = monster.originalStats ? { ...monster.stats, ...monster.originalStats, health: monster.originalStats.maxHealth } : monster.stats;
    
    const baseDivinity = monster.floorBonusDivinity ? stats.divinity - monster.floorBonusDivinity : stats.divinity;
    const divinityText = monster.floorBonusDivinity
      ? `${formatLargeNumber(baseDivinity)} + ${monster.floorBonusDivinity}`
      : formatLargeNumber(stats.divinity);

    return (
        <div>
            <div className={`font-bold text-base mb-1 ${rankConfig.cssClass}`}>{monster.rank} {monster.name}</div>
            <div className="text-xs text-gray-400 mb-2">性别: {monster.gender} | 境界: {REALMS[monster.realmIndex].name}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div className="text-gray-300">战力: <span className="text-yellow-300 font-semibold">{formatLargeNumber(stats.combatPower)}</span></div>
                <div className="text-gray-300">体力: <span className="text-green-400">{formatLargeNumber(stats.maxHealth)}</span></div>
                <div className="text-gray-300">攻击: <span className="text-white">{formatLargeNumber(stats.attack)}</span></div>
                <div className="text-gray-300">防御: <span className="text-white">{formatLargeNumber(stats.defense)}</span></div>
                <div className="col-span-2 text-gray-300">神性: <span className="text-white">{divinityText}</span></div>
            </div>
        </div>
    );
}

export const TopStatsPanel: React.FC<TopStatsPanelProps> = ({ isOpen, onClose, topCombatPowerEquipment, topQualityEquipment, strongestEnemies, topRestoringEnemies, deathLog, killStats, onEquipmentClick, onMonsterClick, onRevenge, onDeleteRecord }) => {
    const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
    if (!isOpen) return null;

    const sortedDeathLog = [...deathLog].sort((a, b) => b.damageDealt - a.damageDealt);

    return (
        <div 
            className="absolute top-0 right-0 left-0 lg:left-auto lg:w-96 h-full bg-gray-800/95 backdrop-blur-md z-20 border border-gray-700 rounded-lg shadow-2xl flex flex-col animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="top-stats-title"
        >
            <div className="flex justify-between items-center p-3 border-b border-gray-600 flex-shrink-0">
                <h2 id="top-stats-title" className="text-xl font-bold text-yellow-400">信息记录</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl" aria-label="关闭">&times;</button>
            </div>
            <div className="overflow-y-auto">
                <CollapsibleSection title="宗门通缉与击杀记录">
                    {killStats && Object.keys(killStats).length > 0 ? (
                        <div className="space-y-4">
                            {(Object.entries(killStats) as [string, { identities: { [identity: string]: number }; totalPoints: number }][])
                                .sort((a, b) => (b[1]?.totalPoints || 0) - (a[1]?.totalPoints || 0))
                                .map(([sect, data], i) => (
                                    <div key={sect} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-yellow-400">{i + 1}. {sect}</span>
                                            <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full border border-red-800">
                                                通缉分: {formatLargeNumber(data.totalPoints || 0)}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-300 space-y-1">
                                            {data.identities && Object.entries(data.identities).map(([identity, count]) => (
                                                <div key={identity} className="flex justify-between">
                                                    <span>{identity}</span>
                                                    <span className="text-gray-500">x{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">暂无击杀记录。</p>
                    )}
                </CollapsibleSection>
                <CollapsibleSection title="死亡记录">
                    {sortedDeathLog.length > 0 ? (
                        <div className="space-y-1">
                            {sortedDeathLog.map((record, i) => (
                                <div key={record.id} className="p-2 rounded-md hover:bg-gray-700/30 transition-colors">
                                    <button onClick={() => setExpandedRecordId(expandedRecordId === record.id ? null : record.id)} className="w-full text-left">
                                        <div className="flex items-start gap-2">
                                            <span className="font-bold text-gray-400 w-6 text-center pt-0.5">{i + 1}.</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-red-400 font-semibold truncate">
                                                    被【{record.monster.rank}】{record.monster.name} 击败
                                                </p>
                                                <div className="text-xs text-gray-400">
                                                    {new Date(record.timestamp).toLocaleString('zh-CN')}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    伤害: <span className="text-red-300 font-bold">{formatLargeNumber(record.damageDealt)}</span>,
                                                    最终体力: <span className="text-red-300 font-bold">{formatLargeNumber(record.finalHealth)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                    {expandedRecordId === record.id && (
                                        <div className="mt-2 ml-8 p-3 bg-black/30 rounded-lg border border-gray-600 animate-fade-in">
                                            <MonsterDetailsForRevenge monster={record.monster} />
                                            <div className="flex justify-end gap-2 mt-3">
                                                <button onClick={() => { onDeleteRecord(record.id); setExpandedRecordId(null); }} className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 transition-colors">删除</button>
                                                <button onClick={() => { onRevenge(record); onClose(); }} className="px-3 py-1 bg-red-700 text-white text-sm rounded hover:bg-red-600 transition-colors">复仇</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">暂无记录。</p>
                    )}
                </CollapsibleSection>
                <CollapsibleSection title="战力最高装备">
                    {topCombatPowerEquipment.length > 0 ? (
                        <div className="space-y-1">
                            {topCombatPowerEquipment.map((item, i) => <EquipmentListItem key={item.id} item={item} rank={i + 1} onClick={() => onEquipmentClick(item)} />)}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">暂无记录。</p>
                    )}
                </CollapsibleSection>
                <CollapsibleSection title="品质最高装备">
                     {topQualityEquipment.length > 0 ? (
                        <div className="space-y-1">
                            {topQualityEquipment.map((item, i) => <EquipmentListItem key={item.id} item={item} rank={i + 1} onClick={() => onEquipmentClick(item)} />)}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">暂无记录。</p>
                    )}
                </CollapsibleSection>
                <CollapsibleSection title="最强敌人">
                     {strongestEnemies.length > 0 ? (
                        <div className="space-y-1">
                            {strongestEnemies.map((monster, i) => <MonsterListItem key={monster.id} monster={monster} rank={i+1} onClick={() => onMonsterClick(monster)} />)}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">暂无记录。</p>
                    )}
                </CollapsibleSection>
                <CollapsibleSection title="体力恢复最多敌人">
                     {topRestoringEnemies.length > 0 ? (
                        <div className="space-y-1">
                            {topRestoringEnemies.map((record, i) => <RestoringEnemyListItem key={record.monster.id} record={record} rank={i+1} />)}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">暂无记录。</p>
                    )}
                </CollapsibleSection>
            </div>
        </div>
    );
};
