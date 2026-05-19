import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, Hash, Play, Copy, Check, Star } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { PlayerContext } from '../context/PlayerContext';

import PandaAvatar from '../assets/Profile/PANDA.png';
import RabbitAvatar from '../assets/Profile/RABBIT.png';
import BearAvatar from '../assets/Profile/bear.png';
import FoxAvtar from '../assets/Profile/fox.png';
import FrogAvtar from '../assets/Profile/frog.png';
import PenguinAvatar from '../assets/Profile/penguin.png';
import PuppyAvatar from '../assets/Profile/puppy.png';
import CatAvatar from '../assets/Profile/cat.png';

const AVATAR_MAP = {
  panda: PandaAvatar,
  rabbit: RabbitAvatar,
  bear: BearAvatar,
  fox: FoxAvtar,
  frog: FrogAvtar,
  penguin: PenguinAvatar,
  puppy: PuppyAvatar,
  cat: CatAvatar
};

export default function CreateGame() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { roomId, setRoomId, currentWord, setCurrentWord, PlayerName, setPlayerList, gameSettings: settings, setGameSettings: setSettings } = useContext(PlayerContext);
  const [players, setPlayers] = useState([]);
  const [copied, setCopied] = useState(false);

  // Check if I am the host
  const isHost = players.length > 0 && players[0].socketId === socket?.id;

  useEffect(() => {
    if (!socket || !roomId) {
      navigate('/');
      return;
    }

    // Fetch initial room info
    socket.emit("get_room_info", { roomId });

    const handleRoomInfo = (data) => {
      setPlayers(data.players);
      setPlayerList(data.players);
      if (data.settings) setSettings(data.settings);
    };

    const handlePlayerJoined = (data) => {
      setPlayers(data.players);
      setPlayerList(data.players);
    };

    const handlePlayerLeft = (data) => {
      setPlayers(data.players);
      setPlayerList(data.players);
    };

    const handleSettingsUpdated = (data) => {
      setSettings(data.settings);
    };

    const handleGameStarted = (data) => {
      navigate("/game");
    };

    socket.on("room_info", handleRoomInfo);
    socket.on("player_joined", handlePlayerJoined);
    socket.on("player_left", handlePlayerLeft);
    socket.on("settings_updated", handleSettingsUpdated);
    socket.on("word_to_draw", (data) => {
      setCurrentWord(data.word);
    })
    socket.on("game_started", handleGameStarted);

    return () => {
      socket.off("room_info", handleRoomInfo);
      socket.off("player_joined", handlePlayerJoined);
      socket.off("player_left", handlePlayerLeft);
      socket.off("settings_updated", handleSettingsUpdated);
      socket.off("word_to_draw")
      socket.off("game_started", handleGameStarted);
    };
  }, [socket, roomId, navigate]);

  const handleSettingChange = (key, value) => {
    if (!isHost) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    socket.emit("update_settings", { roomId, settings: newSettings });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = () => {
    if (!isHost) return;
    if (players.length < 2) {
      alert("Need at least 2 players to start! (Invite someone to join)");
      // Note: For now, I will not block it hard so the user can test solo if they want to.
    }
    socket.emit("start_game", { roomId });
  };

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[#fefce8] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[20px_20px] flex items-center justify-center p-4 md:p-8 font-patrick">

      {/* Background floating decor */}
      <Star className="absolute top-10 left-10 text-yellow-300 w-12 h-12 opacity-60 animate-pulse -rotate-12" fill="currentColor" />
      <div className="absolute top-20 right-20 w-32 h-32 bg-purple-200/40 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 left-32 w-40 h-40 bg-pink-200/40 rounded-full blur-2xl"></div>

      <div className="w-full max-w-6xl bg-white border-4 border-purple-800 rounded-[40px] md:rounded-[50px] shadow-[8px_12px_0px_#D8B4FE] md:shadow-[12px_16px_0px_#D8B4FE] p-6 text-2xl md:p-10 flex flex-col lg:flex-row gap-8 relative z-10 transition-all">

        {/* 📌 Left Panel - Settings & Room Code */}
        <div className="flex-1 flex flex-col gap-6 lg:gap-8">

          {/* 🏠 Header / Room Code Box */}
          <div className="bg-linear-to-br from-yellow-100 to-yellow-200 border-4 border-yellow-500 rounded-[30px] p-6 md:p-8 text-center relative shadow-[6px_8px_0px_#FCD34D] transform -rotate-1 transition-transform hover:rotate-0 hover:-translate-y-1">
            {/* Washi Tape */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-red-400/60 -rotate-2 backdrop-blur-sm"></div>
            <h2 className="text-xl md:text-2xl font-bold text-yellow-900 mb-2 uppercase tracking-widest opacity-80">Room Code</h2>
            <div className="flex items-center justify-center gap-4">
              <span className="text-5xl md:text-7xl font-black text-purple-900 tracking-[0.2em] leading-none drop-shadow-sm">{roomId}</span>
              <button
                onClick={copyRoomId}
                className="group bg-white border-4 border-yellow-500 p-3 md:p-4 rounded-2xl hover:bg-yellow-50 transition-all shadow-[2px_3px_0px_#D97706] hover:shadow-[4px_5px_0px_#D97706] hover:-translate-y-1 active:translate-y-1 active:shadow-none"
                title="Copy Room ID"
              >
                {copied ? <Check className="text-green-500 w-6 h-6 md:w-8 md:h-8 animate-bounce" strokeWidth={3} /> : <Copy className="text-yellow-700 w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform" strokeWidth={3} />}
              </button>
            </div>
          </div>

          {/* ⚙️ Settings Box */}
          <div className="bg-[#f3e8ff] border-4 border-purple-300 rounded-[30px] p-6 md:p-8 flex-1 shadow-[6px_8px_0px_#E9D5FF] relative rotate-1">
            <h2 className="text-2xl md:text-3xl font-bold text-purple-900 mb-6 flex items-center gap-3">
              <Star className="text-yellow-400 w-8 h-8" fill="currentColor" /> Game Settings
            </h2>

            <div className="space-y-6 md:space-y-8">
              {/* Players Slider */}
              <div className="group">
                <label className="flex items-center justify-between text-purple-900 font-bold mb-3 text-lg md:text-xl">
                  <span className="flex items-center gap-2"><Users className="text-purple-600" size={24} /> Max Players</span>
                  <span className="bg-white border-2 border-purple-300 px-4 py-1 rounded-xl shadow-sm">{settings.maxPlayers}</span>
                </label>
                <input
                  type="range" min="2" max="15"
                  value={settings.maxPlayers}
                  disabled={!isHost}
                  onChange={(e) => handleSettingChange('maxPlayers', parseInt(e.target.value, 10))}
                  className="w-full h-3 bg-white border-2 border-purple-300 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50 disabled:cursor-not-allowed hover:accent-purple-500 transition-all"
                />
              </div>

              {/* Draw Time Slider */}
              <div className="group">
                <label className="flex items-center justify-between text-purple-900 font-bold mb-3 text-lg md:text-xl">
                  <span className="flex items-center gap-2"><Clock className="text-purple-600" size={24} /> Draw Time</span>
                  <span className="bg-white border-2 border-purple-300 px-4 py-1 rounded-xl shadow-sm">{settings.drawTime}s</span>
                </label>
                <input
                  type="range" min="30" max="120" step="10"
                  value={settings.drawTime}
                  disabled={!isHost}
                  onChange={(e) => handleSettingChange('drawTime', parseInt(e.target.value, 10))}
                  className="w-full h-3 bg-white border-2 border-purple-300 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50 disabled:cursor-not-allowed hover:accent-purple-500 transition-all"
                />
              </div>

              {/* Rounds Slider */}
              <div className="group">
                <label className="flex items-center justify-between text-purple-900 font-bold mb-3 text-lg md:text-xl">
                  <span className="flex items-center gap-2"><Hash className="text-purple-600" size={24} /> Total Rounds</span>
                  <span className="bg-white border-2 border-purple-300 px-4 py-1 rounded-xl shadow-sm">{settings.maxRounds}</span>
                </label>
                <input
                  type="range" min="1" max="10"
                  value={settings.maxRounds}
                  disabled={!isHost}
                  onChange={(e) => handleSettingChange('maxRounds', parseInt(e.target.value, 10))}
                  className="w-full h-3 bg-white border-2 border-purple-300 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50 disabled:cursor-not-allowed hover:accent-purple-500 transition-all"
                />
              </div>
            </div>

            {!isHost && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] rounded-[26px] z-10 flex items-center justify-center">
                <div className="bg-white border-4 border-purple-500 p-4 rounded-2xl shadow-[4px_6px_0px_#A855F7] text-purple-800 font-bold text-xl -rotate-3">
                  Waiting for Host... ⏳
                </div>
              </div>
            )}
          </div>

          {/* 🚀 Start Game Button */}
          {isHost && (
            <button
              onClick={startGame}
              className="bg-green-500 border-4 border-green-700 rounded-[30px] py-4 md:py-6 flex items-center justify-center gap-3 text-3xl md:text-4xl font-bold text-white shadow-[0px_8px_0px_#166534] hover:-translate-y-2 hover:shadow-[0px_12px_0px_#166534] active:translate-y-2 active:shadow-[0px_0px_0px_#166534] transition-all transform hover:scale-[1.02]"
            >
              <Play fill="currentColor" size={36} /> Let's Play!
            </button>
          )}
        </div>

        {/* 👥 Right Panel - Players List */}
        <div className="flex-1 bg-white border-4 border-purple-800 rounded-[30px] p-6 md:p-8 shadow-[inset_0px_0px_20px_rgba(168,85,247,0.15)] flex flex-col h-125 lg:h-150 overflow-hidden relative">

          {/* Fun decorative doodle on players board */}
          <div className="absolute top-4 right-4 bg-orange-400 text-white font-bold px-4 py-1 rounded-full border-4 border-orange-600 rotate-6 shadow-[2px_3px_0px_#C2410C] z-20 text-lg">
            {players.length}/{settings.maxPlayers}
          </div>

          <h2 className="text-3xl font-bold text-purple-900 mb-6 flex items-center gap-3 border-b-4 border-dashed border-purple-200 pb-4">
            <Users className="text-purple-500" size={32} /> Joined Players
          </h2>

          <div className="flex-1 overflow-y-auto pr-2 pb-2 space-y-4 custom-scrollbar">
            {players.map((p, i) => (
              <div key={p.socketId} className="group bg-[#f8fafc] border-4 border-gray-200 rounded-3xl p-3 flex items-center gap-4 hover:border-purple-400 hover:bg-purple-50 transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_#E9D5FF]">

                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl border-4 border-gray-300 group-hover:border-purple-400 p-1 shrink-0 overflow-hidden shadow-sm relative">
                  {p.avatar && AVATAR_MAP[p.avatar] ? (
                    <img src={AVATAR_MAP[p.avatar]} alt={p.name} className="w-[120%] h-[120%] object-contain scale-110" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-xl"></div>
                  )}
                </div>

                <div className="flex-1 flex items-center justify-between">
                  <div className="font-bold text-xl md:text-2xl text-gray-700 group-hover:text-purple-900 truncate pr-2">
                    {p.name || "Anonymous"}
                  </div>
                  {i === 0 && (
                    <span className="shrink-0 bg-yellow-400 border-2 border-yellow-600 text-yellow-900 px-3 py-1 rounded-full font-bold text-sm md:text-base shadow-sm transform -rotate-6">
                      👑 Host
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, settings.maxPlayers - players.length) }).map((_, idx) => (
              <div key={`empty-${idx}`} className="border-4 border-dashed border-gray-200 rounded-3xl p-4 flex items-center gap-4 opacity-50">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-4 border-dashed border-gray-300 shrink-0"></div>
                <div className="h-6 w-32 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}