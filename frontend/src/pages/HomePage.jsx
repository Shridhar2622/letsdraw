import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Star, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSocket } from "../context/SocketContext"
import JoinRoom from '../components/JoinRoom'
import { PlayerContext } from '../context/PlayerContext';
import { AuthContext } from '../context/AuthContext';
import GameHistorySection from '../components/GameHistorySection';
import LeaderboardSection from '../components/LeaderboardSection';
import AuthModal from '../components/AuthModal';
import { LogOut, User as UserIcon } from 'lucide-react';

// Import Avatars
import PandaAvatar from '../assets/Profile/PANDA.png';
import RabbitAvatar from '../assets/Profile/RABBIT.png';
import BearAvatar from '../assets/Profile/bear.png';
import CatAvatar from '../assets/Profile/cat.png';
import FoxAvtar from '../assets/Profile/fox.png';
import FrogAvtar from '../assets/Profile/frog.png';
import PenguinAvatar from '../assets/Profile/penguin.png';
import PuppyAvatar from '../assets/Profile/puppy.png';

const AVATARS = [
    { id: 'panda', src: PandaAvatar, name: 'Panda' },
    { id: 'rabbit', src: RabbitAvatar, name: 'Rabbit' },
    { id: 'bear', src: BearAvatar, name: 'Bear' },
    { id: 'fox', src: FoxAvtar, name: 'fox' },
    { id: 'frog', src: FrogAvtar, name: 'frog' },
    { id: 'penguin', src: PenguinAvatar, name: 'penguin' },
    { id: 'puppy', src: PuppyAvatar, name: 'puppy' },
    { id: 'cat', src: CatAvatar, name: 'Cat' },
];


//random names
const nicknames = [
    "DoodleKing",
    "SketchPanda",
    "GigglePenguin",
    "WobblyFox",
    "TinyFrog",
    "FluffyBear",
    "HappyRabbit",
    "BouncyCat",
    "SleepyPuppy",
    "ChubbyPanda",
    "SketchMaster",
    "DoodleWizard",
    "PixelPainter",
    "InkBandit",
    "CrayonHero",
    "BrushNinja",
    "SketchGoblin",
    "ArtSprinter",
    "CanvasKid",
    "LineLegend",
    "NoobArtist",
    "DrawOrCry",
    "GuessMachine",
    "SketchyGuy",
    "WiggleLines",
    "PaintBandit",
    "LazyPainter",
    "OopsArtist",
    "Drawzilla",
    "Guessinator",
    "GiggleGhost",
    "HappyDoodler",
    "TinySketch",
    "BubblyPenguin",
    "SnaccFox",
    "PuddlePanda",
    "SquishyCat",
    "FroggyBoi",
    "MarshmallowBear",
    "CookieRabbit",
    "PotatoDrawer",
    "BananaSketch",
    "OopsIDrewThat",
    "WrongAnswer",
    "ArtButBad",
    "GuessPls",
    "OopsPainter",
    "WhyAmIDrawing",
    "PaintPotato",
    "DoodlePotato"
];

