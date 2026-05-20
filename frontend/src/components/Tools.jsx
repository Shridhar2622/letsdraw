import React, { useContext, useEffect, useState, useRef } from 'react';
import { Pencil, PaintBucket, Trash2, Eraser, Square, Circle, Triangle, Undo2, Redo2, ChevronUp, Palette } from 'lucide-react';
import { PlayerContext } from '../context/PlayerContext';
import { useSocket } from '../context/SocketContext';

const COLORS = [
    '#000000', '#FFFFFF', '#FF3B30', '#FF9500', '#FFCC00',
    '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55', '#A2845E'
];

function Tools() {
    const socket = useSocket();
    const {
        activeTool, setActiveTool,
        activeColor, setActiveColor,
        brushSize, setBrushSize,
        roomId, currentDrawer
    } = useContext(PlayerContext);

    const isMyTurn = currentDrawer?.socketId === socket?.id;
    const [openMenu, setOpenMenu] = useState(null);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const handleClear = () => {
        if (!socket || !roomId) return;
        socket.emit("clear_canvas", { roomId });
    };

    const handleUndo = () => {
        if (!socket || !roomId || !isMyTurn) return;
        socket.emit("undo_action", { roomId });
    };

    const handleRedo = () => {
        if (!socket || !roomId || !isMyTurn) return;
        socket.emit("redo_action", { roomId });
    };

    // Keyboard Shortcuts
    useEffect(() => {
        if (!isMyTurn) return;

        const handleKeyDown = (e) => {
            if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;

            const key = e.key.toLowerCase();
            if (e.ctrlKey || e.metaKey) {
                if (key === 'z') { e.preventDefault(); handleUndo(); }
                else if (key === 'y') { e.preventDefault(); handleRedo(); }
                return;
            }

            switch (key) {
                case 'p': setActiveTool('pencil'); break;
                case 'f': setActiveTool('fill'); break;
                case 'e': setActiveTool('eraser'); break;
                case 's': setActiveTool('square'); break;
                case 'c': setActiveTool('circle'); break;
                case 't': setActiveTool('triangle'); break;
                case 'd': handleClear(); break;
                default: break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMyTurn, socket, roomId, setActiveTool]);

    const drawTools = [
        { id: 'pencil', icon: Pencil, label: 'P', color: '#6b21a8' },
        { id: 'fill', icon: PaintBucket, label: 'F', color: '#6b21a8' },
        { id: 'eraser', icon: Eraser, label: 'E', color: '#6b21a8' },
    ];

    const shapeTools = [
        { id: 'square', icon: Square, label: 'S', color: '#6b21a8' },
        { id: 'circle', icon: Circle, label: 'C', color: '#6b21a8' },
        { id: 'triangle', icon: Triangle, label: 'T', color: '#6b21a8' },
    ];

    const activeDrawTool = drawTools.find(t => t.id === activeTool) || drawTools[0];
    const activeShapeTool = shapeTools.find(t => t.id === activeTool) || shapeTools[0];
    const isShapeActive = shapeTools.some(t => t.id === activeTool);
    const isDrawActive = drawTools.some(t => t.id === activeTool);

    return (
        <div ref={menuRef} className={`w-full flex items-center justify-between gap-2 p-2 md:p-4 bg-white border-4 border-purple-800 rounded-[20px] md:rounded-[30px] shadow-[0px_4px_0px_#D8B4FE] shrink-0 transition-all duration-300 relative z-50 ${!isMyTurn ? 'opacity-50 blur-[1px] pointer-events-none grayscale-[30%]' : ''}`}>
            
            {/* Draw Tools Dropdown */}
            <div className="relative">
                <button 
                    onClick={() => setOpenMenu(openMenu === 'draw' ? null : 'draw')}
                    className={`relative flex items-center justify-center w-12 h-12 rounded-xl border-2 md:border-4 transition-all ${isDrawActive ? 'bg-[#fefce8] border-purple-800 shadow-[2px_2px_0px_#FCD34D]' : 'bg-gray-100 border-gray-300'}`}
                >
                    <activeDrawTool.icon size={22} color={isDrawActive ? activeDrawTool.color : '#6b7280'} strokeWidth={2.5} />
                    <ChevronUp size={12} className="absolute -top-2 bg-white rounded-full border border-gray-300 text-gray-500" />
                    <span className="absolute bottom-0 right-1 text-[9px] font-black text-gray-400">{activeDrawTool.label}</span>
                </button>

                {openMenu === 'draw' && (
                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-white border-4 border-purple-800 rounded-2xl flex flex-col gap-2 shadow-xl animate-in slide-in-from-bottom-2">
                        {drawTools.map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => { setActiveTool(tool.id); setOpenMenu(null); }}
                                className={`relative flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all hover:bg-yellow-50 ${activeTool === tool.id ? 'bg-[#fefce8] border-purple-800' : 'bg-gray-50 border-gray-200'}`}
                            >
                                <tool.icon size={20} color={activeTool === tool.id ? tool.color : '#6b7280'} />
                                <span className="absolute bottom-0 right-0.5 text-[8px] font-black text-gray-400">{tool.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Shapes Dropdown */}
            <div className="relative">
                <button 
                    onClick={() => setOpenMenu(openMenu === 'shape' ? null : 'shape')}
                    className={`relative flex items-center justify-center w-12 h-12 rounded-xl border-2 md:border-4 transition-all ${isShapeActive ? 'bg-[#fefce8] border-purple-800 shadow-[2px_2px_0px_#FCD34D]' : 'bg-gray-100 border-gray-300'}`}
                >
                    <activeShapeTool.icon size={22} color={isShapeActive ? activeShapeTool.color : '#6b7280'} strokeWidth={2.5} />
                    <ChevronUp size={12} className="absolute -top-2 bg-white rounded-full border border-gray-300 text-gray-500" />
                    <span className="absolute bottom-0 right-1 text-[9px] font-black text-gray-400">{activeShapeTool.label}</span>
                </button>

                {openMenu === 'shape' && (
                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-white border-4 border-purple-800 rounded-2xl flex flex-col gap-2 shadow-xl animate-in slide-in-from-bottom-2">
                        {shapeTools.map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => { setActiveTool(tool.id); setOpenMenu(null); }}
                                className={`relative flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all hover:bg-yellow-50 ${activeTool === tool.id ? 'bg-[#fefce8] border-purple-800' : 'bg-gray-50 border-gray-200'}`}
                            >
                                <tool.icon size={20} color={activeTool === tool.id ? tool.color : '#6b7280'} />
                                <span className="absolute bottom-0 right-0.5 text-[8px] font-black text-gray-400">{tool.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Color Picker Dropdown */}
            <div className="relative">
                <button 
                    onClick={() => setOpenMenu(openMenu === 'color' ? null : 'color')}
                    className="relative flex items-center justify-center w-12 h-12 rounded-xl border-2 md:border-4 border-gray-300 bg-gray-100 transition-all hover:bg-gray-200"
                >
                    <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: activeColor }}></div>
                    <ChevronUp size={12} className="absolute -top-2 bg-white rounded-full border border-gray-300 text-gray-500" />
                </button>

                {openMenu === 'color' && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-white border-4 border-purple-800 rounded-2xl flex flex-wrap w-[180px] justify-center gap-2 shadow-xl animate-in slide-in-from-bottom-2">
                        {COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => {
                                    setActiveColor(color);
                                    if (activeTool === 'eraser') setActiveTool('pencil');
                                    setOpenMenu(null);
                                }}
                                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${activeColor === color && activeTool !== 'eraser' ? 'border-purple-800 scale-110 shadow-sm' : 'border-gray-200'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Brush Size (Compact Slider) */}
            <div className="flex flex-col items-center justify-center w-16 md:w-24 hidden sm:flex">
                <input
                    type="range" min="1" max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(e.target.value)}
                    className="w-full accent-purple-600 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="font-patrick text-purple-800 text-[10px] md:text-sm mt-1">{brushSize}px</span>
            </div>

            <div className="w-[2px] h-8 bg-gray-200 rounded-full mx-1 hidden sm:block"></div>

            {/* Actions (Undo/Redo/Clear) */}
            <div className="flex items-center gap-1 md:gap-2">
                <button onClick={handleUndo} className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl border-2 md:border-4 border-gray-300 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95" title="Undo (Ctrl+Z)">
                    <Undo2 size={20} className="text-gray-700" strokeWidth={2.5} />
                </button>
                <button onClick={handleRedo} className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl border-2 md:border-4 border-gray-300 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95" title="Redo (Ctrl+Y)">
                    <Redo2 size={20} className="text-gray-700" strokeWidth={2.5} />
                </button>
                <button onClick={handleClear} className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl border-2 md:border-4 border-red-500 bg-[#ffe3e3] hover:bg-red-100 transition-all active:scale-95" title="Clear (D)">
                    <Trash2 size={20} strokeWidth={2.5} className="text-red-600" />
                    <span className="absolute bottom-0 right-1 text-[8px] font-black text-red-400">D</span>
                </button>
            </div>
        </div>
    );
}

export default Tools;