

import React, { useState, useRef, useEffect } from 'react';
import { Monster, CombatLog, GridBlock, Player, ChallengeState, AutomationSettings, ProjectileAnimation, FeedbackAnimation, GameState, FloorChallengeState, RevengeState, Equipment } from '../types';
import { AutomationPanel } from './AutomationPanel';
import { GridBlockComponent } from './GridBlock';
import { FeedbackItem, SingleProjectile } from './CombatAnimations';
import { MonsterCompendium } from './MonsterCompendium';
import { FloorControls } from './FloorControls';
import { LogPanel } from './LogPanel';

interface CombatPanelProps {
    gridBlocks: GridBlock[];
    logs: CombatLog[];
    player: Player;
    challengeState: ChallengeState;
    floorChallengeState: FloorChallengeState;
    revengeState: RevengeState;
    automationSettings: AutomationSettings;
    projectileAnims: ProjectileAnimation[];
    feedbackAnims: FeedbackAnimation[];
    guardedTreasureState: GameState['guardedTreasureState'];
    isSearchOnCooldown: boolean;
    onRefreshGrid: () => void;
    onBlockClick: (block: GridBlock, element: HTMLElement) => void;
    onForfeitChallenge: () => void;
    onAutomationSettingsChange: (settings: Partial<AutomationSettings>) => void;
    onToggleAllAutomations: () => void;
    onAnimationComplete: (type: 'projectile' | 'feedback', id: string) => void;
    onNextFloor: () => void;
    onPreviousFloor: () => void;
    onGoToFloor: () => void;
    onAscendFloor: () => void;
    onItemClick: (item: Equipment, source: 'inventory' | 'equipped') => void;
    hasStickyEnemies: boolean;
}

