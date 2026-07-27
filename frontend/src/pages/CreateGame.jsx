import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Users, Clock, Hash, Play, Copy, Check, Star, ArrowLeft, Flame, Lightbulb } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { PlayerContext } from '../context/PlayerContext';

import { AVATAR_MAP } from '../utils/avatars';

// Removed local Avatar imports as they are now in utils/avatars.js

export default function CreateGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const { roomId: contextRoomId, setRoomId, setCurrentWord, PlayerName, PlayerAvtar, setPlayerList, gameSettings: settings, setGameSettings: setSettings } = useContext(PlayerContext);
  const { roomId: urlRoomId } = useParams();
  const roomId = contextRoomId || urlRoomId;
  const [players, setPlayers] = useState([]);
  const [copied, setCopied] = useState(false);

  // Check if I am the host
  const isHost = players.length > 0 && players[0].socketId === socket?.id;

  useEffect(() => {
    if (!socket) return;

    // If the user didn't arrive here via internal navigation (HomePage),
    // always redirect to the name/avatar picker first.
    // This prevents a new tab (same browser) from auto-joining with the old localStorage identity.
    if (!location.state?.readyToJoin) {
      navigate(`/?join=${urlRoomId || roomId || ''}`, { replace: true });
      return;
    }

    if (!contextRoomId && urlRoomId) {
      setRoomId(urlRoomId);
    }

    // Always emit join_room on mount (it handles reconnections & new joins safely)
    socket.emit("join_room", { roomId, name: PlayerName, avatar: PlayerAvtar });

    // Fetch initial room info
    socket.emit("get_room_info", { roomId });

    const handleRoomInfo = (data) => {
      setPlayers(data.players);
      setPlayerList(data.players);
      if (data.settings) setSettings(data.settings);
      
      // Auto-join game screen if game is already active
      if (data.gameState === "PLAYING" || data.gameState === "CHOOSING_WORD") {
        navigate(`/game/${roomId}`, { state: { readyToJoin: true } });
      }
    };

    const handlePlayerJoined = (data) => {
      setPlayers(data.players);
      setPlayerList(data.players);

      if (data.status === "PLAYING" || data.status === "CHOOSING_WORD") {
        navigate(`/game/${roomId}`, { state: { readyToJoin: true } });
      }
    };

    const handlePlayerLeft = (data) => {
      setPlayers(data.players);
      setPlayerList(data.players);
    };

    const handleSettingsUpdated = (data) => {
      setSettings(data.settings);
    };

    const handleGameStarted = () => {
      navigate(`/game/${roomId}`, { state: { readyToJoin: true } });
    };

    const handleWordToDraw = (data) => setCurrentWord(data.word);

    const handleError = (data) => {
      alert(data.message || "An error occurred");
      navigate("/");
    };

    socket.on("room_info", handleRoomInfo);
    socket.on("player_joined", handlePlayerJoined);
    socket.on("player_left", handlePlayerLeft);
    socket.on("settings_updated", handleSettingsUpdated);
    socket.on("word_to_draw", handleWordToDraw);
    socket.on("game_started", handleGameStarted);
    socket.on("error", handleError);

    return () => {
      socket.off("room_info", handleRoomInfo);
      socket.off("player_joined", handlePlayerJoined);
      socket.off("player_left", handlePlayerLeft);
      socket.off("settings_updated", handleSettingsUpdated);
      socket.off("word_to_draw", handleWordToDraw);
      socket.off("game_started", handleGameStarted);
      socket.off("error", handleError);
    };
  }, [socket, roomId, navigate]);

  const handleSettingChange = (key, value) => {
    if (!isHost) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    socket.emit("update_settings", { roomId, settings: newSettings });
  };

  const copyRoomId = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = () => {
    if (!isHost) return;
    if (players.length < 2) {
      alert("Need at least 2 players to start! (Invite someone to join)");
      return;
    }
    socket.emit("start_game", { roomId });
  };

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[#FDF5E6] flex items-center justify-center p-4 md:p-8 font-patrick">

      {/* --- Background Floating Avatars & Decor --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Top Left: Puppy */}
          <div className="absolute top-[5%] left-[5%] md:top-[10%] md:left-[10%] animate-[float_6s_ease-in-out_infinite]">
              <img src={AVATAR_MAP.puppy} alt="Puppy" className="w-24 md:w-36 drop-shadow-xl -rotate-6" />
              {/* Dashed trail */}
              <svg className="absolute -bottom-10 -right-16 w-32 h-20 opacity-40 hidden md:block" viewBox="0 0 100 100">
                  <path d="M 0,0 C 30,40 70,-10 100,50" fill="transparent" stroke="#A78BFA" strokeWidth="2" strokeDasharray="5,5" />
              </svg>
              <Star className="absolute -top-4 -left-6 text-pink-400 w-6 h-6 fill-current animate-pulse" />
          </div>

          {/* Top Right: Panda */}
          <div className="absolute top-[8%] right-[5%] md:top-[12%] md:right-[10%] animate-[float_7s_ease-in-out_infinite_reverse]">
              <img src={AVATAR_MAP.panda} alt="Panda" className="w-28 md:w-40 drop-shadow-xl rotate-6" />
              <svg className="absolute -bottom-12 -left-12 w-24 h-24 opacity-40 hidden md:block" viewBox="0 0 100 100">
                  <path d="M 100,0 C 50,50 60,-20 0,60" fill="transparent" stroke="#A78BFA" strokeWidth="2" strokeDasharray="5,5" />
              </svg>
              <div className="absolute -top-6 -right-2 text-pink-400 text-2xl animate-bounce">💖</div>
          </div>

          {/* Bottom Left: Penguin */}
          <div className="absolute bottom-[10%] left-[3%] md:bottom-[15%] md:left-[8%] animate-[float_5s_ease-in-out_infinite]">
              <img src={AVATAR_MAP.penguin} alt="Penguin" className="w-28 md:w-44 drop-shadow-xl -rotate-12" />
              <svg className="absolute -right-20 top-1/2 w-32 h-10 opacity-40 hidden md:block" viewBox="0 0 100 50">
                  <path d="M 0,25 Q 25,50 50,25 T 100,25" fill="transparent" stroke="#A78BFA" strokeWidth="2" strokeDasharray="5,5" />
              </svg>
              <Star className="absolute top-0 -left-6 text-yellow-400 w-8 h-8 fill-current animate-pulse" />
          </div>

          {/* Bottom Center: Frog */}
          <div className="absolute bottom-[2%] left-[40%] md:bottom-[5%] md:left-[45%] animate-[float_6.5s_ease-in-out_infinite_1s]">
              <img src={AVATAR_MAP.frog} alt="Frog" className="w-20 md:w-32 drop-shadow-xl rotate-3" />
              <div className="absolute -top-4 -right-8 text-pink-400 text-xl animate-pulse">💕</div>
          </div>

          {/* Bottom Right: Cat */}
          <div className="absolute bottom-[5%] right-[5%] md:bottom-[10%] md:right-[8%] animate-[float_5.5s_ease-in-out_infinite_reverse]">
              <img src={AVATAR_MAP.cat} alt="Cat" className="w-28 md:w-40 drop-shadow-xl rotate-12" />
              <svg className="absolute -top-16 -left-10 w-20 h-32 opacity-40 hidden md:block" viewBox="0 0 50 100">
                  <path d="M 25,100 Q -10,50 25,0" fill="transparent" stroke="#A78BFA" strokeWidth="2" strokeDasharray="5,5" />
              </svg>
          </div>
          
          {/* Random background stars and flowers */}
          <Star className="absolute top-[30%] left-[20%] text-yellow-300 w-6 h-6 fill-current opacity-60" />
          <Star className="absolute top-[40%] right-[15%] text-pink-300 w-5 h-5 fill-current opacity-60" />
          <Star className="absolute bottom-[30%] right-[30%] text-purple-300 w-7 h-7 fill-current opacity-60" />
      </div>

      <div className="w-full max-w-6xl bg-white border-4 border-purple-800 rounded-[40px] md:rounded-[50px] shadow-[8px_12px_0px_#D8B4FE] md:shadow-[12px_16px_0px_#D8B4FE] p-6 text-2xl md:p-10 flex flex-col lg:flex-row gap-8 relative z-10 transition-all">

        {/* 🔙 Back Button */}
        <button 
          onClick={() => { socket.emit("leave_room"); navigate("/"); }}
          className="absolute -top-4 -left-4 md:-top-6 md:-left-6 bg-red-400 border-4 border-purple-800 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white shadow-[4px_5px_0px_#D8B4FE] hover:bg-red-500 hover:-translate-y-1 transition-all active:translate-y-0 active:shadow-none z-50"
          title="Leave Room"
        >
          <ArrowLeft size={32} strokeWidth={3} />
        </button>

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
              {/* Difficulty Selector */}
              <div className="group">
                <label className="flex items-center justify-between text-purple-900 font-bold mb-3 text-lg md:text-xl">
                  <span className="flex items-center gap-2"><Flame className="text-purple-600" size={24} /> Difficulty</span>
                </label>
                <div className="flex bg-white border-2 border-purple-300 rounded-xl overflow-hidden shadow-sm font-bold text-sm md:text-base">
                  {['easy', 'medium', 'hard', 'mixed'].map((diff) => (
                    <button
                      key={diff}
                      disabled={!isHost}
                      onClick={() => handleSettingChange('difficulty', diff)}
                      className={`flex-1 py-2 capitalize transition-colors ${
                        (settings.difficulty || 'mixed') === diff
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-600 hover:bg-purple-100'
                      } ${!isHost && 'opacity-50 cursor-not-allowed'}`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

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

              {/* Hints Slider */}
              <div className="group">
                <label className="flex items-center justify-between text-purple-900 font-bold mb-3 text-lg md:text-xl">
                  <span className="flex items-center gap-2"><Lightbulb className="text-purple-600" size={24} /> Hints</span>
                  <span className="bg-white border-2 border-purple-300 px-4 py-1 rounded-xl shadow-sm">{settings.hints ?? 2}</span>
                </label>
                <input
                  type="range" min="0" max="5"
                  value={settings.hints ?? 2}
                  disabled={!isHost}
                  onChange={(e) => handleSettingChange('hints', parseInt(e.target.value, 10))}
                  className="w-full h-3 bg-white border-2 border-purple-300 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50 disabled:cursor-not-allowed hover:accent-purple-500 transition-all"
                />
                <p className="text-sm text-purple-400 mt-1 font-bold">
                  {(settings.hints ?? 2) === 0 ? 'No hints — hardcore mode! 🔥' : `${settings.hints ?? 2} letter(s) will reveal over time`}
                </p>
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