
import React, { useCallback } from 'react';
import { CombatLog, FeedbackAnimation, Equipment } from '../types';

type QueuedFeedback = Omit<FeedbackAnimation, 'id'>;

export const useGameLog = ({ setLogs, setFeedbackAnims }) => {
    const updateLog = useCallback((message: string, color: string, isHtml: boolean = false, item?: Equipment) => {
        const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        const fullMessage = isHtml ? `<p class="text-sm"><span class="text-gray-500 mr-1">[${timestamp}]</span> ${message}</p>` : `[${timestamp}] ${message}`;
        setLogs(prevLogs => {
            const newLog: CombatLog = { id: crypto.randomUUID(), message: fullMessage, color, isHtml: true, item };
            return [newLog, ...prevLogs].slice(0, 50);
        });
    }, [setLogs]);

    const addFeedback = useCallback((feedback: QueuedFeedback) => {
        setFeedbackAnims(prev => [...prev, { ...feedback, id: crypto.randomUUID() }]);
    }, [setFeedbackAnims]);

    const triggerFeedbackQueue = useCallback((feedbacks: QueuedFeedback[], delay: number) => {
        feedbacks.forEach((fb, index) => {
            setTimeout(() => {
                addFeedback(fb);
            }, index * delay);
        });
    }, [addFeedback]);

    return {
        updateLog,
        addFeedback,
        triggerFeedbackQueue,
    };
};