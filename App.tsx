
import React from 'react';
import { PlayerPanel } from './components/PlayerPanel';
import { CombatPanel } from './components/CombatPanel';
import { EquipmentModal } from './components/EquipmentModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { InfoModal } from './components/InfoModal';
import { GoToFloorModal } from './components/GoToFloorModal';
import { MonsterDetailModal } from './components/MonsterDetailModal';
import { FriendlyUnitModal } from './components/FriendlyUnitModal';
import { GMPanel } from './components/GMPanel';
import { CharacterInteractionModal } from './components/CharacterInteractionModal';
import { InteractionActionModal } from './components/InteractionActionModal';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { useGameState } from './hooks/useGameState';

const App: React.FC = () => {
  const [showApiSettingsModal, setShowApiSettingsModal] = React.useState(false);

  const {
    gameState,
    logs,
    selectedItem,
    selectedMonsterForDetail,
    selectedFriendlyUnit,
    showResetConfirm,
    showOffensiveInfoModal,
    showDefeatModal,
    showGoToFloorModal,
    showGMPanel,
    projectileAnims,
    feedbackAnims,
    isSearchOnCooldown,
    interactionState,
    interactionActionState,
    handleItemClick,
    handleCloseModal,
    handleCloseMonsterDetailModal,
    handleCloseFriendlyUnitModal,
    handleCloseOffensiveInfoModal,
    handleCloseDefeatModal,
    handleEquipItem,
    handleUnequipItem,
    handleRefineItem,
    handleBulkRefine,
    handleAutoEquip,
    handleRefreshGrid,
    handleBlockClick,
    handleResetGame,
    handleConfirmReset,
    handleCancelReset,
    handleAutomationSettingsChange,
    handleToggleAllAutomations,
    onAnimationComplete,
    handleSearchSettingsChange,
    handleInitiateChallenge,
    handleForfeitChallenge,
    handleBreakthrough,
    handleTopStatsEquipmentClick,
    handleTopStatsMonsterClick,
    handleDeleteDeathRecord,
    handleRevenge,
    handleUseTemperingStone,
    handleNextFloor,
    handlePreviousFloor,
    setShowGoToFloorModal,
    setShowGMPanel,
    handleGoToFloor,
    handleAscendFloor,
    handleGmGenerateEquipment,
    handleGmGenerateMonster,
    handleViewCharacter,
    handleBattleCharacter,
    handleInteractCharacter,
    handleSpareMe,
    handleCloseInteractionModal,
    handleCloseInteractionActionModal,
    handleAIGiveItem,
    handleAIGiveGold,
    handleAIHealPlayer,
    handleAIRemoveBlock,
    handleAIDeductGold,
    handleAIMakeFriendly,
    setGameState,
  } = useGameState();

  const { player, gridBlocks, searchSettings, unlockedRanks, automationSettings, topCombatPowerEquipment, topQualityEquipment, strongestEnemies, topRestoringEnemies, deathLog, killStats, challengeState, floorChallengeState, revengeState, guardedTreasureState } = gameState;
  
  const hasStickyEnemies = gridBlocks.some(b => b.type === 'monster' && b.data && (b.data as any).stickiness && (b.data as any).stickiness > 0);

  return (
    <main className="flex flex-col lg:flex-row lg:h-screen bg-gray-900 text-gray-200 font-sans gap-4 p-2 lg:p-4 min-h-screen overflow-y-auto lg:overflow-hidden">
      <div className="w-full lg:w-1/3 flex-shrink-0 flex flex-col h-auto lg:h-full">
        <PlayerPanel
          player={player}
          onItemClick={handleItemClick}
          onAutoEquip={handleAutoEquip}
          onBulkRefine={handleBulkRefine}
          onResetGame={handleResetGame}
          onBreakthrough={handleBreakthrough}
          searchSettings={searchSettings}
          unlockedRanks={unlockedRanks}
          onSettingsChange={handleSearchSettingsChange}
          onInitiateChallenge={handleInitiateChallenge}
          challengeState={challengeState}
          topCombatPowerEquipment={topCombatPowerEquipment}
          topQualityEquipment={topQualityEquipment}
          strongestEnemies={strongestEnemies}
          topRestoringEnemies={topRestoringEnemies}
          deathLog={deathLog}
          killStats={killStats}
          onTopStatsEquipmentClick={handleTopStatsEquipmentClick}
          onTopStatsMonsterClick={handleTopStatsMonsterClick}
          onRevenge={handleRevenge}
          onDeleteRecord={handleDeleteDeathRecord}
          hasStickyEnemies={hasStickyEnemies}
          onShowGMPanel={() => setShowGMPanel(true)}
          onShowApiSettings={() => setShowApiSettingsModal(true)}
        />
      </div>
      <div className="w-full lg:w-2/3 flex flex-col h-auto lg:h-full min-h-[600px] lg:min-h-0">
        <CombatPanel
          gridBlocks={gridBlocks}
          logs={logs}
          player={player}
          challengeState={challengeState}
          floorChallengeState={floorChallengeState}
          revengeState={revengeState}
          automationSettings={automationSettings}
          projectileAnims={projectileAnims}
          feedbackAnims={feedbackAnims}
          guardedTreasureState={guardedTreasureState}
          isSearchOnCooldown={isSearchOnCooldown}
          onRefreshGrid={handleRefreshGrid}
          onBlockClick={handleBlockClick}
          onForfeitChallenge={handleForfeitChallenge}
          onAutomationSettingsChange={handleAutomationSettingsChange}
          onToggleAllAutomations={handleToggleAllAutomations}
          onAnimationComplete={onAnimationComplete}
          onNextFloor={handleNextFloor}
          onPreviousFloor={handlePreviousFloor}
          onGoToFloor={() => setShowGoToFloorModal(true)}
          onAscendFloor={handleAscendFloor}
          onItemClick={handleItemClick}
          hasStickyEnemies={hasStickyEnemies}
        />
      </div>

      {interactionState && (
        <CharacterInteractionModal
          interactionState={interactionState}
          onView={handleViewCharacter}
          onInteract={handleInteractCharacter}
          onBattle={handleBattleCharacter}
          onClose={handleCloseInteractionModal}
        />
      )}

      {interactionActionState && (
        <InteractionActionModal
          block={interactionActionState.block}
          player={player}
          gameState={gameState}
          onClose={handleCloseInteractionActionModal}
          onSpareMe={handleSpareMe}
          onAIGiveItem={handleAIGiveItem}
          onAIGiveGold={handleAIGiveGold}
          onAIHealPlayer={handleAIHealPlayer}
          onAIRemoveBlock={handleAIRemoveBlock}
          onAIDeductGold={handleAIDeductGold}
          onAIMakeFriendly={handleAIMakeFriendly}
          onBattle={handleBattleCharacter}
          setGameState={setGameState}
        />
      )}

      {selectedItem && (
        <EquipmentModal
          selectedItem={selectedItem.item}
          equippedItem={player.equipped[selectedItem.item.slot] || null}
          source={selectedItem.source}
          onClose={handleCloseModal}
          onEquip={handleEquipItem}
          onUnequip={handleUnequipItem}
          onRefine={handleRefineItem}
          onUseTemperingStone={handleUseTemperingStone}
          temperingStones={player.temperingStones}
        />
      )}
      
      {showResetConfirm && (
          <ConfirmationModal
            title="重新开始游戏？"
            message="你确定要重置所有进度吗？此操作无法撤销！"
            onConfirm={handleConfirmReset}
            onCancel={handleCancelReset}
          />
      )}
      
      {showOffensiveInfoModal && (
          <InfoModal
            title="危险预警"
            message="你的行为引发了某些人的关注，敌人将会主动对你进攻。"
            onConfirm={handleCloseOffensiveInfoModal}
          />
      )}
      
      {showDefeatModal && (
        <InfoModal
            title="你被击溃了！"
            message="神秘力量拯救了你，但没有替你保留某些物品。"
            onConfirm={handleCloseDefeatModal}
        />
      )}

      {selectedMonsterForDetail && (
          <MonsterDetailModal 
              monster={selectedMonsterForDetail}
              onClose={handleCloseMonsterDetailModal}
          />
      )}

       {selectedFriendlyUnit && (
          <FriendlyUnitModal 
              friendlyUnit={selectedFriendlyUnit}
              onClose={handleCloseFriendlyUnitModal}
              onItemClick={(item) => handleItemClick(item, 'inventory')}
          />
      )}

      {showGoToFloorModal && (
        <GoToFloorModal
            highestFloor={player.highestFloor}
            onClose={() => setShowGoToFloorModal(false)}
            onConfirm={handleGoToFloor}
        />
      )}

      {showGMPanel && (
        <GMPanel
          isOpen={showGMPanel}
          onClose={() => setShowGMPanel(false)}
          onGenerateMonster={handleGmGenerateMonster}
          onGenerateEquipment={handleGmGenerateEquipment}
        />
      )}

      {showApiSettingsModal && (
        <ApiSettingsModal onClose={() => setShowApiSettingsModal(false)} />
      )}
    </main>
  );
};

export default App;
