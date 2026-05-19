import React, { useRef, useEffect, useState, useContext } from 'react';
import { useSocket } from '../context/SocketContext';
import { PlayerContext } from '../context/PlayerContext';
import ShapeOverlay from './ShapeOverlay';

const hexToRgba = (hex) => {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return [(c>>16)&255, (c>>8)&255, c&255, 255];
    }
    return [0,0,0,255];
};

const executeFloodFill = (ctx, startX, startY, fillColor) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    startX = Math.floor(startX);
    startY = Math.floor(startY);
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

    const colorData = ctx.getImageData(0, 0, width, height);
    const data = colorData.data;

    const startPos = (startY * width + startX) * 4;
    const startR = data[startPos];
    const startG = data[startPos+1];
    const startB = data[startPos+2];
    const startA = data[startPos+3];

    const fillRgba = hexToRgba(fillColor);
    const fillR = fillRgba[0];
    const fillG = fillRgba[1];
    const fillB = fillRgba[2];
    const fillA = fillRgba[3];

    // Increase tolerance slightly for anti-aliasing support
    const TOLERANCE = 32;

    if (Math.abs(startR - fillR) <= TOLERANCE &&
        Math.abs(startG - fillG) <= TOLERANCE &&
        Math.abs(startB - fillB) <= TOLERANCE &&
        Math.abs(startA - fillA) <= TOLERANCE) {
        return;
    }

    const matchStartColor = (pos) => {
        return Math.abs(data[pos] - startR) <= TOLERANCE &&
               Math.abs(data[pos+1] - startG) <= TOLERANCE &&
               Math.abs(data[pos+2] - startB) <= TOLERANCE &&
               Math.abs(data[pos+3] - startA) <= TOLERANCE;
    };

    const colorPixel = (pos) => {
        data[pos] = fillR;
        data[pos+1] = fillG;
        data[pos+2] = fillB;
        data[pos+3] = fillA;
    };

    const stack = [[startX, startY]];
    
    while(stack.length) {
        let [x, y] = stack.pop();
        let pixelPos = (y * width + x) * 4;
        
        while (y > 0 && matchStartColor(pixelPos - width * 4)) {
            y--;
            pixelPos -= width * 4;
        }

        let reachLeft = false;
        let reachRight = false;
        
        while (y < height && matchStartColor(pixelPos)) {
            colorPixel(pixelPos);
            
            if (x > 0) {
                if (matchStartColor(pixelPos - 4)) {
                    if (!reachLeft) {
                        stack.push([x - 1, y]);
                        reachLeft = true;
                    }
                } else if (reachLeft) {
                    reachLeft = false;
                }
            }
            
            if (x < width - 1) {
                if (matchStartColor(pixelPos + 4)) {
                    if (!reachRight) {
                        stack.push([x + 1, y]);
                        reachRight = true;
                    }
                } else if (reachRight) {
                    reachRight = false;
                }
            }
            
            y++;
            pixelPos += width * 4;
        }
    }
    
    ctx.putImageData(colorData, 0, 0);
};

