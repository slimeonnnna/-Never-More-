

import React from 'react';
import { Monster, Player, GridBlock, CombatOutcome } from '../types';
import { MONSTER_RANK_CONFIG } from '../constants';
import { REALMS } from '../realmConstants';
import { formatLargeNumber } from '../utils';

interface MonsterCompendiumProps {
    isOpen: boolean;
    onClose: () => void;
    monsterBlocks: GridBlock[];
    player: Player;
}

const getHealthCostColor = (outcome: CombatOutcome | null | undefined, currentHealth: number): string => {
    if (!outcome) return 'text-gray-500';
    if (!outcome.playerWon) return 'text-red-500';
    const cost = -outcome.healthChange;
    if (cost <= 0) return 'text-green-400';
    if (cost >= currentHealth) return 'text-red-500';
    const costPercentage = cost / currentHealth;
    if (costPercentage > 0.9) return 'text-red-500';
    if (costPercentage > 0.5) return 'text-orange-500';
    if (costPercentage > 0.2) return 'text-yellow-400';
    return 'text-white';
};

export const MonsterCompendium: React.FC<MonsterCompendiumProps> = ({ isOpen, onClose, monsterBlocks, player }) => {
    return (
        <div className={`absolute top-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm rounded-b-lg shadow-xl z-20 transition-all duration-300 ease-in-out transform overflow-hidden ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
            <div className="p-3">
                <div className="relative mb-3">
                    <h3 className="text-lg font-bold text-yellow-300 text-center">怪物图鉴</h3>
                    <button
                        onClick={onClose}
                        className="absolute top-0 right-0 text-gray-400 hover:text-white text-2xl leading-none"
                        aria-label="关闭图鉴"
                    >
                        &times;
                    </button>
                </div>
                <div className="overflow-y-auto max-h-[calc(100vh-25rem)]">
                    {monsterBlocks.length > 0 ? (
                        <div className="space-y-4">
                            {monsterBlocks.map((block) => {
                                const monster = block.data as Monster;
                                const outcome = block.combatOutcome;
                                const originalStats = monster.originalStats;
                                
                                let displayRounds: string = 'N/A';
                                let displayHealthCostText: string = 'N/A';
                                let displayHealthCostColor: string = 'text-gray-300';
                                
                                if (outcome) {
                                    if (outcome.playerWon) {
                                        displayRounds = formatLargeNumber(outcome.rounds);
                                        const cost = -outcome.healthChange;
                                        displayHealthCostText = cost > 0 ? `-${formatLargeNumber(cost)}` : `+${formatLargeNumber(-cost)}`;
                                        displayHealthCostColor = getHealthCostColor(outcome, player.stats.health);
                                    } else {
                                        if (outcome.winnableStats) {
                                            displayRounds = formatLargeNumber(outcome.winnableStats.roundsToWin);
                                            const cost = outcome.winnableStats.healthCost;
                                            displayHealthCostText = `-${formatLargeNumber(cost)}`;
                                            displayHealthCostColor = 'text-red-500 font-semibold';
                                        } else { // Stalemate
                                            displayRounds = '∞';
                                            displayHealthCostText = '无法战胜';
                                            displayHealthCostColor = 'text-red-500 font-bold';
                                        }
                                    }
                                }
                                
                                const baseDivinity = monster.floorBonusDivinity ? monster.stats.divinity - monster.floorBonusDivinity : monster.stats.divinity;
                                const divinityText = monster.floorBonusDivinity 
                                  ? `${formatLargeNumber(baseDivinity)} + ${monster.floorBonusDivinity}`
                                  : formatLargeNumber(monster.stats.divinity);

                                return (
                                    <div key={monster.id} className={`p-3 rounded-lg border ${MONSTER_RANK_CONFIG[monster.rank].cssClass.split(' ').find(c => c.startsWith('text-'))?.replace('text-', 'border-')}/50 bg-black/20`}>
                                        <div className="flex justify-between items-center">
                                            <div className={`font-bold text-base mb-1 ${MONSTER_RANK_CONFIG[monster.rank].cssClass}`}>{monster.rank} {monster.name}</div>
                                            {monster.isFriendly && <span className="text-sm font-bold text-pink-400">[中立]</span>}
                                        </div>

                                        <div className="text-xs text-gray-400 mb-2">性别: {monster.gender} | 境界: {REALMS[monster.realmIndex].name}</div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                            <div className="text-gray-300">战力: <span className="text-yellow-300 font-semibold">{formatLargeNumber(monster.stats.combatPower)}</span></div>
                                            <div className="text-gray-300">
                                                体力: <span className="text-green-400">{formatLargeNumber(monster.stats.maxHealth)}</span>
                                                {originalStats && <span className="text-xs text-red-400 ml-1">({Math.round(monster.stats.maxHealth / originalStats.maxHealth * 100)}%)</span>}
                                            </div>
                                            <div className="text-gray-300">
                                                攻击: <span className="text-white">{formatLargeNumber(monster.stats.attack)}</span>
                                                {originalStats && <span className="text-xs text-red-400 ml-1">({Math.round(monster.stats.attack / originalStats.attack * 100)}%)</span>}
                                            </div>
                                            <div className="text-gray-300">
                                                防御: <span className="text-white">{formatLargeNumber(monster.stats.defense)}</span>
                                                {originalStats && <span className="text-xs text-red-400 ml-1">({Math.round(monster.stats.defense / originalStats.defense * 100)}%)</span>}
                                            </div>
                                            <div className="col-span-2 text-gray-300">神性: <span className="text-white">{divinityText}</span></div>
                                            <div className="border-t border-gray-700 my-1 col-span-2"></div>
                                            <div className="col-span-2 text-gray-300">战斗回合: <span className="text-white">{displayRounds}</span></div>
                                            <div className="col-span-2 text-gray-300">损耗: 
                                                <span className={displayHealthCostColor}>
                                                     {displayHealthCostText}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center h-24">
                            <p className="text-center text-gray-500">当前区域没有发现敌人。</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}