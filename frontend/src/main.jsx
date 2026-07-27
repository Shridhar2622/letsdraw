import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Route, Routes, Link, BrowserRouter } from "react-router-dom"
import { SocketProvider } from './context/SocketContext.jsx'
import { PlayerProvider } from './context/PlayerContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <PlayerProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </PlayerProvider>
    </AuthProvider>
  </BrowserRouter>
)
