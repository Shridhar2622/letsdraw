import React, { useState, useRef, useContext, useEffect } from 'react'
import { Socket } from 'socket.io-client';
import { useSocket } from '../context/SocketContext';
import { PlayerContext } from '../context/PlayerContext';
import { useNavigate } from 'react-router-dom';

function JoinRoom({ show, set }) {
    const { roomId: room, setRoomId: setRoom, PlayerName, PlayerAvtar } = useContext(PlayerContext)
    const socket = useSocket()
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState(["", "", "", ""]);
    const inputRefs = useRef([]);
    // Initialize the ref array
    if (inputRefs.current.length !== 4) {
        inputRefs.current = Array(4).fill(null);
    }

    useEffect(() => {
        if (!socket) return;


        const handlePlayerJoined = (data) => {
            console.log("Joined room successfully!", data);
            set(false); // Close modal
            setRoom(data.roomId);
            // If game is already playing, go directly to the game screen
            if (data.status === "PLAYING") {
                navigate(`/game/${data.roomId}`);
            } else {
                navigate(`/room/${data.roomId}`);
            }
        };

        const handleError = (data) => {
            alert(data.message || "An error occurred");
            // If they tried to join via URL and it failed, clear the URL so they can try manually
            if (window.location.search.includes("join=")) {
                navigate("/", { replace: true });
            }
        };

        socket.on("player_joined", handlePlayerJoined);
        socket.on("error", handleError);

        return () => {
            socket.off("player_joined", handlePlayerJoined);
            socket.off("error", handleError);
        };
    }, [socket, navigate, set, roomId]);

    const handleChange = (index, value) => {
        // Only allow alphanumeric characters (A-Z, 0-9)
        const sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        // Take only the last character entered
        const finalChar = sanitizedValue.slice(-1);

        const newRoomId = [...roomId];
        newRoomId[index] = finalChar;
        setRoomId(newRoomId);

        // Auto focus to the next input if a character was entered
        if (finalChar && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // If backspace is pressed and the input is empty, focus the previous input
        if (e.key === "Backspace" && !roomId[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        // Prevent default paste
        e.preventDefault();
        
        // Get pasted text, strip non-alphanumeric, and make uppercase
        const pasteData = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (!pasteData) return;
        
        const newRoomId = [...roomId];
        for (let i = 0; i < 4; i++) {
            if (pasteData[i]) {
                newRoomId[i] = pasteData[i];
            }
        }
        setRoomId(newRoomId);
        
        // Move focus to the end of the pasted text (max index 3)
        const focusIndex = Math.min(pasteData.length, 3);
        inputRefs.current[focusIndex]?.focus();
    };

    const handleCancel = (e) => {
        set(false)
    }

    const handleJoinClick = () => {
        const fullCode = roomId.join('');
        if (fullCode.length !== 4) {
            alert("Please enter a valid 4-character room code.");
            return;
        }

        // User can add their real socket.emit here later
        const data = {
            roomId: roomId.join(""),
            name: PlayerName,
            avatar: PlayerAvtar
        }


        socket.emit("join_room", data)
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-patrick transition-opacity duration-300 ${show ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
            {/* Main Modal Card */}
            <div className={`bg-white border-4 border-purple-800 rounded-[30px] shadow-[8px_10px_0px_#D8B4FE] p-6 md:p-8 w-full max-w-md relative flex flex-col items-center transition-all duration-300 transform ${show ? "scale-100 translate-y-0" : "scale-95 translate-y-8"}`}>

                {/* Optional Close Button Placeholder (User can wire this up to state) */}
                <button onClick={handleCancel} className="absolute -top-4 -right-4 bg-red-400 w-10 h-10 rounded-full border-4 border-purple-800 flex items-center justify-center text-white font-bold text-xl hover:bg-red-500 hover:-translate-y-1 transition-transform shadow-[4px_5px_0px_#D8B4FE] active:translate-y-0 active:shadow-none">
                    ✕
                </button>

                {/* Title */}
                <h2 className="text-3xl font-bold text-purple-900 mb-2">Join a Room</h2>
                <p className="text-purple-600 font-bold mb-6 text-center">Enter the 4-character code to play together!</p>

                {/* User can add their inputs and buttons here */}
                <div className="w-full flex justify-center gap-2 md:gap-4 mb-8">
                    {roomId.map((value, index) => {
                        return (
                            <input
                                key={index}
                                ref={(el) => inputRefs.current[index] = el}
                                value={value}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className="w-14 h-16 md:w-16 md:h-18 text-center text-3xl font-bold uppercase bg-[#fefce8] border-4 border-purple-800 rounded-2xl shadow-[4px_5px_0px_#D8B4FE] focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:-translate-y-1 transition-all"
                                maxLength={2} // allow 2 so onChange catches the new char on mobile sometimes
                            />
                        )
                    })}
                </div>

                <button
                    onClick={handleJoinClick}
                    className="w-full bg-green-500 border-4 border-green-700 rounded-2xl py-3 px-6 text-2xl font-bold text-white shadow-[4px_5px_0px_#166534] transition-all hover:-translate-y-1 hover:shadow-[4px_8px_0px_#166534] active:translate-y-1 active:shadow-[0px_0px_0px_#166534]"
                >
                    Let's Go!
                </button>

            </div>
        </div>
    )
}

export default JoinRoom