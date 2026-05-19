import React, { useContext } from 'react';
import { Pencil, PaintBucket, Trash2, Eraser, Square, Circle, Triangle, Undo2, Redo2 } from 'lucide-react';
import { PlayerContext } from '../context/PlayerContext';
import { useSocket } from '../context/SocketContext';

const COLORS = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF3B30', // Red
    '#FF9500', // Orange
    '#FFCC00', // Yellow
    '#4CD964', // Green
    '#5AC8FA', // Light Blue
    '#007AFF', // Blue
    '#5856D6', // Purple
    '#FF2D55', // Pink
    '#A2845E', // Brown
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

    return (
        <div className={`w-full flex flex-wrap xl:flex-row items-center justify-center xl:justify-between gap-4 p-4 lg:px-8 bg-white border-4 border-purple-800 rounded-[30px] shadow-[4px_5px_0px_#D8B4FE] shrink-0 transition-all duration-500 ease-in-out relative ${!isMyTurn ? 'opacity-50 blur-[2px] pointer-events-none select-none grayscale-[50%]' : ''}`}>

            {/* Tools Section */}
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
                {/* Pencil */}
                <button
                    onClick={() => setActiveTool('pencil')}
                    className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl border-4 transition-all hover:-translate-y-1 ${activeTool === 'pencil' ? 'bg-[#fefce8] border-purple-800 shadow-[3px_4px_0px_#FCD34D]' : 'bg-gray-100 border-gray-300'}`}
                    title="Pencil"
                >
                    <Pencil size={24} color={activeTool === 'pencil' ? '#6b21a8' : '#6b7280'} strokeWidth={2.5} />
                </button>

                {/* Fill/Bucket */}
                <button
                    onClick={() => setActiveTool('fill')}
                    className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl border-4 transition-all hover:-translate-y-1 ${activeTool === 'fill' ? 'bg-[#fefce8] border-purple-800 shadow-[3px_4px_0px_#FCD34D]' : 'bg-gray-100 border-gray-300'}`}
                    title="Fill"
                >
                    <PaintBucket size={24} color={activeTool === 'fill' ? '#6b21a8' : '#6b7280'} strokeWidth={2.5} />
                </button>

                {/* Eraser */}
                <button
                    onClick={() => setActiveTool('eraser')}
                    className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl border-4 transition-all hover:-translate-y-1 ${activeTool === 'eraser' ? 'bg-[#fefce8] border-purple-800 shadow-[3px_4px_0px_#FCD34D]' : 'bg-gray-100 border-gray-300'}`}
                    title="Eraser"
                >
                    <Eraser size={24} color={activeTool === 'eraser' ? '#6b21a8' : '#6b7280'} strokeWidth={2.5} />
                </button>

                <div className="w-0.5 h-10 bg-gray-300 mx-2 hidden md:block"></div>

                {/* Square */}
                <button
                    onClick={() => setActiveTool('square')}
                    className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl border-4 transition-all hover:-translate-y-1 ${activeTool === 'square' ? 'bg-[#fefce8] border-purple-800 shadow-[3px_4px_0px_#FCD34D]' : 'bg-gray-100 border-gray-300'}`}
                    title="Square"
                >
                    <Square size={24} color={activeTool === 'square' ? '#6b21a8' : '#6b7280'} strokeWidth={2.5} />
                </button>
                
                {/* Circle */}
                <button
                    onClick={() => setActiveTool('circle')}
                    className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl border-4 transition-all hover:-translate-y-1 ${activeTool === 'circle' ? 'bg-[#fefce8] border-purple-800 shadow-[3px_4px_0px_#FCD34D]' : 'bg-gray-100 border-gray-300'}`}
                    title="Circle"
                >
                    <Circle size={24} color={activeTool === 'circle' ? '#6b21a8' : '#6b7280'} strokeWidth={2.5} />
                </button>

                {/* Triangle */}
                <button
                    onClick={() => setActiveTool('triangle')}
                    className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl border-4 transition-all hover:-translate-y-1 ${activeTool === 'triangle' ? 'bg-[#fefce8] border-purple-800 shadow-[3px_4px_0px_#FCD34D]' : 'bg-gray-100 border-gray-300'}`}
                    title="Triangle"
                >
                    <Triangle size={24} color={activeTool === 'triangle' ? '#6b21a8' : '#6b7280'} strokeWidth={2.5} />
                </button>

                <div className="w-0.5 h-10 bg-gray-300 mx-2 hidden md:block"></div>

                {/* Brush Size */}
                <div className="flex flex-col items-center justify-center w-24 md:w-32">
                    <input
                        type="range"
                        min="1" max="50"
                        value={brushSize}
                        onChange={(e) => setBrushSize(e.target.value)}
                        className="w-full accent-purple-600 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="font-patrick text-purple-800 text-sm mt-1">Size: {brushSize}px</span>
                </div>
            </div>

            {/* Colors Section */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-75 md:max-w-none">
                {COLORS.map((color) => (
                    <button
                        key={color}
                        onClick={() => {
                            setActiveColor(color);
                            if (activeTool === 'eraser') setActiveTool('pencil');
                        }}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-4 transition-all hover:scale-110 ${activeColor === color && activeTool !== 'eraser' ? 'border-purple-800 scale-110 shadow-[2px_3px_0px_#D8B4FE]' : 'border-gray-200 shadow-sm'}`}
                        style={{ backgroundColor: color }}
                        title={color}
                    />
                ))}
            </div>

            {/* Actions Section */}
            <div className="flex items-center justify-center gap-2 md:gap-4">
                <div className="w-0.5 h-10 bg-gray-300 mx-2 hidden xl:block"></div>

                {/* Undo */}
                <button
                    onClick={handleUndo}
                    className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl border-4 border-gray-300 bg-gray-100 hover:bg-gray-200 transition-all hover:-translate-y-1 shadow-[2px_3px_0px_#D1D5DB]"
                    title="Undo"
                >
                    <Undo2 size={22} className="text-gray-700" strokeWidth={2.5} />
                </button>

                {/* Redo */}
                <button
                    onClick={handleRedo}
                    className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl border-4 border-gray-300 bg-gray-100 hover:bg-gray-200 transition-all hover:-translate-y-1 shadow-[2px_3px_0px_#D1D5DB]"
                    title="Redo"
                >
                    <Redo2 size={22} className="text-gray-700" strokeWidth={2.5} />
                </button>

                {/* Clear All */}
                <button
                    onClick={handleClear}
                    className="flex items-center justify-center gap-2 px-4 h-10 md:h-12 rounded-xl border-4 border-red-600 bg-[#ffe3e3] hover:bg-red-100 transition-all hover:-translate-y-1 shadow-[2px_3px_0px_#FFA6A6]"
                    title="Clear All"
                >
                    <Trash2 size={22} strokeWidth={2.5} className="text-red-600" />
                    <span className="font-patrick text-red-600 text-lg hidden md:block mt-1">Clear</span>
                </button>
            </div>

        </div>
    )
}

export default Tools;