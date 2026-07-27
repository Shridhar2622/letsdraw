import { useEffect, useState, useContext } from 'react'
import { useSocket } from '../context/SocketContext'
import { useNavigate, useParams, useLocation } from 'react-router-dom'

import PlayerList from '../components/PlayerList'
import { PlayerContext } from '../context/PlayerContext'

import '../App.css'
import Navbar from '../components/Navbar'
import ChatSection from '../components/ChatSection'
import Tools from '../components/Tools'
import CanvasBoard from '../components/CanvasBoard'
import GameOverModal from '../components/GameOverModal'

import { Users } from 'lucide-react'

function MainGameScreen() {
    const [showMobilePlayers, setShowMobilePlayers] = useState(false);
    const {
        roomId: contextRoomId,
        setRoomId,
        setPlayerList,
        PlayerName,
        PlayerAvtar,
        currentDrawer,
        setCurrentDrawer,
        setWordHint,
        setCurrentRound,
        setGameState,
        setGameSettings,
        timeRemaining,
        setTimeRemaining,
        setCurrentWord,
        gameState,
        playerList
    } = useContext(PlayerContext);
    const socket = useSocket();
    const navigate = useNavigate();
    const location = useLocation();
    const { roomId: urlRoomId } = useParams();
    const roomId = contextRoomId || urlRoomId;
    const [scoreboard, setScoreboard] = useState(null);
    const [wordChoices, setWordChoices] = useState([]);
    const [revealedWord, setRevealedWord] = useState('');

    const handleWordChoice = (word) => {
        if (socket && roomId) {
            socket.emit("word_chosen", { roomId, word });
        }
    };
    
    const isMyTurn = currentDrawer?.socketId === socket?.id;

    useEffect(() => {
        if (!socket) return;
        
        // If the user didn't arrive here via internal navigation,
        // redirect to the name/avatar picker first.
        // (Note: page refreshes preserve location.state, so refreshes won't be redirected)
        if (!location.state?.readyToJoin) {
            navigate(`/?join=${urlRoomId || roomId || ''}`, { replace: true });
            return;
        }
        
        if (!contextRoomId && urlRoomId) {
            setRoomId(urlRoomId);
        }

        // Re-join the socket.io room on mount (handles page refresh / reconnect)
        socket.emit("join_room", { roomId, name: PlayerName, avatar: PlayerAvtar });
        socket.emit("get_room_info", { roomId });

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && socket && roomId) {
                socket.emit("get_room_info", { roomId });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        function handleRoomInfo(data) {
            if (data) {
                if (data.players) {
                    setPlayerList(data.players);
                }
                if (data.settings) {
                    setGameSettings(data.settings);
                }

                // If joining an already started game, sync the game state
                if (data.gameState === "PLAYING" || data.gameState === "CHOOSING_WORD") {
                    setCurrentDrawer(data.currentDrawer);
                    setWordHint(data.wordHint);
                    setCurrentRound(data.round);
                    setGameState(data.gameState);
                }
            }
        }

        function handleChoosingWord(data) {
            setCurrentDrawer(data.drawer);
            setCurrentRound(data.round);
            setGameState("CHOOSING_WORD");
            setCurrentWord(null);
            setWordChoices([]);
            setPlayerList(prev => prev.map(p => ({
                ...p,
                isDrawer: p.socketId === data.drawer.socketId
            })));
        }

        function handleNewTurn(data) {
            setCurrentDrawer(data.drawer);
            setWordHint(data.wordHint);
            setCurrentRound(data.round);
            setGameState("PLAYING");
            setPlayerList(prev => prev.map(p => ({
                ...p,
                isDrawer: p.socketId === data.drawer.socketId
            })));
        }

        const handleWordChoices = (data) => setWordChoices(data.words);
        const handleWordToDraw = (data) => setCurrentWord(data.word);
        const handleTimeTick = (data) => setTimeRemaining(data.timeRemaining);
        const handleGameOver = (data) => {
            setGameState("GAME_OVER");
            setScoreboard(data.scoreboard);
        };
        const handleCorrectGuess = (data) => {
            if (data.scores) {
                setPlayerList(data.scores);
            }
        };
        const handleWordRevealed = (data) => {
            setWordHint(data.word);
        };
        const handleTurnEnded = (data) => {
            setGameState("TURN_ENDED");
            setRevealedWord(data.word);
            if (data.scoreboard) {
                setPlayerList(data.scoreboard);
            }
        };
        const handleHintUpdate = (data) => {
            setWordHint(data.wordHint);
        };
        const handleGameRestarted = () => {
            setGameState("LOBBY");
            navigate(`/room/${roomId}`, { state: { readyToJoin: true } });
        };

        socket.on("room_info", handleRoomInfo);
        socket.on("player_joined", handleRoomInfo);
        socket.on("player_left", handleRoomInfo);
        socket.on("choosing_word", handleChoosingWord);
        socket.on("word_choices", handleWordChoices);
        socket.on("new_turn", handleNewTurn);
        socket.on("word_to_draw", handleWordToDraw);
        socket.on("time_tick", handleTimeTick);
        socket.on("game_over", handleGameOver);
        socket.on("correct_guess", handleCorrectGuess);
        socket.on("word_revealed", handleWordRevealed);
        socket.on("turn_ended", handleTurnEnded);
        socket.on("game_restarted", handleGameRestarted);
        socket.on("hint_update", handleHintUpdate);

        return () => {
            socket.off("room_info", handleRoomInfo);
            socket.off("player_joined", handleRoomInfo);
            socket.off("player_left", handleRoomInfo);
            socket.off("choosing_word", handleChoosingWord);
            socket.off("word_choices", handleWordChoices);
            socket.off("new_turn", handleNewTurn);
            socket.off("word_to_draw", handleWordToDraw);
            socket.off("time_tick", handleTimeTick);
            socket.off("game_over", handleGameOver);
            socket.off("correct_guess", handleCorrectGuess);
            socket.off("word_revealed", handleWordRevealed);
            socket.off("turn_ended", handleTurnEnded);
            socket.off("game_restarted", handleGameRestarted);
            socket.off("hint_update", handleHintUpdate);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [socket, roomId, setPlayerList, setCurrentDrawer, setWordHint, setCurrentRound, setGameState, setTimeRemaining, setCurrentWord]);
    return (
        <div className='p-2 flex flex-col gap-2 md:gap-4 w-full h-[100dvh] overflow-hidden border-purple-800 bg-[#fefce8] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] font-patrick'>

            {gameState === 'GAME_OVER' && <GameOverModal scoreboard={scoreboard} />}
            
            {gameState === 'TURN_ENDED' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-patrick">
                    <div className="bg-white border-4 border-purple-800 rounded-[30px] shadow-[8px_10px_0px_#D8B4FE] p-8 md:p-12 text-center animate-bounce-in max-w-lg w-full">
                        <h2 className="text-3xl md:text-5xl font-black text-purple-900 tracking-wider mb-4">
                            The word was
                        </h2>
                        <div className="inline-block px-8 py-4 bg-[#fefce8] border-4 border-purple-800 rounded-2xl text-3xl md:text-4xl font-bold text-purple-900 shadow-[4px_6px_0px_#FCD34D] uppercase tracking-widest mb-6">
                            {revealedWord}
                        </div>
                        
                        <div className="border-t-2 border-dashed border-purple-200 pt-6">
                            <h3 className="text-xl font-bold text-purple-600 mb-4">Current Standings</h3>
                            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                {/* Context playerList is already sorted by score usually, but let's sort just in case */}
                                {[...playerList].sort((a, b) => b.score - a.score).slice(0, 3).map((p, i) => (
                                    <div key={p.socketId} className="flex justify-between items-center bg-purple-50 rounded-xl p-3 border-2 border-purple-100">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-purple-400 text-lg">#{i + 1}</span>
                                            <span className="font-bold text-purple-900 text-lg truncate max-w-[120px]">{p.name}</span>
                                        </div>
                                        <span className="font-bold text-white bg-purple-500 px-3 py-1 rounded-full">{p.score} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'CHOOSING_WORD' && currentDrawer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-patrick">
                    <div className="bg-white border-4 border-purple-800 rounded-[30px] shadow-[8px_10px_0px_#D8B4FE] p-8 md:p-12 text-center relative">
                      <div className="absolute top-4 right-6 text-2xl font-bold text-red-500 flex items-center gap-1">
                          ⏱ {timeRemaining}s
                      </div>
                      <h2 className="text-4xl md:text-6xl font-black text-purple-900 tracking-wider mb-2 mt-4">
                          {isMyTurn ? "Your Turn!" : `${currentDrawer.name}'s Turn!`}
                      </h2>
                      <p className="text-xl md:text-2xl text-purple-600 font-bold mb-6">
                          {isMyTurn ? "Choose a word to draw:" : "Waiting for drawer to choose a word..."}
                      </p>

                      {isMyTurn && wordChoices.length > 0 && (
                          <div className="border-t-2 border-dashed border-purple-200 pt-6">
                             <div className="flex gap-4 justify-center flex-wrap">
                                 {wordChoices.map(word => (
                                     <button key={word} onClick={() => handleWordChoice(word)} className="px-6 py-2 bg-[#fefce8] border-4 border-purple-800 rounded-2xl text-xl font-bold text-purple-900 hover:bg-yellow-100 hover:-translate-y-1 transition-all shadow-[2px_3px_0px_#FCD34D] uppercase">
                                        {word}
                                     </button>
                                 ))}
                             </div>
                          </div>
                      )}
                      {!isMyTurn && (
                          <div className="flex flex-col items-center mt-4">
                             <div className="w-8 h-8 border-4 border-purple-800 border-t-transparent rounded-full animate-spin mb-2"></div>
                             <p className="text-sm text-purple-400 font-bold">Game will auto-pick if they take too long...</p>
                          </div>
                      )}
                   </div>
                </div>
            )}

            {/* Navbar area */}
            <div className="w-full shrink-0">
                <Navbar />
            </div>

            {/* Main Content  */}
            <div className="flex flex-col lg:flex-row gap-2 md:gap-4 flex-1 w-full min-h-0 pb-1 lg:pb-0 items-stretch relative">
                
                {/* Mobile Players Toggle Button */}
                <button 
                    onClick={() => setShowMobilePlayers(true)}
                    className="lg:hidden absolute top-2 left-2 z-40 bg-purple-800 text-white p-2 rounded-full shadow-[2px_3px_0px_#D8B4FE] border-2 border-purple-900 active:translate-y-1 transition-all"
                >
                    <Users size={20} />
                </button>

                {/* Sidebar (Players) */}
                <div className={`${showMobilePlayers ? 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4' : 'hidden lg:flex'} w-full lg:w-72 xl:w-80 shrink-0 flex-col min-h-0`}>
                    <div className="w-full h-[80vh] lg:h-full relative max-w-sm lg:max-w-none mx-auto flex flex-col">
                        {showMobilePlayers && (
                            <button onClick={() => setShowMobilePlayers(false)} className="absolute -top-3 -right-3 z-50 bg-red-500 text-white w-8 h-8 rounded-full border-2 border-white shadow-md font-bold hover:bg-red-600">X</button>
                        )}
                        <PlayerList />
                    </div>
                </div>

                {/* Canvas Area  */}
                <div className="w-full flex-1 shrink flex flex-col min-h-0 items-center justify-center overflow-hidden relative p-2 md:p-4">
                    <CanvasBoard />
                </div>

                {/* Right Sidebar (Chat) */}
                <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col min-h-0 h-48 lg:h-auto z-10">
                    <ChatSection />
                </div>
            </div>
            
            {/* Tools (Compact on mobile) */}
            <div className="w-full shrink-0 z-20">
                <Tools />
            </div>
        </div>
    )
}

export default MainGameScreen