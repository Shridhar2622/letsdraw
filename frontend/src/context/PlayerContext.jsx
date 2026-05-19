import { createContext, useState } from "react";

export const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
    const [PlayerAvtar, setPlayerAvtar] = useState(null);
    const [PlayerName, setPlayerName] = useState(null);
    const [playerList, setPlayerList] = useState([]); // Add playerList state
    const [roomId, setRoomId] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(0);

    // Drawing Tool State
    const [activeTool, setActiveTool] = useState('pencil');
    const [activeColor, setActiveColor] = useState('#000000');
    // Independent stroke size memory
    const [brushSizes, setBrushSizes] = useState({ pencil: 5, eraser: 20, fill: 5 });
    const brushSize = brushSizes[activeTool] || 5;
    const setBrushSize = (size) => setBrushSizes(prev => ({ ...prev, [activeTool]: size }));

    // Game State
    const [currentDrawer, setCurrentDrawer] = useState(null);
    const [currentWord, setCurrentWord] = useState(null);
    const [wordHint, setWordHint] = useState("");
    const [currentRound, setCurrentRound] = useState(1);
    const [gameState, setGameState] = useState("LOBBY");
    const [gameSettings, setGameSettings] = useState({
        maxPlayers: 8,
        maxRounds: 3,
        drawTime: 60
    });

    return (
        <PlayerContext.Provider value={{
            PlayerAvtar, setPlayerAvtar,
            PlayerName, setPlayerName,
            playerList, setPlayerList,
            currentDrawer, setCurrentDrawer,
            wordHint, setWordHint,
            currentRound, setCurrentRound,
            gameState, setGameState,
            gameSettings, setGameSettings,
            currentWord, setCurrentWord,
            roomId, setRoomId,
            timeRemaining, setTimeRemaining,
            activeTool, setActiveTool,
            activeColor, setActiveColor,
            brushSize, setBrushSize
        }}>
            {children}
        </PlayerContext.Provider>
    );
};
