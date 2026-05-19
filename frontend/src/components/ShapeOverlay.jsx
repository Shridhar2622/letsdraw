import React, { useRef, useEffect, useState } from 'react';
import { Check, X, RotateCw } from 'lucide-react';

export default function ShapeOverlay({ initialPos, type, color, strokeWidth, parentRef, onCommit, onCancel }) {
    const minSize = 20;
    const [bounds, setBounds] = useState({
        x: initialPos.x - 50,
        y: initialPos.y - 50,
        w: 100,
        h: 100,
        rotation: 0
    });

    const dragStart = useRef(null);
    const dragMode = useRef(null);
    
    const handleDown = (e, mode) => {
        e.stopPropagation();
        e.preventDefault(); // prevent touch scroll
        dragMode.current = mode;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        dragStart.current = {
            x: clientX,
            y: clientY,
            bounds: { ...bounds }
        };
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleUp);
    };

    const handleMove = (e) => {
        if (!dragMode.current) return;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        const dx = clientX - dragStart.current.x;
        const dy = clientY - dragStart.current.y;
        const b = dragStart.current.bounds;

        let newBounds = { ...b };
        
        // This math is a simple axis-aligned bounding box resize. 
        // If the shape is rotated, resizing will occur along the global axis, 
        // which might feel a bit weird but is acceptable for basic usage!
        if (dragMode.current === 'move') {
            newBounds.x = b.x + dx;
            newBounds.y = b.y + dy;
        } else if (dragMode.current === 'resize-se') {
            newBounds.w = Math.max(minSize, b.w + dx);
            newBounds.h = Math.max(minSize, b.h + dy);
        } else if (dragMode.current === 'resize-nw') {
            newBounds.w = Math.max(minSize, b.w - dx);
            newBounds.h = Math.max(minSize, b.h - dy);
            newBounds.x = b.x + (b.w - newBounds.w);
            newBounds.y = b.y + (b.h - newBounds.h);
        } else if (dragMode.current === 'resize-ne') {
            newBounds.w = Math.max(minSize, b.w + dx);
            newBounds.h = Math.max(minSize, b.h - dy);
            newBounds.y = b.y + (b.h - newBounds.h);
        } else if (dragMode.current === 'resize-sw') {
            newBounds.w = Math.max(minSize, b.w - dx);
            newBounds.h = Math.max(minSize, b.h + dy);
            newBounds.x = b.x + (b.w - newBounds.w);
        } else if (dragMode.current === 'resize-e') {
            newBounds.w = Math.max(minSize, b.w + dx);
        } else if (dragMode.current === 'resize-s') {
            newBounds.h = Math.max(minSize, b.h + dy);
        } else if (dragMode.current === 'resize-w') {
            newBounds.w = Math.max(minSize, b.w - dx);
            newBounds.x = b.x + (b.w - newBounds.w);
        } else if (dragMode.current === 'resize-n') {
            newBounds.h = Math.max(minSize, b.h - dy);
            newBounds.y = b.y + (b.h - newBounds.h);
        } else if (dragMode.current === 'rotate') {
            if (parentRef.current) {
                const parentRect = parentRef.current.getBoundingClientRect();
                const cx = parentRect.left + b.x + b.w / 2;
                const cy = parentRect.top + b.y + b.h / 2;
                const angle = Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI;
                const startAngle = Math.atan2(dragStart.current.y - cy, dragStart.current.x - cx) * 180 / Math.PI;
                newBounds.rotation = b.rotation + (angle - startAngle);
            }
        }
        setBounds(newBounds);
    };

    const handleUp = () => {
        dragMode.current = null;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleUp);
    };
    
    useEffect(() => {
        return () => handleUp();
    }, []);

    const style = {
        position: 'absolute',
        left: bounds.x,
        top: bounds.y,
        width: bounds.w,
        height: bounds.h,
        transform: `rotate(${bounds.rotation}deg)`,
        border: '2px dashed #3b82f6',
        zIndex: 50,
        boxSizing: 'border-box'
    };

    const handleBox = "absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full z-10";

    return (
        <div style={style}>
            {/* Action Bar (doesn't rotate with the shape, or does it? If it does, icons rotate. Let's place it outside the rotation) */}
            
            {/* The Shape itself rendered via SVG (for display only) */}
            <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                {type === 'square' && (
                    <rect x={strokeWidth/2} y={strokeWidth/2} width={bounds.w - strokeWidth} height={bounds.h - strokeWidth}
                          fill="transparent" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
                )}
                {type === 'circle' && (
                    <ellipse cx={bounds.w/2} cy={bounds.h/2} rx={(bounds.w - strokeWidth)/2} ry={(bounds.h - strokeWidth)/2}
                             fill="transparent" stroke={color} strokeWidth={strokeWidth} />
                )}
                {type === 'triangle' && (
                    <polygon points={`${bounds.w/2},${strokeWidth/2} ${bounds.w - strokeWidth/2},${bounds.h - strokeWidth/2} ${strokeWidth/2},${bounds.h - strokeWidth/2}`}
                             fill="transparent" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
                )}
            </svg>

            {/* Drag Handle (Full Box Cover) */}
            <div 
                className="absolute inset-0 cursor-move" 
                onMouseDown={(e) => handleDown(e, 'move')}
                onTouchStart={(e) => handleDown(e, 'move')}
            />

            {/* Resize Handles */}
            <div className={`${handleBox} -top-2 -left-2 cursor-nwse-resize`} onMouseDown={(e)=>handleDown(e,'resize-nw')} onTouchStart={(e)=>handleDown(e,'resize-nw')} />
            <div className={`${handleBox} -top-2 -right-2 cursor-nesw-resize`} onMouseDown={(e)=>handleDown(e,'resize-ne')} onTouchStart={(e)=>handleDown(e,'resize-ne')} />
            <div className={`${handleBox} -bottom-2 -left-2 cursor-nesw-resize`} onMouseDown={(e)=>handleDown(e,'resize-sw')} onTouchStart={(e)=>handleDown(e,'resize-sw')} />
            <div className={`${handleBox} -bottom-2 -right-2 cursor-nwse-resize`} onMouseDown={(e)=>handleDown(e,'resize-se')} onTouchStart={(e)=>handleDown(e,'resize-se')} />
            
            <div className={`${handleBox} -top-2 left-1/2 -translate-x-1/2 cursor-ns-resize`} onMouseDown={(e)=>handleDown(e,'resize-n')} onTouchStart={(e)=>handleDown(e,'resize-n')} />
            <div className={`${handleBox} -bottom-2 left-1/2 -translate-x-1/2 cursor-ns-resize`} onMouseDown={(e)=>handleDown(e,'resize-s')} onTouchStart={(e)=>handleDown(e,'resize-s')} />
            <div className={`${handleBox} top-1/2 -left-2 -translate-y-1/2 cursor-ew-resize`} onMouseDown={(e)=>handleDown(e,'resize-w')} onTouchStart={(e)=>handleDown(e,'resize-w')} />
            <div className={`${handleBox} top-1/2 -right-2 -translate-y-1/2 cursor-ew-resize`} onMouseDown={(e)=>handleDown(e,'resize-e')} onTouchStart={(e)=>handleDown(e,'resize-e')} />

            {/* Rotation Handle */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-8 h-8 bg-white text-blue-500 border-2 border-blue-500 rounded-full cursor-pointer flex items-center justify-center z-10 hover:bg-blue-50"
                 onMouseDown={(e)=>handleDown(e,'rotate')} onTouchStart={(e)=>handleDown(e,'rotate')}>
                <RotateCw size={16} strokeWidth={3} />
            </div>

            {/* Connect Line to Rotator */}
            <div className="absolute -top-8 left-1/2 w-0.5 h-8 bg-blue-500 -translate-x-1/2 pointer-events-none" />

            {/* Action Buttons (Commit / Cancel) placed statically relative to the container but reversed rotation so they aren't upside down if rotated! */}
            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-2" style={{ transform: `rotate(${-bounds.rotation}deg)` }}>
                <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="w-10 h-10 bg-red-500 rounded-full text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors">
                    <X size={20} strokeWidth={3} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onCommit(bounds); }} className="w-10 h-10 bg-green-500 rounded-full text-white flex items-center justify-center shadow-md hover:bg-green-600 transition-colors">
                    <Check size={20} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}
