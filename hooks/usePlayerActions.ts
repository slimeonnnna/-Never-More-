

import React, { useCallback } from 'react';
import {
  Equipment, EquipmentSlot, AttributeType, Attribute
} from '../types';
import { autoEquipBestItems } from '../services/equipmentManager';
import { calculateItemCombatPower, calculateTheoreticalMaxValueForAttr } from '../services/equipmentCalculations';
import { bulkProcessItems, processLoot } from '../services/loot';
import { BREAKTHROUGH_REALM_INDICES, ATTRIBUTE_GENERATION_CONFIG, ATTRIBUTE_CONFIG, QUALITY_CONFIG } from '../constants';
import { REALMS } from '../realmConstants';
import { formatLargeNumber, calculateAttributePerfection } from '../utils';
import { getRealmTierInfo } from '../constants';
import { attemptRefineUpgrade } from '../services/refining';

export const usePlayerActions = ({ gameState, setGameState, updateLog, addFeedback, triggerFeedbackQueue, setSelectedItem }) => {
    const { player } = gameState;

    const handleCloseModal = useCallback(() => setSelectedItem(null), [setSelectedItem]);

    const handleEquipItem = useCallback((itemToEquip: Equipment) => {
        setGameState(prev => {
            const newEquipped = { ...prev.player.equipped };
            let newInventory = prev.player.inventory.filter(i => i.id !== itemToEquip.id);
            const currentItemInSlot = newEquipped[itemToEquip.slot];
            if (currentItemInSlot) newInventory.push(currentItemInSlot);
            newEquipped[itemToEquip.slot] = itemToEquip;
            return { ...prev, player: { ...prev.player, equipped: newEquipped, inventory: newInventory } };
        });
        const qualityName = itemToEquip.qualityLevel ? `${itemToEquip.quality}${itemToEquip.qualityLevel}重` : itemToEquip.quality;
        updateLog(`装备了 [${qualityName}] ${itemToEquip.name}`, 'text-yellow-300');
        handleCloseModal();
    }, [setGameState, updateLog, handleCloseModal]);

    const handleUnequipItem = useCallback((slot: EquipmentSlot) => {
        const itemToUnequip = player.equipped[slot];
        if (!itemToUnequip) return;
        setGameState(prev => {
            const newEquipped = { ...prev.player.equipped };
            delete newEquipped[slot];
            const newInventory = [...prev.player.inventory, itemToUnequip];
            return { ...prev, player: { ...prev.player, equipped: newEquipped, inventory: newInventory } };
        });
        updateLog(`卸下了 ${itemToUnequip.name}`, 'text-gray-400');
        handleCloseModal();
    }, [player.equipped, setGameState, updateLog, handleCloseModal]);

    const handleRefineItem = useCallback((itemToRefine: Equipment) => {
        const power = itemToRefine.combatPower;
        updateLog(`炼化 ${itemToRefine.name}，获得了 ${formatLargeNumber(power)} 金币。`, 'text-yellow-300');

        const upgradedItem = attemptRefineUpgrade(itemToRefine, player);

        setGameState(prev => {
            let modifiablePlayer = {
                ...prev.player,
                inventory: prev.player.inventory.filter(i => i.id !== itemToRefine.id),
                gold: (prev.player.gold || 0) + power,
            };

            if (upgradedItem) {
                const { updatedPlayer, logs: lootLogs } = processLoot(modifiablePlayer, [upgradedItem], prev.automationSettings);
                
                setTimeout(() => {
                    const qualityClass = QUALITY_CONFIG[upgradedItem.quality].cssClass;
                    const qualityName = upgradedItem.qualityLevel ? `${upgradedItem.quality}${upgradedItem.qualityLevel}重` : upgradedItem.quality;
                    const styledName = `<span class="${qualityClass}">[${qualityName}] ${upgradedItem.name.replace(/\[.*?\]\s*/g, '')}</span>`;
                    const message = `炼化时运气爆发，获得了 ${styledName}！`;
                    updateLog(message, qualityClass, true, upgradedItem);
                    
                    lootLogs.forEach(log => updateLog(log.message, 'text-teal-300', true, log.item));

                    const playerBlock = prev.gridBlocks.find(b => b.type === 'player');
                    if (playerBlock) {
                        const feedbackText = `炼化所得`;
                        addFeedback({ onId: playerBlock.id, text: feedbackText, isHtml: false, className: `text-lg ${qualityClass}` });
                    }
                }, 0);

                return { ...prev, player: updatedPlayer };
            }

            return { ...prev, player: modifiablePlayer };
        });

        handleCloseModal();
    }, [player, gameState.automationSettings, updateLog, addFeedback, setGameState, handleCloseModal]);

    const handleBulkRefine = useCallback(() => {
        if (player.inventory.length === 0) {
            updateLog('背包中没有可处理的装备。', 'text-gray-400');
            return;
        }
        setGameState(prev => {
            const { player: playerAfterRefine, log, newlyCreatedItems } = bulkProcessItems(prev.player);
            if (log) {
                updateLog(log, 'text-cyan-300', true);
            }

            if (newlyCreatedItems.length === 0) {
                return { ...prev, player: playerAfterRefine };
            }
            
            const { updatedPlayer, logs: lootLogs } = processLoot(playerAfterRefine, newlyCreatedItems, prev.automationSettings);
            
            setTimeout(() => {
                if (newlyCreatedItems.length > 0) {
                    newlyCreatedItems.forEach(item => {
                        const qualityClass = QUALITY_CONFIG[item.quality].cssClass;
                        const qualityName = item.qualityLevel ? `${item.quality}${item.qualityLevel}重` : item.quality;
                        const styledName = `<span class="${qualityClass}">[${qualityName}] ${item.name.replace(/\[.*?\]\s*/g, '')}</span>`;
                        const message = `批量炼化时运气爆发，获得了 ${styledName}！`;
                        updateLog(message, qualityClass, true, item);
                    });
                    lootLogs.forEach(l => updateLog(l.message, 'text-teal-300', true, l.item));
                }

                const playerBlock = prev.gridBlocks.find(b => b.type === 'player');
                if (playerBlock) {
                    const feedbacks = newlyCreatedItems.map(item => {
                        const qualityClass = QUALITY_CONFIG[item.quality].cssClass;
                        const feedbackText = `炼化所得`;
                        return { onId: playerBlock.id, text: feedbackText, isHtml: false, className: `text-lg ${qualityClass}` };
                    });
                    triggerFeedbackQueue(feedbacks, 150);
                }
            }, 0);
            
            return { ...prev, player: updatedPlayer };
        });
    }, [player.inventory, setGameState, updateLog, triggerFeedbackQueue]);

    const handleAutoEquip = useCallback(() => {
        setGameState(prev => {
            const { player: newPlayer, changes } = autoEquipBestItems(prev.player);
            if (changes.length > 0) {
                 changes.forEach(change => {
                    const { equipped, unequipped } = change;
                    const qualityClass = QUALITY_CONFIG[equipped.quality].cssClass;
                    const styledName = `<span class="${qualityClass}">${equipped.name}</span>`;
                    if (unequipped) {
                        updateLog(`一键换装: ${styledName} 替换了 ${unequipped.name}`, 'text-teal-300', true);
                    } else {
                        updateLog(`一键换装: 装备了 ${styledName}`, 'text-teal-300', true);
                    }
                });
                return { ...prev, player: newPlayer };
            }
            updateLog('当前已是最佳装备，无需更换。', 'text-gray-400');
            return prev;
        });
    }, [setGameState, updateLog]);

    const handleBreakthrough = useCallback(() => {
        setGameState(prev => {
            const { player } = prev;
            const isAtBreakthroughRealm = BREAKTHROUGH_REALM_INDICES.includes(player.realmIndex);
            if (!isAtBreakthroughRealm || player.xp < player.xpToNextLevel || player.xpToNextLevel === Infinity) return prev;

            const newXp = player.xp - player.xpToNextLevel;
            const oldRealm = REALMS[player.realmIndex], newRealmIndex = player.realmIndex + 1;
            if (newRealmIndex >= REALMS.length) return prev;

            const newRealm = REALMS[newRealmIndex];
            const hpGain = newRealm.totalHpBonus - oldRealm.totalHpBonus;
            const pointsGain = newRealm.totalPointsBonus - oldRealm.totalPointsBonus;
            const p_atk = Math.floor(pointsGain / 2);
            const p_def = pointsGain - p_atk;
            const mrGain = Math.round(pointsGain * 1.5);

            updateLog(`境界突破！你已达到【${newRealm.name}】！`, 'text-legendary font-bold');
            const playerAfterBreakthrough = {
                ...player, realmIndex: newRealmIndex, xp: newXp, xpToNextLevel: newRealm.xpToNext,
                permanentBonuses: { ...player.permanentBonuses, attack: player.permanentBonuses.attack + p_atk, defense: player.permanentBonuses.defense + p_def, health: player.permanentBonuses.health + hpGain, magicResist: player.permanentBonuses.magicResist + mrGain }
            };
            const newSearchSettings = { ...prev.searchSettings, rankConstraint: null };
            updateLog('搜寻设置中的"战力阶级限制"已重置为无限制。', 'text-gray-400');
            return { ...prev, player: playerAfterBreakthrough, searchSettings: newSearchSettings };
        });
    }, [updateLog, setGameState]);

    const handleUseTemperingStone = useCallback((itemToUpgrade: Equipment, attrType: AttributeType, isAutomated: boolean = false) => {
        if (player.temperingStones <= 0) {
            if (!isAutomated) updateLog('没有淬炼石。', 'text-red-400');
            return;
        }

        const attribute = itemToUpgrade.attributes.find(a => a.type === attrType);
        if (!attribute || !attribute.rollCount) return;

        const perfection = calculateAttributePerfection(attribute, itemToUpgrade.realmIndex);
        if (perfection >= 100) {
            if (!isAutomated) updateLog('该词条已达完美，无法淬炼。', 'text-yellow-400');
            return;
        }

        const itemTierInfo = getRealmTierInfo(itemToUpgrade.realmIndex);
        const attrGenConfig = ATTRIBUTE_GENERATION_CONFIG[attribute.type];
        const baseMaxValue = attrGenConfig.range[1];
        let tierMax: number;
        const tierMultiplier = Math.pow(50, itemTierInfo.tierIndex);

        if (attribute.type === AttributeType.Divinity) tierMax = baseMaxValue + itemTierInfo.tierIndex;
        else tierMax = baseMaxValue * tierMultiplier;
        
        const singleRollMax = Math.round(tierMax * (1 + (itemToUpgrade.realmIndex / 200)));
        const totalMax = singleRollMax * attribute.rollCount;
        const finalNewValue = Math.max(attribute.value + 1, Math.floor(attribute.value + totalMax * 0.01));

        const newAttribute: Attribute = { ...attribute, value: finalNewValue };
        const newAttributes = itemToUpgrade.attributes.map(a => a.type === attrType ? newAttribute : a);
        const newItemWithoutCP: Omit<Equipment, 'combatPower'> = { ...itemToUpgrade, attributes: newAttributes };
        const newCombatPower = calculateItemCombatPower(newItemWithoutCP);
        const upgradedItem: Equipment = { ...newItemWithoutCP, combatPower: newCombatPower };

        setGameState(prev => {
            const isEquipped = Object.values(prev.player.equipped).filter((e): e is Equipment => !!e).some(e => e.id === itemToUpgrade.id);
            const source = isEquipped ? 'equipped' : 'inventory';
            let newPlayerState = { ...prev.player };

            if (source === 'equipped') {
                newPlayerState.equipped = { ...newPlayerState.equipped, [itemToUpgrade.slot]: upgradedItem };
            } else {
                newPlayerState.inventory = newPlayerState.inventory.map(i => i.id === itemToUpgrade.id ? upgradedItem : i);
            }
            newPlayerState.temperingStones -= 1;
            return { ...prev, player: newPlayerState };
        });
        
        if (!isAutomated) handleCloseModal();

        const qualityName = upgradedItem.qualityLevel ? `${upgradedItem.quality}${upgradedItem.qualityLevel}重` : upgradedItem.quality;
        const qualityClass = QUALITY_CONFIG[upgradedItem.quality].cssClass;
        const styledName = `<span class="${qualityClass}">${upgradedItem.name.replace(`[${upgradedItem.quality}]`, `[${qualityName}]`)}</span>`;
        const attrLabel = ATTRIBUTE_CONFIG[attrType].label;
        const automationPrefix = isAutomated ? '自动' : '';
        updateLog(`${automationPrefix}成功淬炼 ${styledName}，<span class="text-cyan-300">${attrLabel}</span> 从 ${formatLargeNumber(attribute.value)} 提升至 ${formatLargeNumber(finalNewValue)}。消耗 1 淬炼石。`, 'text-cyan-300', true);
    }, [player.temperingStones, updateLog, handleCloseModal, setGameState]);
    
    return {
        handleEquipItem,
        handleUnequipItem,
        handleRefineItem,
        handleBulkRefine,
        handleAutoEquip,
        handleBreakthrough,
        handleUseTemperingStone,
    };
};