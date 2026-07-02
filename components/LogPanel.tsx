
import React from 'react';
import { CombatLog, Equipment } from '../types';

interface LogPanelProps {
    logs: CombatLog[];
    onItemClick: (item: Equipment, source: 'inventory' | 'equipped') => void;
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs, onItemClick }) => {
    return (
        <div className="flex-1 flex flex-col min-h-[150px] lg:min-h-0 mt-2">
            <h3 className="text-xl font-bold text-yellow-400 mb-2 flex-shrink-0">日志</h3>
            <div className="flex-1 bg-gray-900/50 p-3 rounded-lg overflow-y-auto min-h-0 space-y-1">
                {logs.map(log => {
                    if (log.item) {
                        return (
                            <button
                                key={log.id}
                                onClick={() => onItemClick(log.item!, 'inventory')}
                                className="w-full text-left p-0.5 rounded transition-colors hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            >
                                <div dangerouslySetInnerHTML={{ __html: log.message }} />
                            </button>
                        )
                    }
                    if (log.isHtml) {
                        return <div key={log.id} dangerouslySetInnerHTML={{ __html: log.message }} />;
                    }
                    return (
                        <p key={log.id} className={`text-sm ${log.color} animate-fade-in`}>
                            {log.message}
                        </p>
                    );
                })}
                {logs.length === 0 && (
                    <p className="text-center text-gray-500">开始你的冒险吧!</p>
                )}
            </div>
        </div>
    );
};