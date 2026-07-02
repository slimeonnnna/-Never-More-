
import React from 'react';
import { SearchSettings, SearchMode, MonsterRank, ChallengeState } from '../types';
import { MONSTER_RANK_CONFIG } from '../constants';

interface SearchSettingsPanelProps {
  settings: SearchSettings;
  unlockedRanks: MonsterRank[];
  onSettingsChange: (newSettings: Partial<SearchSettings>) => void;
  onInitiateChallenge: (rank: MonsterRank) => void;
  challengeState: ChallengeState;
  isDisabled?: boolean;
}

const SearchModeOption: React.FC<{
    label: string;
    value: SearchMode;
    current: SearchMode;
    onChange: (mode: SearchMode) => void;
    disabled: boolean;
}> = ({ label, value, current, onChange, disabled }) => (
    <button
        onClick={() => onChange(value)}
        disabled={disabled}
        className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm font-semibold
            ${current === value ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
    >
        {label}
    </button>
);

export const SearchSettingsPanel: React.FC<SearchSettingsPanelProps> = ({
  settings,
  unlockedRanks,
  onSettingsChange,
  onInitiateChallenge,
  challengeState,
  isDisabled,
}) => {
    const isPanelDisabled = challengeState.isActive || isDisabled;
    const challengeableRanks: MonsterRank[] = [MonsterRank.Elite, MonsterRank.Lord, MonsterRank.Monarch1, MonsterRank.Monarch2, MonsterRank.Monarch3, MonsterRank.Ancient];

    const handleModeChange = (mode: SearchMode) => {
        onSettingsChange({ mode });
    };

    const handleRankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'null') {
            onSettingsChange({ rankConstraint: null });
        } else {
            const rank = value as MonsterRank;
            if (unlockedRanks.includes(rank)) {
                onSettingsChange({ rankConstraint: rank });
            } else {
                onInitiateChallenge(rank);
            }
        }
    };
    
    const handleRealmToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange({ isRealmConstrained: e.target.checked });
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg flex flex-col border border-gray-700 gap-4">
            <h2 className="text-xl font-bold text-center text-yellow-400">搜寻设置</h2>
            
            <div className="space-y-2">
                 <button
                    onClick={() => onSettingsChange({ mode: 'random' })}
                    disabled={isPanelDisabled}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm font-semibold
                        ${'random' === settings.mode ? 'bg-teal-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}
                        ${isPanelDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    A: 恢复随机
                </button>
                <SearchModeOption label="B: 实力相近" value="similarStrength" current={settings.mode} onChange={handleModeChange} disabled={isPanelDisabled} />
                <SearchModeOption label="C: 搜寻限制" value="constrained" current={settings.mode} onChange={handleModeChange} disabled={isPanelDisabled} />
            </div>

            {settings.mode === 'constrained' && (
                <div className="bg-gray-900/50 p-3 rounded-lg space-y-4 animate-fade-in border border-gray-700">
                    <div>
                        <label htmlFor="rank-constraint" className="block text-sm font-medium text-gray-300 mb-1">1. 战力阶级限制</label>
                        <select
                            id="rank-constraint"
                            value={settings.rankConstraint || 'null'}
                            onChange={handleRankChange}
                            disabled={isPanelDisabled}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                        >
                            <option value="null">无限制</option>
                            {challengeableRanks.map(rank => {
                                const isUnlocked = unlockedRanks.includes(rank);
                                return (
                                    <option key={rank} value={rank} className={isUnlocked ? 'text-green-400' : 'text-red-400'}>
                                        {rank} {isUnlocked ? '(已解锁)' : '(未解锁 - 点击挑战)'}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div>
                         <label htmlFor="realm-constraint" className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                id="realm-constraint"
                                checked={settings.isRealmConstrained}
                                onChange={handleRealmToggle}
                                disabled={isPanelDisabled}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700 disabled:opacity-50"
                            />
                             <span className="text-sm font-medium text-gray-300">2. 境界限制 (激活)</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">激活后，只会出现同境界的对手。</p>
                    </div>
                </div>
            )}
            
            {challengeState.isActive && (
                <div className="mt-auto bg-yellow-900/30 border border-yellow-500 p-3 rounded-lg text-center animate-fade-in">
                    <p className="font-bold text-yellow-400">挑战进行中!</p>
                    <p className="text-sm text-yellow-300">击败当前敌人以解锁【{challengeState.rankToUnlock}】阶级。</p>
                </div>
            )}
        </div>
    );
};
