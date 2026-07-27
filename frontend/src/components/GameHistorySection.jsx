import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Swords, ChevronDown, ChevronUp, Medal } from 'lucide-react';
import { AVATAR_MAP } from '../utils/avatars';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function getMedalColor(index) {
    if (index === 0) return 'text-yellow-400';
    if (index === 1) return 'text-slate-400';
    if (index === 2) return 'text-orange-400';
    return 'text-purple-300';
}

function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function GameHistorySection() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedGame, setExpandedGame] = useState(null);

    useEffect(() => {
        fetch(`${BACKEND_URL}/api/game-history`)
            .then(r => r.json())
            .then(data => { setHistory(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="w-full mt-4 font-patrick bg-white border-4 border-purple-200 rounded-2xl p-6 text-center text-purple-400 font-bold text-lg animate-pulse">
                Loading history...
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="w-full mt-4 font-patrick bg-white border-4 border-purple-200 rounded-2xl p-8 text-center text-purple-500 font-bold text-xl">
                No recent games found. Go play a match!
            </div>
        );
    }

    return (
        <div className="w-full mt-4 font-patrick flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-purple-900 mb-2 flex items-center gap-2">
                <Trophy className="text-yellow-400 w-8 h-8" fill="currentColor" />
                Recent Games
                <span className="bg-purple-100 text-purple-600 text-sm px-3 py-1 rounded-full border border-purple-200">{history.length}</span>
            </h2>

            {history.map((game, gi) => {
                const isExpanded = expandedGame === gi;
                const winner = game.scoreboard?.[0];
                return (
                    <div
                        key={game._id || gi}
                        className="bg-white border-4 border-purple-200 rounded-2xl shadow-[3px_4px_0px_#E9D5FF] overflow-hidden transition-all"
                    >
                        {/* Game Header Row */}
                        <button
                            className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-purple-50 transition-colors text-left"
                            onClick={() => setExpandedGame(isExpanded ? null : gi)}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Winner Avatar */}
                                {winner && AVATAR_MAP[winner.avatar] && (
                                    <img src={AVATAR_MAP[winner.avatar]} alt={winner.name} className="w-10 h-10 rounded-full border-2 border-yellow-400 shrink-0" />
                                )}
                                <div className="min-w-0">
                                    <p className="font-bold text-purple-900 text-base leading-tight truncate">
                                        🏆 {winner?.name ?? 'Unknown'} <span className="text-yellow-500">({winner?.score ?? 0} pts)</span>
                                    </p>
                                    <p className="text-xs text-purple-400 truncate">Room: {game.roomId}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0 text-purple-500 text-sm">
                                <span className="flex items-center gap-1">
                                    <Swords size={14} /> {game.settings?.maxRounds ?? '?'} rounds
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock size={14} /> {formatDate(game.timestamp)}
                                </span>
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                        </button>

                        {/* Scoreboard */}
                        {isExpanded && (
                            <div className="border-t-2 border-purple-100 px-5 py-4">
                                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">Final Scoreboard</p>
                                <div className="flex flex-col gap-2">
                                    {(game.scoreboard || []).map((player, pi) => (
                                        <div key={pi} className="flex items-center gap-3 bg-purple-50 rounded-xl px-4 py-2">
                                            <Medal className={`w-5 h-5 shrink-0 ${getMedalColor(pi)}`} fill="currentColor" />
                                            {AVATAR_MAP[player.avatar] && (
                                                <img src={AVATAR_MAP[player.avatar]} alt={player.name} className="w-8 h-8 rounded-full border-2 border-purple-200 shrink-0" />
                                            )}
                                            <span className="font-bold text-purple-900 flex-1 text-sm truncate">{player.name}</span>
                                            <span className="font-black text-purple-700 text-base">{player.score} <span className="text-xs font-bold text-purple-400">pts</span></span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-purple-300 mt-3 text-right">
                                    Difficulty: <strong className="text-purple-400 capitalize">{game.settings?.difficulty ?? 'mixed'}</strong> · Draw time: <strong className="text-purple-400">{game.settings?.drawTime}s</strong>
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