export default function CanvasBoard() {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [draftShape, setDraftShape] = useState(null);

    const socket = useSocket();
    const {
        roomId,
        currentDrawer,
        activeTool,
        activeColor,
        brushSize
    } = useContext(PlayerContext);

    const isMyTurn = currentDrawer?.socketId === socket?.id;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Make canvas visually fill the container
        const parent = canvas.parentElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        // Only set internal coordinate system ONCE on mount or resize
        const setCanvasDimensions = () => {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        };

        // Initial set
        setCanvasDimensions();

        const context = canvas.getContext("2d");
        context.lineCap = "round";
        context.lineJoin = "round";
        // White background by default
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        contextRef.current = context;

        // Handle resize gracefully
        const resizeListener = () => {
            // Re-evaluating dimensions clears canvas, so a real app would save/restore ImageData.
            // For now, simple resize support.
            const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
            setCanvasDimensions();
            // Restore context settings
            context.lineCap = "round";
            context.lineJoin = "round";
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.putImageData(imgData, 0, 0);
        };

        window.addEventListener('resize', resizeListener);
        return () => window.removeEventListener('resize', resizeListener);
    }, []);

    // Listen to socket draw events
    useEffect(() => {
        if (!socket) return;

        const handleDraw = (data) => {
            const canvas = canvasRef.current;
            const ctx = contextRef.current;
            if (!canvas || !ctx) return;

            // Convert relative coordinates back to absolute based on current dimensions
            const absX0 = data.x0 * canvas.width;
            const absY0 = data.y0 * canvas.height;
            const absX1 = data.x1 * canvas.width;
            const absY1 = data.y1 * canvas.height;

            ctx.lineWidth = data.thickness;
            ctx.strokeStyle = data.color;

            ctx.moveTo(absX0, absY0);
            ctx.lineTo(absX1, absY1);
            ctx.stroke();
            ctx.closePath();
        };

        const drawShapeToCtx = (ctx, canvas, type, relBounds, color, thickness) => {
            const absBounds = {
                x: relBounds.x * canvas.width,
                y: relBounds.y * canvas.height,
                w: relBounds.w * canvas.width,
                h: relBounds.h * canvas.height,
                rotation: relBounds.rotation
            };
            
            ctx.save();
            const cx = absBounds.x + absBounds.w / 2;
            const cy = absBounds.y + absBounds.h / 2;
            
            ctx.translate(cx, cy);
            ctx.rotate((absBounds.rotation * Math.PI) / 180);
            
            ctx.lineWidth = thickness;
            ctx.strokeStyle = color;
            ctx.beginPath();
            
            const hw = absBounds.w / 2;
            const hh = absBounds.h / 2;
            
            if (type === 'square') {
                ctx.rect(-hw + thickness/2, -hh + thickness/2, absBounds.w - thickness, absBounds.h - thickness);
            } else if (type === 'circle') {
                ctx.ellipse(0, 0, Math.max(0, hw - thickness/2), Math.max(0, hh - thickness/2), 0, 0, 2 * Math.PI);
            } else if (type === 'triangle') {
                ctx.moveTo(0, -hh + thickness/2);
                ctx.lineTo(hw - thickness/2, hh - thickness/2);
                ctx.lineTo(-hw + thickness/2, hh - thickness/2);
                ctx.closePath();
            }
            
            ctx.stroke();
            ctx.restore();
        };

        const handleShape = (data) => {
            const canvas = canvasRef.current;
            const ctx = contextRef.current;
            if (!canvas || !ctx) return;
            drawShapeToCtx(ctx, canvas, data.shapeType, data.bounds, data.color, data.thickness);
        };

        const handleClear = () => {
            const canvas = canvasRef.current;
            const ctx = contextRef.current;
            if (!canvas || !ctx) return;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        const handleFill = (data) => {
            const canvas = canvasRef.current;
            const ctx = contextRef.current;
            if (!canvas || !ctx) return;
            if (data.x !== undefined && data.y !== undefined) {
                executeFloodFill(ctx, data.x * canvas.width, data.y * canvas.height, data.color);
            } else {
                ctx.fillStyle = data.color;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        };

        const handleHistory = (history) => {
            const canvas = canvasRef.current;
            const ctx = contextRef.current;
            if (!canvas || !ctx || !history || !Array.isArray(history)) return;
            
            // Clear canvas before re-drawing history (crucial for Undo/Redo)
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            history.forEach(data => {
                if (data.type === 'fill') {
                    if (data.x !== undefined && data.y !== undefined) {
                        executeFloodFill(ctx, data.x * canvas.width, data.y * canvas.height, data.color);
                    } else {
                        ctx.fillStyle = data.color;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                } else if (data.type === 'draw') {
                    const absX0 = data.x0 * canvas.width;
                    const absY0 = data.y0 * canvas.height;
                    const absX1 = data.x1 * canvas.width;
                    const absY1 = data.y1 * canvas.height;

                    ctx.lineWidth = data.thickness;
                    ctx.strokeStyle = data.color;

                    ctx.beginPath();
                    ctx.moveTo(absX0, absY0);
                    ctx.lineTo(absX1, absY1);
                    ctx.stroke();
                    ctx.closePath();
                } else if (data.type === 'shape') {
                    drawShapeToCtx(ctx, canvas, data.shapeType, data.bounds, data.color, data.thickness);
                }
            });
        };

        socket.on("draw_update", handleDraw);
        socket.on("receive_shape", handleShape);
        socket.on("canvas_cleared", handleClear);
        socket.on("fill_canvas", handleFill);
        socket.on("draw_history", handleHistory);

        return () => {
            socket.off("draw_update", handleDraw);
            socket.off("receive_shape", handleShape);
            socket.off("canvas_cleared", handleClear);
            socket.off("fill_canvas", handleFill);
            socket.off("draw_history", handleHistory);
        };
    }, [socket]);

    const currentStrokeId = useRef(null);

    const drawLine = (x0, y0, x1, y1, color, thickness, emit) => {
        const ctx = contextRef.current;
        if (!ctx) return;

        ctx.lineWidth = thickness;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.closePath();

        if (!emit || !socket || !roomId) return;

        const canvas = canvasRef.current;
        socket.emit("draw", {
            roomId,
            strokeId: currentStrokeId.current,
            x0: x0 / canvas.width,
            y0: y0 / canvas.height,
            x1: x1 / canvas.width,
            y1: y1 / canvas.height,
            color,
            thickness
        });
    };

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Calculate scaling factors in case internal resolution differs from display size
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    // Tracking previous pos for continuous line drawing
    const lastPos = useRef({ x: 0, y: 0 });

    const startDrawing = (e) => {
        if (!isMyTurn) return;
        setIsDrawing(true);
        currentStrokeId.current = Date.now().toString() + Math.random().toString(36).substring(2, 7);

        if (activeTool === 'fill') {
            const pos = getMousePos(e);
            const canvas = canvasRef.current;
            if (socket && roomId) {
                socket.emit("fill_canvas", { 
                    roomId, 
                    color: activeColor,
                    x: pos.x / canvas.width,
                    y: pos.y / canvas.height
                });
            }
            setIsDrawing(false); // don't continue drawing
            return;
        }

        if (['square', 'circle', 'triangle'].includes(activeTool)) {
            if (!draftShape) {
                const pos = getMousePos(e);
                setDraftShape({ type: activeTool, pos });
            }
            return;
        }

        const pos = getMousePos(e);
        lastPos.current = pos;

        // Draw a single dot immediately
        const color = activeTool === 'eraser' ? '#ffffff' : activeColor;
        drawLine(pos.x, pos.y, pos.x, pos.y, color, brushSize, true);
    };

    const finishDrawing = () => {
        setIsDrawing(false);
    };

    const draw = (e) => {
        if (!isDrawing || !isMyTurn) return;

        // Prevent scrolling on touch devices while drawing
        if (e.cancelable) e.preventDefault();

        const pos = getMousePos(e);
        const color = activeTool === 'eraser' ? '#ffffff' : activeColor;

        drawLine(lastPos.current.x, lastPos.current.y, pos.x, pos.y, color, brushSize, true);
        lastPos.current = pos;
    };

    const commitShape = (type, bounds) => {
        setDraftShape(null);
        if (!contextRef.current || !canvasRef.current) return;
        const ctx = contextRef.current;
        const canvas = canvasRef.current;

        // Render to local context
        ctx.save();
        const cx = bounds.x + bounds.w / 2;
        const cy = bounds.y + bounds.h / 2;
        
        ctx.translate(cx, cy);
        ctx.rotate((bounds.rotation * Math.PI) / 180);
        
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = activeColor;
        ctx.beginPath();
        
        const hw = bounds.w / 2;
        const hh = bounds.h / 2;
        
        if (type === 'square') {
            ctx.rect(-hw + brushSize/2, -hh + brushSize/2, bounds.w - brushSize, bounds.h - brushSize);
        } else if (type === 'circle') {
            ctx.ellipse(0, 0, Math.max(0, hw - brushSize/2), Math.max(0, hh - brushSize/2), 0, 0, 2 * Math.PI);
        } else if (type === 'triangle') {
            ctx.moveTo(0, -hh + brushSize/2);
            ctx.lineTo(hw - brushSize/2, hh - brushSize/2);
            ctx.lineTo(-hw + brushSize/2, hh - brushSize/2);
            ctx.closePath();
        }
        
        ctx.stroke();
        ctx.restore();

        // Emit socket event
        if (socket && roomId) {
            socket.emit("draw_shape", {
                roomId,
                shapeType: type,
                bounds: {
                    x: bounds.x / canvas.width,
                    y: bounds.y / canvas.height,
                    w: bounds.w / canvas.width,
                    h: bounds.h / canvas.height,
                    rotation: bounds.rotation
                },
                color: activeColor,
                thickness: brushSize
            });
        }
    };

    return (
        <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseOut={finishDrawing}
                onMouseMove={draw}
                onTouchStart={startDrawing}
                onTouchEnd={finishDrawing}
                onTouchCancel={finishDrawing}
                onTouchMove={draw}
                className={`w-full h-full rounded-3xl ${isMyTurn ? (['square','circle','triangle'].includes(activeTool) ? 'cursor-crosshair' : (activeTool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair')) : 'cursor-default pointer-events-none'}`}
                style={{ touchAction: 'none' }} // Crucial for mobile drawing
            />
            {draftShape && isMyTurn && (
                <ShapeOverlay 
                    initialPos={draftShape.pos} 
                    type={draftShape.type} 
                    color={activeColor} 
                    strokeWidth={brushSize} 
                    parentRef={containerRef}
                    onCommit={(bounds) => commitShape(draftShape.type, bounds)}
                    onCancel={() => setDraftShape(null)} 
                />
            )}
        </div>
    );
}
