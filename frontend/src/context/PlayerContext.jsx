import { createContext, useState } from "react";

export const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
    const [PlayerAvtar, setPlayerAvtarState] = useState(() => localStorage.getItem('doodle_player_avatar') || null);
    const [PlayerName, setPlayerNameState] = useState(() => localStorage.getItem('doodle_player_name') || null);

    const setPlayerAvtar = (avatar) => {
        setPlayerAvtarState(avatar);
        if (avatar) localStorage.setItem('doodle_player_avatar', avatar);
        else localStorage.removeItem('doodle_player_avatar');
    };

    const setPlayerName = (name) => {
        setPlayerNameState(name);
        if (name) localStorage.setItem('doodle_player_name', name);
        else localStorage.removeItem('doodle_player_name');
    };

    const [playerList, setPlayerList] = useState([]); // Add playerList state
    const [roomId, setRoomId] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(0);

    // Drawing Tool State
    const [activeTool, setActiveTool] = useState('pencil');
    // Independent color memory
    const [toolColors, setToolColors] = useState({ pencil: '#000000', fill: '#000000', shape: '#000000' });
    const activeColor = toolColors[activeTool] || '#000000';
    const setActiveColor = (color) => setToolColors(prev => ({ ...prev, [activeTool]: color }));
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
        drawTime: 60,
        hints: 2
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
