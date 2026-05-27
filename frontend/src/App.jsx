import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import PlayerList from './components/PlayerList'
import viteLogo from '/vite.svg'
import MainGameScreen from './pages/MainGameScreen'
import HomePage from './pages/HomePage'
import './App.css'
import Navbar from './components/Navbar'
import { Route, Routes, Navigate } from "react-router-dom"
import ChatSection from './components/ChatSection'
import CreateGame from './pages/CreateGame'
import { useSocket } from './context/SocketContext'
import LOGO from './assets/Profile/logo.png'

function App() {
  const socket = useSocket()
  const [isConnected, setIsConnected] = useState(false)

  // Track actual socket connection
  useEffect(() => {
    if (!socket) return;
    
    function onConnect() {
      setIsConnected(true);
    }
    function onDisconnect() {
      setIsConnected(false);
    }

    if (socket.connected) {
      setIsConnected(true);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  const showLoading = !isConnected;

  if (showLoading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#fefce8] font-patrick overflow-hidden">
        <div className="z-10 flex flex-col items-center">
          
          <div className="relative w-32 h-32 md:w-40 md:h-40 mb-6 animate-bounce">
            <img src={LOGO} alt="doodle-dash logo" className="w-[150%] scale-150 h-[150%] object-contain absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          <div className="bg-white border-4 border-purple-800 rounded-[30px] p-8 md:p-12 max-w-md md:max-w-lg text-center shadow-[6px_8px_0px_#D8B4FE]">
            <h1 className="text-4xl md:text-5xl text-purple-900 font-bold mb-4 tracking-wider">
              Starting Server...
            </h1>
            <p className="text-purple-600 text-xl font-semibold mb-8">
              Hang tight! The servers are waking up from sleep mode. This usually takes about 30 seconds.
            </p>
            
            <div className="flex items-center justify-center gap-3 bg-[#fefce8] border-2 border-purple-300 rounded-full py-3 px-6 w-max mx-auto shadow-sm">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 md:w-4 md:h-4 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 md:w-4 md:h-4 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/game/:roomId" element={<MainGameScreen />} />
      <Route path="/room/:roomId" element={<CreateGame />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
