import { useEffect, useState, useContext } from 'react'
import { useSocket } from '../context/SocketContext'

import PlayerList from '../components/PlayerList'
import { PlayerContext } from '../context/PlayerContext'

import '../App.css'
import Navbar from '../components/Navbar'
import ChatSection from '../components/ChatSection'
import Tools from '../components/Tools'
import CanvasBoard from '../components/CanvasBoard'
import GameOverModal from '../components/GameOverModal'


function MainGameScreen() {
    const {
        roomId,
        setPlayerList,
        currentDrawer,
        setCurrentDrawer,
        setWordHint,
        setCurrentRound,
        setGameState,
        setGameSettings,
        setTimeRemaining,
        setCurrentWord,
        gameState
    } = useContext(PlayerContext);
    const socket = useSocket();
    const [scoreboard, setScoreboard] = useState(null);
    const [showTurnModal, setShowTurnModal] = useState(false);
    
    const isMyTurn = currentDrawer?.socketId === socket?.id;

    useEffect(() => {
        if (!socket || !roomId) return;

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
                if (data.gameState === "PLAYING") {
                    setCurrentDrawer(data.currentDrawer);
                    setWordHint(data.wordHint);
                    setCurrentRound(data.round);
                    setGameState(data.gameState);
                }
            }
        }

        function handleGameStarted(data) {
            setCurrentDrawer(data.drawer);
            setWordHint(data.wordHint);
            setCurrentRound(data.round);
            setGameState("PLAYING");
            
            // Re-map player list
            setPlayerList(prev => prev.map(p => ({
                ...p,
                isDrawer: p.socketId === data.drawer.socketId
            })));

            setShowTurnModal(true);
            setTimeout(() => setShowTurnModal(false), 3000);
        }

        function handleNewTurn(data) {
            setCurrentDrawer(data.drawer);
            setWordHint(data.wordHint);
            setCurrentRound(data.round);
            setCurrentWord(null); // Clear previous word immediately

            // Re-map player list to visually move the drawer icon
            setPlayerList(prev => prev.map(p => ({
                ...p,
                isDrawer: p.socketId === data.drawer.socketId
            })));
            
            // Show turn modal
            setShowTurnModal(true);
            setTimeout(() => setShowTurnModal(false), 3000);
        }

        socket.on("room_info", handleRoomInfo);
        socket.on("player_joined", handleRoomInfo);
        socket.on("player_left", handleRoomInfo);
        socket.on("game_started", handleGameStarted);

        // Listeners for in-game events
        socket.on("new_turn", handleNewTurn);
        socket.on("word_to_draw", (data) => setCurrentWord(data.word));
        socket.on("time_tick", (data) => setTimeRemaining(data.timeRemaining));
        socket.on("game_over", (data) => {
            setGameState("GAME_OVER");
            setScoreboard(data.scoreboard);
        });

        // Update scores in real-time when someone guesses correctly
        socket.on("correct_guess", (data) => {
            if (data.scores) {
                setPlayerList(data.scores);
            }
        });

        return () => {
            socket.off("room_info", handleRoomInfo);
            socket.off("player_joined", handleRoomInfo);
            socket.off("player_left", handleRoomInfo);
            socket.off("game_started", handleGameStarted);

            socket.off("new_turn", handleNewTurn);
            socket.off("word_to_draw");
            socket.off("time_tick");
            socket.off("game_over");
            socket.off("correct_guess");
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [socket, roomId, setPlayerList, setCurrentDrawer, setWordHint, setCurrentRound, setGameState, setTimeRemaining, setCurrentWord]);
    return (
        <div className='p-2 flex flex-col gap-2 md:gap-4 w-full h-screen overflow-hidden border-purple-800 bg-[#fefce8] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] font-patrick'>

            {gameState === 'GAME_OVER' && <GameOverModal scoreboard={scoreboard} />}
            
            {showTurnModal && currentDrawer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-patrick">
                   <div className="bg-white border-4 border-purple-800 rounded-[30px] shadow-[8px_10px_0px_#D8B4FE] p-8 md:p-12 text-center">
                      <h2 className="text-4xl md:text-6xl font-black text-purple-900 tracking-wider mb-2">
                          {isMyTurn ? "Your Turn!" : `${currentDrawer.name}'s Turn!`}
                      </h2>
                      <p className="text-xl md:text-2xl text-purple-600 font-bold">
                          {isMyTurn ? "Get ready to draw!" : "Get ready to guess!"}
                      </p>

                      {/* FUTURE FEATURE STUB: Word Selection */}
                      {isMyTurn && gameState === 'CHOOSING_WORD' && (
                          <div className="mt-8 border-t-2 border-dashed border-purple-200 pt-6">
                             <h3 className="text-2xl font-bold text-purple-800 mb-4">Choose a word to draw:</h3>
                             <div className="flex gap-4 justify-center flex-wrap">
                                 {['Word 1', 'Word 2', 'Word 3', 'Word 4'].map(word => (
                                     <button key={word} className="px-6 py-2 bg-[#fefce8] border-4 border-purple-800 rounded-2xl text-xl font-bold text-purple-900 hover:bg-yellow-100 hover:-translate-y-1 transition-all shadow-[2px_3px_0px_#FCD34D]">
                                        {word}
                                     </button>
                                 ))}
                             </div>
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
            <div className="flex flex-col lg:flex-row gap-2 md:gap-4 flex-1 w-full min-h-0 pb-1 lg:pb-0 items-stretch">
                {/* Sidebar */}
                <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col min-h-0">
                    <PlayerList />
                </div>

                {/* Canvas Area  */}
                <div className="w-full flex-1 shrink flex flex-col min-h-0 bg-white border-2 border-dashed border-gray-300 rounded-3xl items-center justify-center overflow-hidden relative">
                    <CanvasBoard />
                </div>

                {/* Right Sidebar */}
                <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col min-h-0">
                    <ChatSection />
                </div>
            </div>
            <Tools />
        </div>
    )
}

export default MainGameScreen