import { useEffect, useState, useContext } from 'react'
import { useSocket } from '../context/SocketContext'
import { useNavigate, useParams } from 'react-router-dom'

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
        roomId: contextRoomId,
        setRoomId,
        setPlayerList,
        PlayerName,
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
    const navigate = useNavigate();
    const { roomId: urlRoomId } = useParams();
    const roomId = contextRoomId || urlRoomId;
    const [scoreboard, setScoreboard] = useState(null);
    const [wordChoices, setWordChoices] = useState([]);

    const handleWordChoice = (word) => {
        if (socket && roomId) {
            socket.emit("word_chosen", { roomId, word });
        }
    };
    
    const isMyTurn = currentDrawer?.socketId === socket?.id;

    useEffect(() => {
        if (!socket || !PlayerName) {
            navigate(`/?join=${urlRoomId || roomId || ''}`);
            return;
        }
        
        if (!contextRoomId && urlRoomId) {
            setRoomId(urlRoomId);
        }

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

        socket.on("room_info", handleRoomInfo);
        socket.on("player_joined", handleRoomInfo);
        socket.on("player_left", handleRoomInfo);

        socket.on("choosing_word", handleChoosingWord);
        socket.on("word_choices", (data) => setWordChoices(data.words));
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
            socket.off("choosing_word");
            socket.off("word_choices");
            socket.off("new_turn");
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
            
            {gameState === 'CHOOSING_WORD' && currentDrawer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-patrick">
                   <div className="bg-white border-4 border-purple-800 rounded-[30px] shadow-[8px_10px_0px_#D8B4FE] p-8 md:p-12 text-center">
                      <h2 className="text-4xl md:text-6xl font-black text-purple-900 tracking-wider mb-2">
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
                          <div className="flex justify-center mt-4">
                             <div className="w-8 h-8 border-4 border-purple-800 border-t-transparent rounded-full animate-spin"></div>
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