export default function HomePage() {
    const socket = useSocket()
    const { setPlayerAvtar: setGlobalAvatar, setPlayerName: setGlobalName, setRoomId, roomId, setPlayerList } = useContext(PlayerContext);
    const [avatarIndex, setAvatarIndex] = useState(Math.floor(Math.random() * AVATARS.length));
    const selectedAvatar = AVATARS[avatarIndex].id;
    const [playerName, setPlayerName] = useState(nicknames[Math.floor(Math.random() * nicknames.length)]);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const joinRoomId = searchParams.get('join');
    const [showModel, setShowModel] = useState(false);
    
    // Auth logic
    const { user, logout } = useContext(AuthContext);
    const [showAuthModal, setShowAuthModal] = useState(false);
    
    // History logic
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    useEffect(() => {
        if (user) {
            setPlayerName(user.username);
        }
    }, [user]);

    useEffect(() => {
        if (!socket) return;

        // Cleanly leave the room if the user navigated back to the home screen
        socket.emit("leave_room");
        setRoomId(null);
        if (setPlayerList) setPlayerList([]);

        const handleRoomCreated = (data) => {
            console.log("Room Created:", data.roomId);
            setRoomId(data.roomId);
            navigate(`/room/${data.roomId}`, { state: { readyToJoin: true } });
        };

        socket.on("room_created", handleRoomCreated);

        return () => {
            socket.off("room_created", handleRoomCreated);
        };
    }, [socket, navigate]);

    const handleJoinGame = () => {
        if (!playerName.trim()) {
            alert("Please enter your name first!");
            return;
        }

        // We no longer emit 'homepage', not needed by backend.
        setGlobalName(playerName);
        setGlobalAvatar(selectedAvatar);

        if (joinRoomId) {
            navigate(`/room/${joinRoomId}`, { state: { readyToJoin: true } });
        } else {
            setShowModel(true)
        }
    };

    const handleCreateGame = () => {
        if (!playerName.trim()) {
            alert("Please enter your name first!");
            return;
        }

        // Emit the event to the backend that a player created a game
        socket.emit('create_room', { name: playerName, avatar: selectedAvatar });
        setGlobalName(playerName);
        setGlobalAvatar(selectedAvatar);

        // We do NOT navigate immediately. The useEffect listener for 'room_created' handles the navigation.
    };

    return (
        <div className="relative min-h-dvh overflow-y-auto w-full bg-[#FDF5E6] flex flex-col items-center justify-start py-4 md:py-8 px-2 md:px-4 font-patrick gap-4">
            
            {/* Top Right Auth Button */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
                {user ? (
                    <div className="flex items-center gap-3 bg-white border-2 border-purple-200 px-4 py-2 rounded-xl shadow-sm">
                        <UserIcon className="text-purple-400" size={18} />
                        <span className="font-bold text-purple-900">{user.username}</span>
                        <button 
                            onClick={logout}
                            className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setShowAuthModal(true)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-2 border-yellow-600 px-5 py-2 rounded-xl font-bold shadow-[2px_3px_0px_#CA8A04] transition-all hover:translate-y-[-2px]"
                    >
                        Login / Register
                    </button>
                )}
                
                <button 
                    onClick={() => setShowHistoryModal(true)}
                    className="bg-blue-400 hover:bg-blue-500 text-blue-900 border-2 border-blue-600 px-5 py-2 rounded-xl font-bold shadow-[2px_3px_0px_#1E3A8A] transition-all hover:translate-y-[-2px]"
                >
                    Match History
                </button>
            </div>

            {/* --- Background Floating Avatars & Decor --- */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {/* Top Left: Puppy */}
                <div className="absolute top-[5%] left-[5%] md:top-[10%] md:left-[10%] animate-[float_6s_ease-in-out_infinite]">
                    <img src={PuppyAvatar} alt="Puppy" className="w-24 md:w-36 drop-shadow-xl -rotate-6" />
                    {/* Dashed trail */}
                    <svg className="absolute -bottom-10 -right-16 w-32 h-20 opacity-40 hidden md:block" viewBox="0 0 100 100">
                        <path d="M 0,0 C 30,40 70,-10 100,50" fill="transparent" stroke="#A78BFA" strokeWidth="2" strokeDasharray="5,5" />
                    </svg>
                    <Star className="absolute -top-4 -left-6 text-pink-400 w-6 h-6 fill-current animate-pulse" />
                </div>

                {/* Top Right: Panda */}
                <div className="absolute top-[8%] right-[5%] md:top-[12%] md:right-[10%] animate-[float_7s_ease-in-out_infinite_reverse]">
                    <img src={PandaAvatar} alt="Panda" className="w-28 md:w-40 drop-shadow-xl rotate-6" />
                    <svg className="absolute -bottom-12 -left-12 w-24 h-24 opacity-40 hidden md:block" viewBox="0 0 100 100">
                        <path d="M 100,0 C 50,50 60,-20 0,60" fill="transparent" stroke="#A78BFA" strokeWidth="2" strokeDasharray="5,5" />
                    </svg>
                    <div className="absolute -top-6 -right-2 text-pink-400 text-2xl animate-bounce">💖</div>
                </div>

                {/* Bottom Left: Penguin */}
                <div className="absolute bottom-[10%] left-[3%] md:bottom-[15%] md:left-[8%] animate-[float_5s_ease-in-out_infinite]">
                    <img src={PenguinAvatar} alt="Penguin" className="w-28 md:w-44 drop-shadow-xl -rotate-12" />
                    <svg className="absolute -right-20 top-1/2 w-32 h-10 opacity-40 hidden md:block" viewBox="0 0 100 50">
                        <path d="M 0,25 Q 25,50 50,25 T 100,25" fill="transparent" stroke="#A78BFA" strokeWidth="2" strokeDasharray="5,5" />
                    </svg>
                    <Star className="absolute top-0 -left-6 text-yellow-400 w-8 h-8 fill-current animate-pulse" />
                </div>

                {/* Bottom Center: Frog */}
                <div className="absolute bottom-[2%] left-[40%] md:bottom-[5%] md:left-[45%] animate-[float_6.5s_ease-in-out_infinite_1s]">
                    <img src={FrogAvtar} alt="Frog" className="w-20 md:w-32 drop-shadow-xl rotate-3" />
                    <div className="absolute -top-4 -right-8 text-pink-400 text-xl animate-pulse">💕</div>
                </div>

                {/* Bottom Right: Cat */}
                <div className="absolute bottom-[5%] right-[5%] md:bottom-[10%] md:right-[8%] animate-[float_5.5s_ease-in-out_infinite_reverse]">
                    <img src={CatAvatar} alt="Cat" className="w-28 md:w-40 drop-shadow-xl rotate-12" />
                    <svg className="absolute -top-16 -left-10 w-20 h-32 opacity-40 hidden md:block" viewBox="0 0 50 100">
                        <path d="M 25,100 Q -10,50 25,0" fill="transparent" stroke="#A78BFA" strokeWidth="2" strokeDasharray="5,5" />
                    </svg>
                </div>
                
                {/* Random background stars and flowers */}
                <Star className="absolute top-[30%] left-[20%] text-yellow-300 w-6 h-6 fill-current opacity-60" />
                <Star className="absolute top-[40%] right-[15%] text-pink-300 w-5 h-5 fill-current opacity-60" />
                <Star className="absolute bottom-[30%] right-[30%] text-purple-300 w-7 h-7 fill-current opacity-60" />
            </div>

            {/* The Modal Component (should be toggled via state in the future) */}
            <JoinRoom show={showModel} set={setShowModel} />

            <div className="w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[65vw] xl:w-[50vw] max-h-[98dvh] bg-white border-4 border-purple-800 rounded-[30px] md:rounded-[40px] shadow-[8px_10px_0px_#D8B4FE] p-4 md:p-6 lg:p-8 flex flex-col items-center relative -rotate-1 z-10">

                {/* Decorative elements */}
                <Star className="absolute top-8 left-8 text-yellow-300 w-8 h-8 opacity-50 -rotate-12" fill="currentColor" />
                <Pencil className="absolute bottom-12 right-8 text-purple-300 w-8 h-8 opacity-50 rotate-45" />

                {/* Sticky Note */}
                <div className="absolute -top-6 -right-4 md:-right-8 bg-[#fef08a] border-2 border-yellow-600 p-3 md:p-4 rounded-br-3xl shadow-[4px_4px_0px_rgba(0,0,0,0.1)] rotate-6 z-20 w-32 md:w-40">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-3 bg-red-400/50 -rotate-2"></div>
                    <p className="text-yellow-900 font-patrick text-sm md:text-base leading-tight text-center font-bold">
                        Invite friends & play! ✨
                    </p>
                </div>

                {/* Title */}
                <div className="flex shrink-0 items-center justify-center gap-2 md:gap-4 mb-1 md:mb-2 mt-4 md:mt-0">
                    <Sparkles className="text-yellow-400 w-6 h-6 md:w-12 md:h-12 animate-pulse" />
                    <h1 className="text-4xl md:text-7xl font-bold text-purple-900 text-center tracking-wider" style={{ textShadow: '3px 3px 0px #FCD34D' }}>
                        doodle-dash 
                    </h1>
                    <Sparkles className="text-yellow-400 w-6 h-6 md:w-12 md:h-12 animate-pulse" />
                </div>

                <p className="shrink-0 text-base md:text-2xl text-purple-700 mb-2 md:mb-6 font-bold bg-[#DCFCE7] px-4 md:px-6 py-1 md:py-2 rounded-2xl border-2 border-green-600 -rotate-2 shadow-[2px_3px_0px_#86EFAC] animate-bounce hover:animate-none">
                    Draw. Guess. Laugh.
                </p>

                {/* Avatar Selection Section */}
                <div className="w-full flex-1 min-h-0 flex flex-col items-center mb-4">
                    <h2 className="shrink-0 text-xl md:text-3xl font-bold text-purple-800 mb-2 md:mb-4 text-center flex items-center gap-2">
                        Choose your Avatar
                    </h2>

                    {/* Carousel Selector */}
                    <div className="w-full flex-1 min-h-[150px] bg-purple-50/50 rounded-[2rem] md:rounded-[3rem] border-0 p-2 md:p-6 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="flex items-center justify-center gap-4 md:gap-12 w-full">
                            {/* Left Arrow */}
                            <button 
                                onClick={() => setAvatarIndex(prev => (prev === 0 ? AVATARS.length - 1 : prev - 1))}
                                className="w-12 h-12 md:w-16 md:h-16 shrink-0 bg-white border-4 border-purple-800 rounded-full flex items-center justify-center hover:bg-yellow-100 hover:scale-110 active:scale-95 transition-all shadow-[2px_3px_0px_#D8B4FE]"
                            >
                                <ChevronLeft className="text-purple-900 w-6 h-6 md:w-8 md:h-8 -ml-1" strokeWidth={3} />
                            </button>

                            {/* Selected Avatar */}
                            <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 flex items-center justify-center animate-bounce hover:animate-none">
                                {/* Glow */}
                                <div className="absolute inset-0 bg-yellow-100 opacity-50 blur-[20px] rounded-full"></div>
                                <img
                                    src={AVATARS[avatarIndex].src}
                                    alt={AVATARS[avatarIndex].name}
                                    className="w-[90%] h-[90%] object-contain relative z-10 scale-110 drop-shadow-xl transition-transform duration-300"
                                />
                                {/* Sparkles on it */}
                                <div className="absolute top-0 right-0 bg-yellow-400 border-2 border-purple-900 rounded-full p-1.5 shadow-[2px_2px_0px_#581C87] z-20">
                                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-purple-900" fill="currentColor" />
                                </div>
                            </div>

                            {/* Right Arrow */}
                            <button 
                                onClick={() => setAvatarIndex(prev => (prev === AVATARS.length - 1 ? 0 : prev + 1))}
                                className="w-12 h-12 md:w-16 md:h-16 shrink-0 bg-white border-4 border-purple-800 rounded-full flex items-center justify-center hover:bg-yellow-100 hover:scale-110 active:scale-95 transition-all shadow-[2px_3px_0px_#D8B4FE]"
                            >
                                <ChevronRight className="text-purple-900 w-6 h-6 md:w-8 md:h-8 -mr-1" strokeWidth={3} />
                            </button>
                        </div>
                        <div className="mt-4 md:mt-6 bg-purple-100 border-2 border-purple-300 px-6 py-1.5 md:py-2 rounded-full shadow-sm">
                            <p className="font-bold text-lg md:text-2xl text-purple-800 uppercase tracking-widest">{AVATARS[avatarIndex].name}</p>
                        </div>
                    </div>

                    {/* Cute Dynamic Greeting */}

                </div>

                {/* Name Input */}
                <div className="w-full max-w-md shrink-0 mt-auto md:mt-0 mb-3 md:mb-6 flex flex-col items-center">
                    <h2 className="text-lg md:text-2xl font-bold text-purple-800 mb-1 md:mb-2">What's your name?</h2>
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (joinRoomId) handleJoinGame();
                                else handleCreateGame();
                            }
                        }}
                        placeholder="Enter a cool nickname..."
                        className="w-full bg-white border-4 border-purple-800 rounded-xl md:rounded-2xl px-4 py-2 md:px-6 md:py-4 text-lg md:text-2xl font-bold text-purple-900 placeholder:text-purple-300 outline-none focus:ring-4 focus:ring-yellow-300 shadow-[3px_4px_0px_#D8B4FE] md:shadow-[4px_5px_0px_#D8B4FE] transition-all"
                        maxLength={15}
                    />
                </div>

                {/* Action Buttons */}
                <div className="w-full shrink-0 flex flex-col sm:flex-row justify-center items-center gap-2 md:gap-6">
                    <button
                        onClick={handleJoinGame}
                        className="w-full sm:flex-1 max-w-70 bg-green-500 border-4 border-green-700 rounded-2xl md:rounded-3xl py-2 md:py-4 px-4 md:px-6 text-xl md:text-3xl font-bold text-white shadow-[4px_6px_0px_#166534] md:shadow-[6px_8px_0px_#166534] transition-all hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-[4px_8px_0px_#166534] active:translate-y-1 active:shadow-[0px_0px_0px_#166534]"
                    >
                        Join Game
                    </button>

                    <button
                        onClick={handleCreateGame}
                        className="w-full sm:flex-1 max-w-70 bg-transparent border-4 border-orange-500 rounded-2xl md:rounded-3xl py-2 md:py-4 px-4 md:px-6 text-lg md:text-2xl font-bold text-orange-600 shadow-[3px_4px_0px_#F97316] md:shadow-[4px_6px_0px_#F97316] transition-all hover:-translate-y-1 hover:bg-orange-50 active:translate-y-1 active:shadow-[0px_0px_0px_#F97316]"
                    >
                        Create Game
                    </button>
                </div>

            </div>

            {/* Game History Section below main card */}
            <LeaderboardSection />
            
            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-[#FDF5E6]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border-4 border-blue-800 p-6 md:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[8px_10px_0px_#93C5FD] relative font-patrick">
                        <button 
                            onClick={() => setShowHistoryModal(false)}
                            className="absolute -top-4 -right-4 bg-red-400 border-4 border-red-700 rounded-full p-2 text-white hover:bg-red-500 hover:-translate-y-1 transition-all shadow-[2px_4px_0px_#B91C1C]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                        <GameHistorySection />
                    </div>
                </div>
            )}

            <AuthModal show={showAuthModal} set={setShowAuthModal} />

        </div>
    );
}
