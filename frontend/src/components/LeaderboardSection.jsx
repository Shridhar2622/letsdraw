import React, { useState, useEffect } from 'react';
import { Crown, Star } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function LeaderboardSection() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${BACKEND_URL}/api/leaderboard`)
            .then(r => r.json())
            .then(data => { setLeaderboard(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (!loading && leaderboard.length === 0) return null;

    return (
        <div className="w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[65vw] xl:w-[50vw] mt-4 font-patrick">
            <div className="w-full bg-white border-4 border-yellow-500 rounded-[30px] p-4 shadow-[6px_8px_0px_#EAB308] relative">
                
                <h2 className="flex items-center justify-center gap-2 text-2xl font-black text-yellow-600 mb-4 uppercase tracking-wider">
                    <Crown className="text-yellow-400 fill-current" size={28} />
                    Global Leaderboard
                    <Crown className="text-yellow-400 fill-current" size={28} />
                </h2>

                {loading ? (
                    <div className="text-center text-yellow-500 font-bold animate-pulse py-4">Loading top players...</div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {leaderboard.map((player, index) => (
                            <div 
                                key={player._id} 
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${
                                    index === 0 ? 'bg-yellow-50 border-yellow-300' : 
                                    index === 1 ? 'bg-slate-50 border-slate-300' :
                                    index === 2 ? 'bg-orange-50 border-orange-300' :
                                    'bg-gray-50 border-gray-100'
                                }`}
                            >
                                <span className="font-black text-lg w-6 text-center opacity-70">
                                    #{index + 1}
                                </span>
                                <span className="font-bold text-lg flex-1 truncate text-gray-800">
                                    {player.username}
                                </span>
                                <div className="flex items-center gap-4 text-sm font-bold text-gray-500 text-right">
                                    <span>{player.gamesWon} <span className="text-xs font-normal">Wins</span></span>
                                    <span className="text-yellow-600 font-black text-lg w-20">
                                        {player.totalScore} <span className="text-xs font-bold text-yellow-500">pts</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
