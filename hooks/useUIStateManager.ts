
import React, { useState, useCallback } from 'react';
import { Equipment, Monster, ProjectileAnimation, FeedbackAnimation, CombatLog, GridBlock } from '../types';

export const useUIStateManager = ({ setGameState }) => {
    const [logs, setLogs] = useState<CombatLog[]>([]);
    const [selectedItem, setSelectedItem] = useState<{ item: Equipment; source: 'inventory' | 'equipped' } | null>(null);
    const [selectedMonsterForDetail, setSelectedMonsterForDetail] = useState<Monster | null>(null);
    const [selectedFriendlyUnit, setSelectedFriendlyUnit] = useState<Monster | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showOffensiveInfoModal, setShowOffensiveInfoModal] = useState(false);
    const [showDefeatModal, setShowDefeatModal] = useState(false);
    const [showGoToFloorModal, setShowGoToFloorModal] = useState(false);
    const [showGMPanel, setShowGMPanel] = useState(false);
    
    const [projectileAnims, setProjectileAnims] = useState<ProjectileAnimation[]>([]);
    const [feedbackAnims, setFeedbackAnims] = useState<FeedbackAnimation[]>([]);
    const [forfeitTriggered, setForfeitTriggered] = useState(false);
    const [isSearchOnCooldown, setIsSearchOnCooldown] = useState(false);

    const [interactionState, setInteractionState] = useState<{ block: GridBlock; element: HTMLElement } | null>(null);
    const [interactionActionState, setInteractionActionState] = useState<{ block: GridBlock } | null>(null);


    const handleItemClick = useCallback((item: Equipment, source: 'inventory' | 'equipped') => setSelectedItem({ item, source }), []);
    const handleCloseModal = useCallback(() => setSelectedItem(null), []);
    const handleCloseMonsterDetailModal = useCallback(() => setSelectedMonsterForDetail(null), []);
    const handleCloseFriendlyUnitModal = useCallback(() => setSelectedFriendlyUnit(null), []);
    const handleCloseInteractionModal = useCallback(() => setInteractionState(null), []);
    const handleCloseInteractionActionModal = useCallback(() => setInteractionActionState(null), []);
    const handleResetGame = useCallback(() => setShowResetConfirm(true), []);
    const handleCancelReset = useCallback(() => setShowResetConfirm(false), []);

    const onAnimationComplete = useCallback((type: 'projectile' | 'feedback', id: string) => {
        if (type === 'projectile') {
            setProjectileAnims(prev => prev.filter(a => a.id !== id));
        } else if (type === 'feedback') {
            setFeedbackAnims(prev => prev.filter(a => a.id !== id));
            setGameState(prev => ({...prev, gridBlocks: prev.gridBlocks.map(b => b.animation === 'hit' ? {...b, animation: null} : b)}));
        }
    }, [setGameState]);

    return {
        logs, setLogs,
        selectedItem, setSelectedItem,
        selectedMonsterForDetail, setSelectedMonsterForDetail,
        selectedFriendlyUnit, setSelectedFriendlyUnit,
        showResetConfirm, setShowResetConfirm,
        showOffensiveInfoModal, setShowOffensiveInfoModal,
        showDefeatModal, setShowDefeatModal,
        showGoToFloorModal, setShowGoToFloorModal,
        showGMPanel, setShowGMPanel,
        projectileAnims, setProjectileAnims,
        feedbackAnims, setFeedbackAnims,
        forfeitTriggered, setForfeitTriggered,
        isSearchOnCooldown, setIsSearchOnCooldown,
        interactionState, setInteractionState,
        interactionActionState, setInteractionActionState,
        handleItemClick,
        handleCloseModal,
        handleCloseMonsterDetailModal,
        handleCloseFriendlyUnitModal,
        handleCloseInteractionModal,
        handleCloseInteractionActionModal,
        handleResetGame,
        handleCancelReset,
        onAnimationComplete,
    };
};
