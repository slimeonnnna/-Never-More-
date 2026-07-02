
import React from 'react';
import { TooltipData, Attribute } from '../types';
import { QUALITY_CONFIG, ATTRIBUTE_CONFIG } from '../constants';
import { formatLargeNumber, calculateAttributePerfection } from '../utils';

interface TooltipProps {
  tooltipData: TooltipData | null;
}

const formatAttribute = (attr: Attribute): string => {
  const config = ATTRIBUTE_CONFIG[attr.type];
  const valueStr = config.isPercent ? attr.value.toLocaleString() : formatLargeNumber(attr.value);
  return `${config.label} +${valueStr}${config.isPercent ? '%' : ''}`;
};

export const Tooltip: React.FC<TooltipProps> = ({ tooltipData }) => {
  if (!tooltipData) return null;

  const { item, x, y } = tooltipData;
  const qualityClass = QUALITY_CONFIG[item.quality].cssClass;

  const qualityName = item.qualityLevel ? `${item.quality}${formatLargeNumber(item.qualityLevel)}重` : item.quality;
  const displayName = item.name.replace(`[${item.quality}]`, `[${qualityName}]`);

  return (
    <div
      className="absolute z-50 p-3 bg-gray-800 border border-gray-600 rounded-lg shadow-xl pointer-events-none transition-opacity duration-200 text-sm max-w-xs"
      style={{ left: x + 15, top: y + 15 }}
    >
      <div className={`font-bold text-base mb-2 flex items-center gap-2 ${qualityClass}`}>
        {displayName}
      </div>
      <div className="text-gray-400 mb-1">境界: {item.equipmentRealm} | {item.slot}</div>
      <div className="text-yellow-400 font-semibold mb-2">战力: {formatLargeNumber(item.combatPower)}</div>
      <div className="border-t border-gray-700 my-1"></div>
      <ul className="space-y-1">
        {item.attributes.map((attr, index) => {
          const perfection = calculateAttributePerfection(attr, item.realmIndex);
          return (
             <li key={index} className="text-cyan-400 flex justify-between items-center">
                <span>{formatAttribute(attr)}</span>
                {perfection > 0 && (
                  <span className="text-xs text-yellow-300/80 ml-2 font-mono">
                    ({perfection.toFixed(1)}%)
                  </span>
                )}
              </li>
          );
        })}
        {item.attributes.length === 0 && (
          <li className="text-gray-500">无特殊词条</li>
        )}
      </ul>
    </div>
  );
};
