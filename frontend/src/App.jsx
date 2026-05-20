import { useState } from 'react'
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

function App() {
  const [count, setCount] = useState(0)

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
