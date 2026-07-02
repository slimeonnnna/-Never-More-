
import React from 'react';
import { AutomationSettings } from '../types';

interface AutomationPanelProps {
    settings: AutomationSettings;
    onSettingsChange: (settings: Partial<AutomationSettings>) => void;
    allAutomationsEnabled: boolean;
    onToggleAllAutomations: () => void;
}

const ToggleSwitch: React.FC<{
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}> = ({ label, checked, onChange }) => (
    <label className="flex items-center justify-between cursor-pointer">
        <span className="text-gray-300 font-medium">{label}</span>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
            <div className={`block w-12 h-6 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-6' : ''}`}></div>
        </div>
    </label>
);


export const AutomationPanel: React.FC<AutomationPanelProps> = ({ settings, onSettingsChange, allAutomationsEnabled, onToggleAllAutomations }) => {
    return (
        <div className="bg-gray-800/80 backdrop-blur-md border border-gray-600 rounded-lg shadow-xl w-64 p-4 animate-fade-in">
            <div className="mb-4">
                 <h3 className="text-lg font-bold text-yellow-300">自动</h3>
            </div>
            <div className="space-y-4">
                <ToggleSwitch 
                    label="自动清0伤怪"
                    checked={settings.autoFight}
                    onChange={(val) => onSettingsChange({ autoFight: val })}
                />
                 <ToggleSwitch 
                    label="自动拾取"
                    checked={settings.autoLoot}
                    onChange={(val) => onSettingsChange({ autoLoot: val })}
                />
                 <ToggleSwitch 
                    label="自动炼化"
                    checked={settings.autoRefine}
                    onChange={(val) => onSettingsChange({ autoRefine: val })}
                />
                 <ToggleSwitch 
                    label="自动装备"
                    checked={settings.autoEquip}
                    onChange={(val) => onSettingsChange({ autoEquip: val })}
                />
                <ToggleSwitch 
                    label="自动淬炼"
                    checked={settings.autoTemper}
                    onChange={(val) => onSettingsChange({ autoTemper: val })}
                />
            </div>
            <div className="border-t border-gray-600 my-4"></div>
            <button
                onClick={onToggleAllAutomations}
                className="w-full px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 transition-colors"
            >
                {allAutomationsEnabled ? '全部关闭' : '一键开启'}
            </button>
        </div>
    );
};