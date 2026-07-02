import React from 'react';
import { Player, FloorChallengeState } from '../types';

interface FloorControlsProps {
    player: Player;
    floorChallengeState: FloorChallengeState;
    isActionDisabled: boolean;
    onPreviousFloor: () => void;
    onNextFloor: () => void;
    onGoToFloor: () => void;
    onAscendFloor: () => void;
}

export const FloorControls: React.FC<FloorControlsProps> = ({
    player, floorChallengeState, isActionDisabled, onPreviousFloor, onNextFloor, onGoToFloor, onAscendFloor
}) => {
    if (floorChallengeState.isCompleted) {
        return (
            <div className="flex-shrink-0 bg-gray-900/50 p-3 rounded-lg mt-2 border border-yellow-500 animate-pulse">
                <div className="flex justify-around items-center">
                    <button
                        onClick={onAscendFloor}
                        className="px-6 py-2 bg-yellow-500 text-black font-bold text-lg rounded-md hover:bg-yellow-400 transition-colors shadow-lg">
                        上楼 (至 {floorChallengeState.targetFloor} 层)
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex-shrink-0 bg-gray-900/50 p-3 rounded-lg mt-2 border border-gray-700">
            {floorChallengeState.isActive ? (
                <div className="text-center text-yellow-400 animate-pulse font-bold text-lg">
                    楼层挑战中：击败目标以晋升至 {floorChallengeState.targetFloor} 层！
                </div>
            ) : (
                <div className="flex justify-around items-center">
                    <button
                        onClick={onPreviousFloor}
                        disabled={player.currentFloor <= 1 || isActionDisabled}
                        className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed">
                        上一层
                    </button>
                    <div className="text-lg font-bold text-yellow-300">
                        当前楼层: {player.currentFloor}
                    </div>
                    <button
                        onClick={onNextFloor}
                        disabled={isActionDisabled}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed">
                        {player.currentFloor < player.highestFloor ? '下一层' : '挑战更高层'}
                    </button>
                    <button
                        onClick={onGoToFloor}
                        disabled={isActionDisabled}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed">
                        快速前往
                    </button>
                </div>
            )}
        </div>
    );
};