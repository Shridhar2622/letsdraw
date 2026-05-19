import { useState } from 'react'
import reactLogo from './assets/react.svg'
import PlayerList from './components/PlayerList'
import viteLogo from '/vite.svg'
import MainGameScreen from './pages/MainGameScreen'
import HomePage from './pages/HomePage'
import './App.css'
import Navbar from './components/Navbar'
import { Route, Routes, Link, BrowserRouter } from "react-router-dom"
import ChatSection from './components/ChatSection'
import CreateGame from './pages/CreateGame'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/game" element={<MainGameScreen />} />
      <Route path="/createGame" element={<CreateGame />} />
    </Routes>
  )
}

export default App
