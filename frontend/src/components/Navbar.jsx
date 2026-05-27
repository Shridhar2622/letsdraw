import React, { useEffect, useRef, useContext } from 'react'
import LOGO from '../assets/Profile/logo.png'
import { LogOut, Timer } from "lucide-react"
import { PlayerContext } from '../context/PlayerContext'
import { gsap } from "gsap"
import { useSocket } from '../context/SocketContext'
import { useNavigate } from 'react-router-dom'

function Navbar() {
  const socket = useSocket()
  const navigate = useNavigate()

  const { currentWord, setCurrentWord, gameSettings, currentRound, setCurrentRound, wordHint, setWordHint, currentDrawer, setCurrentDrawer, timeRemaining } = useContext(PlayerContext)

  const timerANIMATION = useRef(null)

  useEffect(() => {
    let anim;
    if (timerANIMATION.current) {
      anim = gsap.fromTo(timerANIMATION.current,
        { rotation: -10 },
        {
          rotation: 50,
          duration: 0.3,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut"
        })
    }

    // Cleanup to prevent duplicate, conflicting animations
    return () => {
      if (anim) anim.kill()
    }
  }, [])


  return (
    <div className="relative border-[3px] justify-between items-center px-4 md:px-8 bg-white border-purple-800 before:rounded-3xl md:before:rounded-[40px] before:content-[''] before:absolute before:inset-0 before:translate-x-1 before:translate-y-1.5 before:bg-purple-300 flex before:-z-10 w-full h-16 md:h-20 lg:h-24 rounded-3xl md:rounded-[40px]">

      {/* Brand & Logo */}
      <div className='w-auto lg:w-[30%] h-full flex items-center justify-center sm:justify-start gap-2 shrink-0 z-10'>
        <div className="w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 shrink-0 relative flex items-center justify-center -ml-2">
          <img src={LOGO} alt="logo" className="w-[180%] scale-[2.5] h-[180%] object-contain absolute" />
        </div>
        <div className='hidden sm:block text-2xl md:text-3xl lg:text-4xl text-purple-900 font-patrick whitespace-nowrap lg:ml-2'>doodle-dash</div>
      </div>

      {/* Game Info Panel (Middle Shape - Centered) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-2 sm:gap-4 xl:gap-6 px-3 sm:px-6 xl:px-8 w-auto min-w-[220px] sm:min-w-[300px] max-w-[85%] sm:max-w-[70%] lg:max-w-[55%] h-12 sm:h-14 xl:h-16 bg-[#fefce8] border-2 md:border-4 border-purple-800 -rotate-1 shadow-[2px_3px_0px_#FCD34D] md:shadow-[4px_5px_0px_#FCD34D] z-10 transition-all">

        {/* Round Counter */}
        <div className='flex flex-col items-center justify-center shrink-0'>
          <h1 className='font-patrick text-[10px] md:text-base xl:text-xl text-purple-800 leading-none mb-0.5 md:mb-1'>RND</h1>
          <h1 className='font-patrick text-xs md:text-lg xl:text-2xl text-purple-500 leading-none'>{currentRound || 1}/{gameSettings.maxRounds || 3}</h1>
        </div>

        <div className='w-0.5 h-8 md:h-10 xl:h-12 bg-gray-300 rotate-12 shrink-0'></div>

        {/* Current Word */}
        <div className='flex flex-col justify-center items-center h-full min-w-0'>
          <div className='font-patrick text-[10px] md:text-base xl:text-xl text-purple-800 whitespace-nowrap truncate hidden sm:block'>The word is</div>
          <div className='font-patrick text-sm sm:text-lg xl:text-2xl font-bold tracking-widest whitespace-nowrap overflow-hidden text-ellipsis w-full text-center'>
             {currentDrawer?.socketId === socket?.id ? currentWord : wordHint}
          </div>
        </div>

        <div className='w-0.5 h-8 md:h-10 xl:h-12 bg-gray-300 -rotate-12 shrink-0'></div>

        {/* Timer */}
        <div className='flex shrink-0 w-10 sm:w-16 xl:w-24 border-2 border-green-600 rounded-full items-center justify-center gap-0.5 sm:gap-1 xl:gap-2 h-6 sm:h-8 xl:h-10 bg-[#DCFCE7]'>
          <div ref={timerANIMATION} className="items-center justify-center hidden sm:flex">
            <Timer className="w-3 h-3 sm:w-4 sm:h-4 xl:w-5 xl:h-5 shrink-0" color="green" strokeWidth={2.5} />
          </div>
          <div className='text-xs sm:text-base xl:text-xl font-patrick text-green-600 font-bold'>{timeRemaining}</div>
        </div>
      </div>

      {/* Leave Button */}
      <div className="hidden sm:flex hover:scale-110 px-4 md:px-0 md:w-[15%] lg:w-[20%] xl:w-[15%] justify-end z-10">
        <div 
            onClick={() => { socket.emit("leave_room"); navigate("/"); }}
            className="flex transition-all hover:rotate-2 items-center justify-center gap-2 h-10 md:h-12 lg:h-14 bg-[#ffe3e3] border-2 border-red-600 -rotate-1 shadow-[3px_4px_0px_#FFA6A6] shrink-0 cursor-pointer px-4"
        >
          <LogOut className="w-5 h-5 md:w-6 md:h-6" color="red" strokeWidth={2} />
          <h1 className='text-lg md:text-xl text-red-600 font-patrick font-bold hidden md:block'>Leave</h1>
        </div>
      </div>

      {/* Small Screen Leave Button (Icon only) */}
      <div 
          onClick={() => { socket.emit("leave_room"); navigate("/"); }}
          className="sm:hidden flex items-center justify-center p-2 rounded-xl bg-[#ffe3e3] border-2 border-red-600 shadow-[2px_3px_0px_#FFA6A6] cursor-pointer z-10"
      >
        <LogOut className="w-5 h-5" color="red" strokeWidth={2} />
      </div>

    </div>
  )
}

export default Navbar