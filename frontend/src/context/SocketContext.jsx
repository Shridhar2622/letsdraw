import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// 1. Create the Context
const SocketContext = createContext();

// 2. Create the Provider
export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Initialize the socket connection when the provider mounts
        // Use environment variable for production, fallback to localhost for dev
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const newSocket = io(backendUrl);
        setSocket(newSocket);

        // Cleanup: disconnect the socket when the provider unmounts
        return () => newSocket.close();
    }, []);

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
