import React from 'react';
import { Trophy, Home, Medal, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { PlayerContext } from '../context/PlayerContext';

import { AVATAR_MAP } from '../utils/avatars';

export default function GameOverModal({ scoreboard }) {
    const navigate = useNavigate();
    const socket = useSocket();
    const { roomId } = React.useContext(PlayerContext);

    const handlePlayAgain = () => {
        if (socket) {
            socket.emit("restart_game", { roomId });
        }
    };

    const handleReturnHome = () => {
        if (socket) socket.disconnect();
        sessionStorage.removeItem("session");
        window.location.href = '/'; 
    };

    if (!scoreboard || scoreboard.length === 0) return null;

    const winner = scoreboard[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FDF5E6] p-4 animate-in fade-in duration-300">
            {/* Background animals peeking in */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {/* Left Side */}
                <div className="absolute top-[15%] left-[5%] md:top-[10%] md:left-[15%] animate-[float_6s_ease-in-out_infinite]">
                    <img src={AVATAR_MAP.puppy} alt="Puppy" className="w-24 md:w-40 drop-shadow-xl rotate-[20deg]" />
                    <Star className="absolute -top-4 -left-6 text-pink-400 w-6 h-6 fill-current animate-pulse" />
                </div>
                <div className="absolute top-[45%] left-[0%] md:top-[40%] md:left-[10%] animate-[float_5s_ease-in-out_infinite_1s]">
                    <img src={AVATAR_MAP.penguin} alt="Penguin" className="w-28 md:w-48 drop-shadow-xl rotate-12" />
                </div>
                <div className="absolute bottom-[10%] left-[8%] md:bottom-[15%] md:left-[20%] animate-[float_7s_ease-in-out_infinite]">
                    <img src={AVATAR_MAP.frog} alt="Frog" className="w-20 md:w-32 drop-shadow-xl -rotate-6" />
                </div>

                {/* Right Side */}
                <div className="absolute top-[10%] right-[5%] md:top-[8%] md:right-[15%] animate-[float_7s_ease-in-out_infinite_reverse]">
                    <img src={AVATAR_MAP.panda} alt="Panda" className="w-28 md:w-44 drop-shadow-xl -rotate-[20deg]" />
                    <div className="absolute -top-6 -right-2 text-pink-400 text-2xl animate-bounce">💖</div>
                </div>
                <div className="absolute top-[45%] right-[0%] md:top-[40%] md:right-[10%] animate-[float_5.5s_ease-in-out_infinite_reverse]">
                    <img src={AVATAR_MAP.cat} alt="Cat" className="w-28 md:w-44 drop-shadow-xl -rotate-12" />
                </div>
                <div className="absolute bottom-[5%] right-[5%] md:bottom-[10%] md:right-[15%] animate-[float_6.5s_ease-in-out_infinite_1s]">
                    <img src={AVATAR_MAP.bear} alt="Bear" className="w-28 md:w-44 drop-shadow-xl rotate-6" />
                </div>
                
                {/* Decor */}
                <Star className="absolute top-[20%] left-[30%] text-yellow-300 w-6 h-6 fill-current opacity-60" />
                <Star className="absolute top-[30%] right-[30%] text-pink-300 w-5 h-5 fill-current opacity-60" />
            </div>

            {/* Main Modal Card */}
            <div className="bg-white border-2 md:border-4 border-purple-200 rounded-[2rem] md:rounded-[3rem] shadow-xl w-full max-w-2xl p-6 md:p-10 flex flex-col items-center relative z-10 font-patrick transform transition-all">
                
                <Trophy size={80} className="text-yellow-400 mb-2 drop-shadow-md animate-bounce" fill="currentColor" />
                
                <div className="relative mb-2">
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-40 h-4 bg-pink-300/50 -rotate-2 z-0"></div>
                    <h1 className="text-4xl md:text-6xl font-black text-purple-900 tracking-wide text-center uppercase relative z-10">GAME OVER!</h1>
                </div>
                
                <p className="text-gray-500 font-bold text-lg md:text-xl mb-6">Great try! Better luck next time!</p>

                {/* Scoreboard Area */}
                <div className="w-full relative mb-8">
                    {/* Title Banner */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-400 text-white font-bold px-6 py-1 rounded-full text-sm tracking-wider uppercase z-10">
                        Final Scoreboard
                    </div>
                    
                    <div className="border border-purple-200 border-dashed rounded-3xl p-6 pt-8 w-full">
                        <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                            {scoreboard.map((player, index) => {
                                let badge = null;
                                if (index === 0) badge = <Medal size={28} className="text-yellow-500" fill="currentColor" />; 
                                else if (index === 1) badge = <Medal size={28} className="text-gray-400" fill="currentColor" />; 
                                else if (index === 2) badge = <Medal size={28} className="text-amber-600" fill="currentColor" />; 
                                else badge = <span className="w-7 text-center text-gray-500 font-bold text-lg">#{index + 1}</span>;

                                return (
                                    <div key={player.socketId} className={`flex items-center justify-between p-3 rounded-[1.5rem] border ${index === 0 ? 'bg-white border-yellow-400 shadow-sm' : 'bg-white border-purple-100'} transition-transform`}>
                                        <div className="flex items-center gap-3">
                                            <div className="shrink-0 flex items-center justify-center w-8">
                                                {index === 0 ? (
                                                    <div className="bg-yellow-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg border-2 border-yellow-500 shadow-sm">1</div>
                                                ) : badge}
                                            </div>
                                            <div className="w-10 h-10 bg-white rounded-full border border-purple-200 p-0.5 shrink-0 overflow-hidden shadow-sm">
                                                {player.avatar && AVATAR_MAP[player.avatar] ? (
                                                    <img src={AVATAR_MAP[player.avatar]} alt={player.name} className="w-full h-full object-contain" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 rounded-full"></div>
                                                )}
                                            </div>
                                            <div className="font-bold text-lg md:text-xl text-purple-900 truncate max-w-[140px] md:max-w-[200px]">{player.name || "Anonymous"}</div>
                                        </div>
                                        <div className="font-bold text-sm md:text-base text-white bg-purple-500 border border-purple-600 px-4 py-1.5 rounded-full">{player.score} pts</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full max-w-md justify-center mt-4">
                    <button
                        onClick={handlePlayAgain}
                        className="bg-[#10B981] border-b-4 border-[#047857] text-white text-xl md:text-2xl font-bold rounded-full py-3 px-6 flex-1 flex items-center justify-center gap-2 hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all shadow-sm"
                    >
                        🎮 Play Again
                    </button>
                    <button
                        onClick={handleReturnHome}
                        className="bg-[#EF4444] border-b-4 border-[#B91C1C] text-white text-xl md:text-2xl font-bold rounded-full py-3 px-6 flex-1 flex items-center justify-center gap-2 hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all shadow-sm"
                    >
                        <Home size={24} /> Home
                    </button>
                </div>
            </div>
        </div>
    );
}
