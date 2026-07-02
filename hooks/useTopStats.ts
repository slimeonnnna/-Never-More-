

import React, { useCallback } from 'react';
import {
    GameState, Equipment, Monster, RestoringEnemyRecord
} from '../types';
import { ORDERED_QUALITIES } from '../constants';

export const useTopStats = ({ setGameState, setSelectedItem, setSelectedMonsterForDetail }) => {

    const updateTopStats = useCallback((newItems: { monsters?: Monster[], equipment?: Equipment[], restoringFights?: RestoringEnemyRecord[] }) => {
        setGameState(prev => {
            let { strongestEnemies, topCombatPowerEquipment, topQualityEquipment, topRestoringEnemies } = prev;
    
            if (newItems.monsters && newItems.monsters.length > 0) {
                const combinedMonsters = [...strongestEnemies, ...newItems.monsters];
                const uniqueMonsters = combinedMonsters.filter((item, index, self) => index === self.findIndex(t => t.id === item.id));
                uniqueMonsters.sort((a, b) => b.stats.combatPower - a.stats.combatPower);
                strongestEnemies = uniqueMonsters.slice(0, 10);
            }
    
            if (newItems.equipment && newItems.equipment.length > 0) {
                const combinedEquipment = [...topCombatPowerEquipment, ...topQualityEquipment, ...newItems.equipment];
                const uniqueEquipment = combinedEquipment.filter((item, index, self) => index === self.findIndex(t => t.id === item.id));
    
                const newTopCombat = [...uniqueEquipment].sort((a, b) => b.combatPower - a.combatPower).slice(0, 10);
                
                const newTopQuality = [...uniqueEquipment].sort((a, b) => {
                     const qualityA = ORDERED_QUALITIES.indexOf(a.quality) + (a.qualityLevel || 0);
                     const qualityB = ORDERED_QUALITIES.indexOf(b.quality) + (b.qualityLevel || 0);
                     if (qualityB !== qualityA) return qualityB - qualityA;
                     return b.combatPower - a.combatPower;
                }).slice(0, 10);
    
                topCombatPowerEquipment = newTopCombat;
                topQualityEquipment = newTopQuality;
            }
    
            if (newItems.restoringFights && newItems.restoringFights.length > 0) {
                const combinedFights = [...topRestoringEnemies, ...newItems.restoringFights];
                const uniqueFightsMap = new Map<string, RestoringEnemyRecord>();
                for (const fight of combinedFights) {
                    const existing = uniqueFightsMap.get(fight.monster.id);
                    if (!existing || fight.healthRestored > existing.healthRestored) {
                        uniqueFightsMap.set(fight.monster.id, fight);
                    }
                }
                const uniqueFights = Array.from(uniqueFightsMap.values());
                uniqueFights.sort((a, b) => b.healthRestored - a.healthRestored);
                topRestoringEnemies = uniqueFights.slice(0, 10);
            }
    
            return { ...prev, strongestEnemies, topCombatPowerEquipment, topQualityEquipment, topRestoringEnemies };
        });
    }, [setGameState]);

    const handleTopStatsEquipmentClick = (item: Equipment) => {
        setGameState(prev => {
            const isEquipped = Object.values(prev.player.equipped).filter((e): e is Equipment => !!e).some(e => e.id === item.id);
            const inInventory = prev.player.inventory.some(i => i.id === item.id);
            const source = isEquipped ? 'equipped' : (inInventory ? 'inventory' : 'inventory');
            setSelectedItem({ item, source });
            return prev;
        });
    };
        
    const handleTopStatsMonsterClick = (monster: Monster) => setSelectedMonsterForDetail(monster);

    return {
        updateTopStats,
        handleTopStatsEquipmentClick,
        handleTopStatsMonsterClick,
    };
};