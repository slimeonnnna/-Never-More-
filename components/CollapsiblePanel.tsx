import React, { useState } from 'react';

interface CollapsiblePanelProps {
    title: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    isDisabled?: boolean;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({ 
    title, 
    children, 
    defaultExpanded = false, 
    isDisabled = false 
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className={`bg-gray-900/50 rounded-lg border border-gray-700 ${isDisabled ? 'opacity-70' : ''}`}>
            <button
                onClick={() => !isDisabled && setIsExpanded(p => !p)}
                className={`w-full flex justify-between items-center p-3 text-left transition-colors ${isDisabled ? 'cursor-not-allowed' : 'hover:bg-gray-700/50'}`}
                aria-expanded={isExpanded}
                disabled={isDisabled}
            >
                <div className="font-semibold text-lg text-yellow-300">{title}</div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isExpanded && !isDisabled ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isExpanded && !isDisabled && <div className="p-3 animate-fade-in">{children}</div>}
        </div>
    );
};
