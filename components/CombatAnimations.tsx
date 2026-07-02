import React, { useState, useEffect } from 'react';
import { FeedbackAnimation, ProjectileAnimation } from '../types';

export const FeedbackItem: React.FC<{
  anim: FeedbackAnimation;
  containerRef: React.RefObject<HTMLDivElement>;
  blockRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onComplete: () => void;
}> = ({ anim, containerRef, blockRefs, onComplete }) => {
    const [style, setStyle] = useState<React.CSSProperties>({ display: 'none' });

    useEffect(() => {
        if (!containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const onEl = blockRefs.current[anim.onId];
        let finalStyle: React.CSSProperties = { display: 'none' };
        
        if (onEl) {
            const onRect = onEl.getBoundingClientRect();
            const x = onRect.left - containerRect.left + onRect.width / 2;
            const y = onRect.top - containerRect.top + onRect.height / 2;
            finalStyle = {
                display: 'block',
                left: `${x}px`,
                top: `${y}px`,
                maxWidth: `${onRect.width * 2.5}px`, // Constrain width to avoid overflow
                ...anim.style
            };
        }
        
        setStyle(finalStyle);

        const timer = setTimeout(onComplete, 1500); // Match animation duration
        return () => clearTimeout(timer);
    }, [anim, containerRef, blockRefs, onComplete]); 

    if (anim.isHtml) {
        return <div className={`feedback-item ${anim.className}`} style={style} dangerouslySetInnerHTML={{ __html: anim.text }} />;
    }
    return <div className={`feedback-item ${anim.className}`} style={style}>{anim.text}</div>;
}

export const SingleProjectile: React.FC<{ style: React.CSSProperties, onComplete: () => void }> = ({ style, onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 700); // Match CSS animation duration
        return () => clearTimeout(timer);
    }, [onComplete]);

    return <div className="projectile" style={style}></div>;
};