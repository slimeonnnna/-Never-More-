
import {
  PlayerStats, Monster, CombatOutcome, GridBlock
} from '../types';

// --- Combat Calculation ---

export const calculateCombatOutcome = (playerStats: PlayerStats, monster: Monster): CombatOutcome => {
    const playerDamage = Math.max(0, playerStats.attack - monster.stats.defense);
    const monsterDamage = Math.max(0, monster.stats.attack - playerStats.defense);

    // Stalemate check: If player cannot deal any damage and monster has health.
    if (playerDamage <= 0 && monster.stats.health > 0) {
        return { playerWon: false, healthChange: 0, rounds: Infinity };
    }

    // Optimization for very long fights where the winner might be obvious.
    // This avoids hitting the SAFETY_BREAK for high-health/low-damage scenarios.
    const roundsToWin = Math.ceil(monster.stats.health / playerDamage);
    const SAFETY_BREAK = 100_000_000;

    if (!isFinite(roundsToWin) && monster.stats.health <= 0) {
        return { playerWon: true, healthChange: 0, rounds: 0 };
    }
    
    if (roundsToWin > SAFETY_BREAK) {
        // Direct calculation for win condition
        const totalRawDamageToWin = monsterDamage * (roundsToWin > 0 ? roundsToWin - 1 : 0);
        const finalDamageToWin = Math.max(0, totalRawDamageToWin - playerStats.magicResist);
        const totalRegenToWin = playerStats.lifeRegen * roundsToWin;
        const healthChangeToWin = totalRegenToWin - finalDamageToWin;

        if (playerStats.health + healthChangeToWin > 0) {
            return { playerWon: true, healthChange: Math.round(healthChangeToWin), rounds: roundsToWin };
        } else {
             // Player loses, but we can't simulate the exact round of defeat.
             // We return the stats for a hypothetical win.
            const winnableStats = {
                roundsToWin: roundsToWin,
                healthCost: Math.round(Math.max(0, -healthChangeToWin))
            };
            return { 
                playerWon: false, 
                healthChange: -playerStats.health, // Total health loss
                rounds: Infinity, // Indicate it's a loss that can't be simulated to find exact round.
                winnableStats
            };
        }
    }


    // --- Simulation 1: Fight with current health ---
    let pHealth = playerStats.health;
    let mHealth = monster.stats.health;
    let totalRawDamageFromMonster = 0;
    let rounds = 0;

    while (rounds < SAFETY_BREAK) {
        rounds++;
        
        // Player's Turn
        mHealth -= playerDamage;
        pHealth += playerStats.lifeRegen;

        if (mHealth <= 0) {
            // Player won.
            const finalDamageTaken = Math.max(0, totalRawDamageFromMonster - playerStats.magicResist);
            const totalRegen = playerStats.lifeRegen * rounds;
            const healthChange = totalRegen - finalDamageTaken;
            return { playerWon: true, healthChange: Math.round(healthChange), rounds };
        }

        // Monster's Turn
        pHealth -= monsterDamage;
        totalRawDamageFromMonster += monsterDamage;
        // Monster no longer regenerates health

        if (pHealth <= 0) {
            // Player lost. MR does not apply. Health change is based on final simulated health.
            const healthChange = pHealth - playerStats.health;
            const lossOutcome: CombatOutcome = { 
                playerWon: false, 
                healthChange: Math.round(healthChange), 
                rounds 
            };
            
            // --- Simulation 2: Calculate winnable stats assuming infinite player health ---
            let sim_mHealth = monster.stats.health;
            let sim_rounds = 0;
            let sim_totalRawDamage = 0;
            let sim_totalRegen = 0;

            while (sim_rounds < SAFETY_BREAK) {
                sim_rounds++;
                sim_mHealth -= playerDamage;
                sim_totalRegen += playerStats.lifeRegen;

                if (sim_mHealth <= 0) {
                    const finalDamage = Math.max(0, sim_totalRawDamage - playerStats.magicResist);
                    const healthCost = finalDamage - sim_totalRegen;
                    lossOutcome.winnableStats = {
                        roundsToWin: sim_rounds,
                        healthCost: Math.round(Math.max(0, healthCost))
                    };
                    return lossOutcome;
                }

                sim_totalRawDamage += monsterDamage;
                // Monster no longer regenerates health
            }
            // If the second simulation also hits safety, it's an effective stalemate
            return { playerWon: false, healthChange: 0, rounds: Infinity };
        }
    }

    // Stalemate if safety break is reached.
    return { playerWon: false, healthChange: 0, rounds: Infinity };
};

export const reCalculateGridOutcomes = (playerStats: PlayerStats, grid: GridBlock[]): GridBlock[] => {
    return grid.map(block => {
        if (block.type === 'monster' || block.type === 'friendly') {
            return { ...block, combatOutcome: calculateCombatOutcome(playerStats, block.data as Monster) };
        }
        return block;
    });
};
