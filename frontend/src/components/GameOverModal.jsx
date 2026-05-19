import React from 'react';
import { Trophy, Home, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function GameOverModal({ scoreboard }) {
    const navigate = useNavigate();
    const socket = useSocket();

    const handleReturnHome = () => {
        if (socket) socket.disconnect();
        sessionStorage.removeItem("session");
        window.location.href = '/'; // Full refresh to reset everything
    };

    if (!scoreboard || scoreboard.length === 0) return null;

    const winner = scoreboard[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-white border-4 border-purple-800 rounded-[40px] shadow-[8px_12px_0px_#D8B4FE] w-full max-w-2xl p-6 md:p-10 flex flex-col items-center relative overflow-hidden font-patrick">

                <Trophy size={80} className="text-yellow-400 mb-2 drop-shadow-md" fill="currentColor" />
                <h1 className="text-4xl md:text-5xl font-bold text-purple-900 mb-6 tracking-wide text-center">Game Over!</h1>

                <div className="bg-[#fefce8] border-4 border-yellow-400 rounded-3xl p-6 w-full mb-8 relative shadow-[4px_6px_0px_#FCD34D]">
                    <div className="absolute -top-4 -left-4 text-4xl rotate-12">🎉</div>
                    <div className="absolute -bottom-4 -right-4 text-4xl -rotate-12">🎊</div>

                    <h2 className="text-2xl font-bold text-yellow-800 text-center mb-4 uppercase tracking-widest border-b-2 border-dashed border-yellow-300 pb-2">Final Scoreboard</h2>

                    <div className="flex flex-col gap-3">
                        {scoreboard.map((player, index) => {
                            let badge = null;
                            if (index === 0) badge = <Medal size={24} className="text-yellow-500" fill="currentColor" />; // Gold
                            else if (index === 1) badge = <Medal size={24} className="text-gray-400" fill="currentColor" />; // Silver
                            else if (index === 2) badge = <Medal size={24} className="text-amber-600" fill="currentColor" />; // Bronze
                            else badge = <span className="w-6 text-center text-gray-500 font-bold">#{index + 1}</span>;

                            return (
                                <div key={player.socketId} className={`flex items-center justify-between p-3 rounded-2xl border-2 ${index === 0 ? 'bg-yellow-100 border-yellow-400 scale-[1.02]' : 'bg-white border-gray-200'} transition-transform`}>
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl shrink-0">{badge}</div>
                                        <div className="font-bold text-xl md:text-2xl text-purple-900 truncate max-w-37.5 md:max-w-75">{player.name || "Anonymous"}</div>
                                    </div>
                                    <div className="font-bold text-2xl text-purple-600 bg-purple-100 px-4 py-1 rounded-xl">{player.score} pts</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={handleReturnHome}
                    className="bg-red-500 border-4 border-red-700 text-white text-2xl font-bold rounded-full py-4 px-8 w-full max-w-sm flex items-center justify-center gap-3 shadow-[0px_6px_0px_#b91c1c] hover:-translate-y-1 hover:shadow-[0px_8px_0px_#b91c1c] active:translate-y-2 active:shadow-none transition-all"
                >
                    <Home size={28} /> Return to Home
                </button>
            </div>
        </div>
    );
}
