
import React from 'react';
import { GridBlock, Player, GameState, Monster, Chest, ItemBlockData, EquipmentQuality, ChestType, CombatOutcome } from '../types';
import { MONSTER_RANK_CONFIG, CHEST_CONFIG, ORDERED_QUALITIES, QUALITY_CONFIG } from '../constants';
import { REALMS } from '../realmConstants';
import { formatLargeNumber } from '../utils';

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

export const GridBlockComponent = React.forwardRef<HTMLDivElement, {
    block: GridBlock;
    player: Player;
    onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
    guardedTreasureState: GameState['guardedTreasureState'];
    isHostileMode: boolean;
}>(({ block, player, onClick, guardedTreasureState, isHostileMode }, ref) => {
    
    let animationClass = '';
    if (block.animation === 'combat') animationClass = 'animate-grid-combat';
    else if (block.animation === 'loot') animationClass = 'animate-grid-loot';
    else if (block.animation === 'hit') animationClass = 'animate-hit-feedback';

    const renderBlockContent = () => {
        switch (block.type) {
            case 'player': {
                const { stats } = player;
                const isFatalHit = block.animation === 'fatal-hit';
                return (
                    <div className="w-full h-full relative p-2 flex flex-col justify-center items-center bg-yellow-900/30 border-2 border-yellow-400/80 animate-player-glow shadow-[inset_0_0_15px_rgba(250,204,21,0.2)]">
                        <div className="absolute top-1 left-1 text-xs font-bold text-yellow-300" style={{ textShadow: '1px 1px 2px black' }}>
                           战: {formatLargeNumber(stats.combatPower)}
                        </div>
                         <div className="flex flex-col items-center justify-center space-y-1 mt-2">
                            <div className={`text-sm md:text-base font-bold ${isFatalHit ? 'animate-fatal-flash text-red-500' : 'text-green-400'}`} style={{ textShadow: '1px 1px 2px black' }}>
                                体: {formatLargeNumber(Math.round(stats.health))}
                            </div>
                        </div>
                    </div>
                );
            }
            case 'empty':
                return <div className="w-full h-full bg-black/20"></div>;
            case 'monster':
            case 'friendly': {
                const monster = block.data as Monster;
                const outcome = block.combatOutcome;
                const rankConfig = MONSTER_RANK_CONFIG[monster.rank];
                
                let healthCostText = '????';
                let healthCostColor = 'text-gray-500';

                if (outcome) {
                    if (outcome.playerWon) {
                        const cost = -outcome.healthChange;
                        healthCostText = cost > 0 ? `-${formatLargeNumber(cost)}` : `+${formatLargeNumber(-cost)}`;
                        healthCostColor = getHealthCostColor(outcome, player.stats.health);
                    } else if (outcome.winnableStats) {
                        const cost = outcome.winnableStats.healthCost;
                        healthCostText = `-${formatLargeNumber(cost)}`;
                        healthCostColor = 'text-red-500';
                    } else { // Stalemate
                        healthCostText = '无法战胜';
                        healthCostColor = 'text-red-500';
                    }
                }
                
                const getMonsterStyle = (rank: string) => {
                    switch (rank) {
                        case '喽啰': return 'bg-gray-800/40 border-gray-600';
                        case '精英': return 'bg-blue-900/40 border-blue-500 shadow-[inset_0_0_10px_rgba(59,130,246,0.3),0_0_10px_rgba(59,130,246,0.3)]';
                        case '领主': return 'bg-pink-900/40 border-pink-500 shadow-[inset_0_0_15px_rgba(236,72,153,0.4),0_0_15px_rgba(236,72,153,0.4)]';
                        case '君王一阶': return 'bg-yellow-900/40 border-yellow-500 shadow-[inset_0_0_20px_rgba(234,179,8,0.5),0_0_20px_rgba(234,179,8,0.5)]';
                        case '君王二阶': return 'bg-orange-900/50 border-orange-500 shadow-[inset_0_0_25px_rgba(249,115,22,0.6),0_0_25px_rgba(249,115,22,0.6)] animate-pulse';
                        case '君王三阶': return 'bg-red-900/60 border-red-600 shadow-[inset_0_0_30px_rgba(220,38,38,0.7),0_0_30px_rgba(220,38,38,0.7)] animate-pulse';
                        case '远古': return 'bg-rose-950/80 border-rose-500 shadow-[inset_0_0_40px_rgba(225,29,72,0.8),0_0_40px_rgba(225,29,72,0.8)] animate-pulse';
                        default: return 'bg-gray-800/40 border-gray-600';
                    }
                };
                
                const monsterStyle = getMonsterStyle(monster.rank);
                const isSticky = block.stickiness && block.stickiness > 0;

                return (
                    <div className={`w-full h-full relative p-2 flex flex-col justify-center items-center cursor-pointer border-2 ${monsterStyle} transition-all duration-300`}
                        onClick={onClick}>
                        
                        {(isHostileMode || isSticky) ? (
                             <div className="absolute top-1 right-1 text-base font-bold text-red-500" style={{ textShadow: '1px 1px 3px black' }}>
                                敌
                            </div>
                        ) : (
                             <div className="absolute top-1 right-1 text-base font-bold text-pink-400" style={{ textShadow: '1px 1px 3px black' }}>
                                中
                            </div>
                        )}

                        <div className="absolute top-1 left-1 text-xs font-bold text-yellow-300" style={{ textShadow: '1px 1px 2px black' }}>
                            战: {formatLargeNumber(monster.stats.combatPower)}
                        </div>
                        
                        <div className={`text-sm md:text-base font-bold text-center mt-2 ${rankConfig.cssClass}`} style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
                            {monster.name}
                        </div>
                        
                        {outcome && (
                            <div className={`absolute bottom-1 right-1 text-xs font-bold ${healthCostColor}`} style={{ textShadow: '1px 1px 2px black' }}>
                                {healthCostText}
                            </div>
                        )}
                    </div>
                );
            }
            case 'chest': {
                const chest = block.data as Chest;
                const chestConfig = CHEST_CONFIG[chest.type];
                const isAncient = chest.type === ChestType.Ancient;
                const isLocked = block.isLocked;
                const borderClass = isAncient ? 'border-ancient-chest' : `border-2 ${chestConfig.color.replace('bg-', 'border-')}/70`;
                const textClass = chestConfig.textColor || 'text-white';
                return (
                    <div className={`w-full h-full relative p-2 flex flex-col justify-center items-center cursor-pointer ${chestConfig.color} ${borderClass}`} onClick={onClick}>
                        {isLocked && <span className="absolute top-1 right-1 text-2xl" title="击败复仇目标后解锁">🔒</span>}
                        <span className="text-4xl">🎁</span>
                        <div className={`text-xs font-bold text-center ${textClass}`}>{chest.type}</div>
                    </div>
                );
            }
            case 'item': {
                const itemData = block.data as ItemBlockData;

                if (itemData.type === 'potion') {
                    return (
                        <div className="w-full h-full p-2 flex flex-col justify-center items-center cursor-pointer bg-teal-900/40 border-2 border-teal-500/70" onClick={onClick}>
                            <span className="text-4xl">{'🧪'}</span>
                            <div className="text-xs font-bold text-center text-teal-300">{'体力药水'}</div>
                        </div>
                    );
                }
                
                // Fallback for old saves or unknown item types
                return (
                    <div className="w-full h-full bg-black/20"></div>
                );
            }
            case 'guarded_treasure': {
                const getNextQuality = (quality: EquipmentQuality | null): EquipmentQuality => {
                    if (!quality) return EquipmentQuality.Uncommon;
                    const currentIndex = ORDERED_QUALITIES.indexOf(quality);
                    const nextIndex = Math.min(currentIndex + 1, ORDERED_QUALITIES.length - 1);
                    return ORDERED_QUALITIES[nextIndex];
                };

                const displayQuality = getNextQuality(guardedTreasureState?.highestQualityOnGrid ?? null);
                const qualityConfig = QUALITY_CONFIG[displayQuality];
                const qualityClass = qualityConfig.cssClass;
                
                const isUnlocked = guardedTreasureState?.isUnlocked;
                const baseBgColor = isUnlocked ? 'bg-green-900/40' : 'bg-gray-900/70';
                const glowClass = isUnlocked ? 'animate-pulse border-green-400 shadow-lg shadow-green-500/50' : 'border-gray-600';

                return (
                    <div 
                        className={`w-full h-full p-2 flex justify-center items-center cursor-pointer ${baseBgColor} border-2 ${glowClass} transition-all duration-500`} 
                        onClick={onClick}
                        title="怪物镇守的宝藏"
                    >
                        <span 
                            className={`text-6xl font-black ${qualityClass} transition-all duration-500`} 
                            style={{textShadow: '0 0 10px rgba(0,0,0,0.7)'}}
                        >
                            ?
                        </span>
                    </div>
                );
            }
            default:
                return null;
        }
    };

    return (
        <div ref={ref} className={`relative w-full h-full bg-gray-900/50 rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg ${animationClass}`}>
            {renderBlockContent()}
            {block.animation === 'stat-down' && (
                <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-10">
                    <div className="stat-down-arrow">↓</div>
                </div>
            )}
        </div>
    );
});
