import React, { useState } from 'react';
import { MonsterRank, EquipmentQuality, EquipmentSlot } from '../types';
import { REALMS } from '../realmConstants';
import { ORDERED_QUALITIES, EQUIPMENT_SLOTS_ORDER, EQUIPMENT_REALM_TIERS } from '../constants';

interface GMPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateMonster: (config: { realmIndex: number, rank: MonsterRank, isFriendly: boolean }) => void;
  onGenerateEquipment: (config: { realmIndex: number, quality: EquipmentQuality, qualityLevel: number, slot: EquipmentSlot }) => void;
}

const GMInputRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="grid grid-cols-3 items-center gap-2">
        <label className="text-sm font-medium text-gray-300 col-span-1">{label}:</label>
        <div className="col-span-2">{children}</div>
    </div>
);

export const GMPanel: React.FC<GMPanelProps> = ({ isOpen, onClose, onGenerateMonster, onGenerateEquipment }) => {
  // State for monster generation
  const [monsterRealmIdx, setMonsterRealmIdx] = useState(0);
  const [monsterRank, setMonsterRank] = useState(MonsterRank.Minion);
  const [isFriendly, setIsFriendly] = useState(false);

  // State for equipment generation
  const [eqTierIdx, setEqTierIdx] = useState(0);
  const [eqQuality, setEqQuality] = useState(EquipmentQuality.Common);
  const [eqQualityLevel, setEqQualityLevel] = useState(1);
  const [eqSlot, setEqSlot] = useState(EquipmentSlot.Weapon);

  if (!isOpen) return null;
  
  const handleGenerateMonster = () => {
    onGenerateMonster({
      realmIndex: Number(monsterRealmIdx),
      rank: monsterRank,
      isFriendly: isFriendly,
    });
    onClose();
  };

  const handleGenerateEquipment = () => {
    const selectedTier = EQUIPMENT_REALM_TIERS[eqTierIdx];
    const [minRealm, maxRealm] = selectedTier.range;
    const randomRealmIndex = Math.floor(Math.random() * (maxRealm - minRealm + 1)) + minRealm;
      
    onGenerateEquipment({
      realmIndex: randomRealmIndex,
      quality: eqQuality,
      qualityLevel: Number(eqQualityLevel),
      slot: eqSlot,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-800 border border-lime-500/50 rounded-lg shadow-xl w-full max-w-lg m-4 p-4 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-lime-300">GM Panel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>

        <div className="space-y-6">
          {/* Monster Generation Section */}
          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">生成单位</h3>
            <div className="space-y-3">
              <GMInputRow label="境界选择">
                <select value={monsterRealmIdx} onChange={e => setMonsterRealmIdx(Number(e.target.value))} className="w-full bg-gray-700 p-1 rounded">
                  {REALMS.map((realm, index) => <option key={index} value={index}>{index}: {realm.name}</option>)}
                </select>
              </GMInputRow>
              <GMInputRow label="阶级选择">
                <select value={monsterRank} onChange={e => setMonsterRank(e.target.value as MonsterRank)} className="w-full bg-gray-700 p-1 rounded">
                  {Object.values(MonsterRank).map(rank => <option key={rank} value={rank}>{rank}</option>)}
                </select>
              </GMInputRow>
              <GMInputRow label="是否友军">
                 <input type="checkbox" checked={isFriendly} onChange={e => setIsFriendly(e.target.checked)} className="h-5 w-5 rounded text-lime-500 bg-gray-700 focus:ring-lime-400" />
              </GMInputRow>
              <button onClick={handleGenerateMonster} className="w-full mt-2 py-2 bg-lime-600 hover:bg-lime-700 rounded-md font-bold transition-colors">生成</button>
            </div>
          </div>

          {/* Equipment Generation Section */}
          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">生成装备</h3>
            <div className="space-y-3">
              <GMInputRow label="境界选择">
                <select value={eqTierIdx} onChange={e => setEqTierIdx(Number(e.target.value))} className="w-full bg-gray-700 p-1 rounded">
                  {EQUIPMENT_REALM_TIERS.map((tier, index) => <option key={index} value={index}>{tier.name}</option>)}
                </select>
              </GMInputRow>
              <GMInputRow label="品质选择">
                <select value={eqQuality} onChange={e => setEqQuality(e.target.value as EquipmentQuality)} className="w-full bg-gray-700 p-1 rounded">
                  {ORDERED_QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </GMInputRow>
              {eqQuality === EquipmentQuality.Void && (
                <GMInputRow label="虚空重数">
                  <input type="number" min="1" value={eqQualityLevel} onChange={e => setEqQualityLevel(Number(e.target.value))} className="w-full bg-gray-700 p-1 rounded" />
                </GMInputRow>
              )}
               <GMInputRow label="位置选择">
                <select value={eqSlot} onChange={e => setEqSlot(e.target.value as EquipmentSlot)} className="w-full bg-gray-700 p-1 rounded">
                  {EQUIPMENT_SLOTS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </GMInputRow>
              <button onClick={handleGenerateEquipment} className="w-full mt-2 py-2 bg-lime-600 hover:bg-lime-700 rounded-md font-bold transition-colors">生成</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};