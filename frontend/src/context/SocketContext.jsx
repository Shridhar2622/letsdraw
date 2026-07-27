import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

// Generate a unique player ID per browser tab session
// This survives socket.io reconnects but is unique per tab
function getPlayerId() {
    let id = sessionStorage.getItem('doodle_player_id');
    if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem('doodle_player_id', id);
    }
    return id;
}

// 1. Create the Context
const SocketContext = createContext();

// 2. Create the Provider
export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        // Use user.id if logged in, otherwise use the random tab ID
        const playerId = user?.id || getPlayerId();

        // Initialize the socket connection
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const newSocket = io(backendUrl, {
            auth: { playerId }
        });
        setSocket(newSocket);

        // Cleanup: disconnect the socket when the provider unmounts or user changes
        return () => newSocket.close();
    }, [user?.id]);

    // Provide the socket instance to all children
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

// 3. Create a custom hook for easy access
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