export const CombatPanel: React.FC<CombatPanelProps> = ({ 
    gridBlocks, logs, player, challengeState, floorChallengeState, revengeState, automationSettings,
    projectileAnims, feedbackAnims, guardedTreasureState, isSearchOnCooldown,
    onRefreshGrid, onBlockClick, onForfeitChallenge, onAutomationSettingsChange,
    onToggleAllAutomations, onAnimationComplete,
    onNextFloor, onPreviousFloor, onGoToFloor, onAscendFloor, onItemClick, hasStickyEnemies
}) => {
    const [isCompendiumOpen, setIsCompendiumOpen] = useState(false);
    const [isAutomationPanelOpen, setIsAutomationPanelOpen] = useState(false);
    const automationButtonRef = useRef<HTMLButtonElement>(null);
    const automationPanelRef = useRef<HTMLDivElement>(null);
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
    
    const allAutomationsEnabled = automationSettings.autoFight && automationSettings.autoLoot && automationSettings.autoRefine && automationSettings.autoEquip && automationSettings.autoTemper;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isAutomationPanelOpen &&
                automationPanelRef.current &&
                !automationPanelRef.current.contains(event.target as Node) &&
                automationButtonRef.current &&
                !automationButtonRef.current.contains(event.target as Node)
            ) {
                setIsAutomationPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isAutomationPanelOpen]);

    const monsterBlocks = gridBlocks
        .filter(block => (block.type === 'monster' || block.type === 'friendly') && block.data)
        .sort((a, b) => {
            const monsterA = a.data as Monster;
            const monsterB = b.data as Monster;
            return monsterB.stats.combatPower - monsterA.stats.combatPower;
        });

    const isChallengeActive = challengeState.isActive || floorChallengeState.isActive || revengeState.isActive;
    const isGridActionDisabled = isChallengeActive || floorChallengeState.isCompleted;
    const isChallengeControlsDisabled = isGridActionDisabled || hasStickyEnemies;
    const forfeitButtonText = revengeState.isActive ? '放弃复仇' : '放弃挑战';

    const hasChest = gridBlocks.some(b => b.type === 'chest');
    const hasGuardedTreasure = gridBlocks.some(b => b.type === 'guarded_treasure');
    const isHostileMode = hasChest || hasGuardedTreasure;

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg flex flex-col flex-1 border border-gray-700 gap-4 min-h-0">
            {/* --- Top Section: Grid and Controls --- */}
            <div className="relative flex flex-col flex-[2] min-h-0">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-yellow-400">战斗区域</h2>
                        <button
                            onClick={() => setIsCompendiumOpen(prev => !prev)}
                            className="px-4 py-1 bg-gray-600 text-white text-sm font-semibold rounded-md hover:bg-gray-500 transition-colors flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10.392C2.057 15.71 3.245 16 4.5 16h1.054c.252 0 .493-.057.701-.161L11 13.054V6.946L6.255 4.161A.5.5 0 005.5 4.5v.304zm1 0v10.392L15.745 15.84A.5.5 0 0016.5 15.5V4.5a.5.5 0 00-.755-.439L10 6.946V4.804z" />
                            </svg>
                            {isCompendiumOpen ? '收起图鉴' : '图鉴'}
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button
                                ref={automationButtonRef}
                                onClick={() => setIsAutomationPanelOpen(prev => !prev)}
                                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
                            >
                                自动
                            </button>
                            {isAutomationPanelOpen && (
                                <div ref={automationPanelRef} className="absolute top-full right-0 mt-2 z-30">
                                    <AutomationPanel 
                                        settings={automationSettings}
                                        onSettingsChange={onAutomationSettingsChange}
                                        allAutomationsEnabled={allAutomationsEnabled}
                                        onToggleAllAutomations={onToggleAllAutomations}
                                    />
                                </div>
                            )}
                        </div>
                        {isChallengeActive ? (
                            <button
                                onClick={onForfeitChallenge}
                                className="px-6 py-2 bg-red-700 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-red-800 transition-all transform hover:scale-105"
                            >
                                {forfeitButtonText}
                            </button>
                        ) : (
                            <button
                                onClick={onRefreshGrid}
                                disabled={isGridActionDisabled || isSearchOnCooldown}
                                className="px-6 py-2 bg-gray-500 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-gray-600 transition-all transform hover:scale-105 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isSearchOnCooldown ? '···' : '搜寻'}
                            </button>
                        )}
                    </div>
                </div>

                <div ref={gridContainerRef} className="relative flex-1 min-h-[300px] lg:min-h-0 flex items-center justify-center p-2">
                    <div className="grid grid-cols-4 grid-rows-4 gap-1 sm:gap-2 aspect-square h-full max-h-full w-auto max-w-full">
                        {gridBlocks.map((block) => (
                            <GridBlockComponent
                                key={block.id}
                                ref={el => { blockRefs.current[block.id] = el }}
                                block={block}
                                player={player}
                                onClick={(e) => onBlockClick(block, e.currentTarget)}
                                guardedTreasureState={guardedTreasureState}
                                isHostileMode={isHostileMode}
                            />
                        ))}
                    </div>
                    
                    {gridContainerRef.current && projectileAnims.map(anim => {
                        const fromEl = blockRefs.current[anim.fromId];
                        const toEl = blockRefs.current[anim.toId];
                        if (!fromEl || !toEl || !gridContainerRef.current) return null;

                        const containerRect = gridContainerRef.current.getBoundingClientRect();
                        const fromRect = fromEl.getBoundingClientRect();
                        const toRect = toEl.getBoundingClientRect();

                        const startX = fromRect.left - containerRect.left + fromRect.width / 2;
                        const startY = fromRect.top - containerRect.top + fromRect.height / 2;
                        const endX = toRect.left - containerRect.left + toRect.width / 2;
                        const endY = toRect.top - containerRect.top + toRect.height / 2;

                        const tx = endX - startX;
                        const ty = endY - startY;
                        
                        const style = {
                            display: 'block',
                            left: `${startX}px`,
                            top: `${startY}px`,
                            transform: 'translate(-50%, -50%)',
                            // @ts-ignore
                            '--tx': `${tx}px`,
                            '--ty': `${ty}px`,
                        };
                        
                        return <SingleProjectile key={anim.id} style={style} onComplete={() => onAnimationComplete('projectile', anim.id)} />;
                    })}

                    {feedbackAnims.map(anim => (
                        <FeedbackItem
                            key={anim.id}
                            anim={anim}
                            containerRef={gridContainerRef}
                            blockRefs={blockRefs}
                            onComplete={() => onAnimationComplete('feedback', anim.id)}
                        />
                    ))}
                </div>
                
                <MonsterCompendium 
                    isOpen={isCompendiumOpen}
                    onClose={() => setIsCompendiumOpen(false)}
                    monsterBlocks={monsterBlocks}
                    player={player}
                />
            </div>

            <FloorControls 
                player={player}
                floorChallengeState={floorChallengeState}
                isActionDisabled={isChallengeControlsDisabled}
                onPreviousFloor={onPreviousFloor}
                onNextFloor={onNextFloor}
                onGoToFloor={onGoToFloor}
                onAscendFloor={onAscendFloor}
            />

            <LogPanel logs={logs} onItemClick={onItemClick} />
        </div>
    );
};