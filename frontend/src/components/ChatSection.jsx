import React, { useContext, useState, useEffect, useRef } from 'react'
import { MessageSquare, SendHorizontal } from "lucide-react"
import { PlayerContext } from '../context/PlayerContext'
import { useSocket } from '../context/SocketContext'

function Messages({ name, text, isYou }) {
  return (
    <div className={`flex flex-col w-full mb-3 ${isYou ? 'items-end' : 'items-start'}`}>
      <label className='text-purple-600 px-3 mb-0.5 text-sm font-patrick tracking-wide'>{name}</label>
      <div className={`flex justify-start px-4 py-2 items-center rounded-2xl border-2 w-fit max-w-[85%] ${isYou
        ? 'bg-[#fefce8] border-purple-300 rounded-tr-none'
        : 'bg-white border-purple-200 rounded-tl-none'
        }`}>
        <h1 className='text-lg font-patrick text-purple-900 leading-tight'>{text}</h1>
      </div>
    </div>
  )
}

function SystemMessage({ text }) {
  return (
    <div className='flex justify-center my-2'>
      <div className='bg-green-100 border-2 border-green-400 rounded-full px-4 py-1'>
        <h1 className='text-sm font-patrick text-green-700 font-bold'>🎉 {text}</h1>
      </div>
    </div>
  )
}

function ChatSection() {
  const socket = useSocket()
  const { roomId, PlayerName, currentDrawer } = useContext(PlayerContext)
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for chat events
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data) => {
      setMessages(prev => [...prev, { name: data.name, text: data.message, type: "chat" }]);
    };

    const handleCorrectGuess = (data) => {
      setMessages(prev => [...prev, { name: data.playerName, text: `${data.playerName} guessed the word!`, type: "correct" }]);
    };

    const handleSystemMessage = (data) => {
      setMessages(prev => [...prev, { text: data.message || data.text, type: data.type || "system" }]);
    };

    const handleClearChat = () => {
      setMessages([]);
    };

    socket.on("chat_message", handleChatMessage);
    socket.on("correct_guess", handleCorrectGuess);
    socket.on("system_message", handleSystemMessage);
    socket.on("new_turn", handleClearChat);
    socket.on("choosing_word", handleClearChat);
    socket.on("game_restarted", handleClearChat);

    return () => {
      socket.off("chat_message", handleChatMessage);
      socket.off("correct_guess", handleCorrectGuess);
      socket.off("system_message", handleSystemMessage);
      socket.off("new_turn", handleClearChat);
      socket.off("choosing_word", handleClearChat);
      socket.off("game_restarted", handleClearChat);
    };
  }, [socket]);

  function handleSend() {
    if (!message.trim()) return;
    socket.emit("send_guess", { roomId, message });
    setMessage("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSend();
  }

  return (
    <div className="relative p-3 md:p-4 w-full flex-1 min-h-0 rounded-3xl border-[3px] border-purple-900 bg-[#f8f5fc] before:content-[''] before:absolute before:inset-0 before:translate-x-2 before:translate-y-2 before:bg-purple-300 before:rounded-3xl before:-z-10 flex flex-col">

      {/* Header */}
      <div className='flex items-center justify-between mb-2 shrink-0 border-b-2 border-dashed border-purple-200 pb-2'>
        <div className='flex items-center gap-2'>
          <MessageSquare className='text-purple-600' strokeWidth={2} />
          <h1 className='font-patrick text-2xl md:text-3xl text-purple-800 tracking-wide'>Doodle-chat</h1>
        </div>
      </div>

      {/* Chat Messages */}
      <div className='chat flex-1 min-h-0 flex flex-col overflow-y-auto px-1 pr-2 mt-2 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent'>
        {messages.map((msg, i) => {
          if (msg.type === "correct") {
            return <SystemMessage key={i} text={msg.text} />;
          } else if (msg.type === "system") {
            return (
              <div key={i} className='flex justify-center my-1'>
                <div className='bg-gray-200 rounded-full px-3 py-0.5 opacity-80'>
                   <span className='text-xs font-patrick text-gray-600 font-bold'>ℹ️ {msg.text}</span>
                </div>
              </div>
            );
          } else if (msg.type === "close") {
            return (
              <div key={i} className='flex justify-center my-1'>
                <div className='bg-yellow-100 border-2 border-yellow-400 rounded-full px-4 py-1'>
                   <span className='text-sm font-patrick text-yellow-700 font-bold'>💡 {msg.text}</span>
                </div>
              </div>
            );
          } else {
            return <Messages key={i} name={msg.name} text={msg.text} isYou={msg.name === PlayerName} />;
          }
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className={`flex items-center gap-2 mt-3 shrink-0 p-1 rounded-full border-2 shadow-sm ${currentDrawer?.socketId === socket?.id ? 'bg-gray-200 border-gray-300' : 'bg-white border-purple-200'}`}>
        <input
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          value={message}
          disabled={currentDrawer?.socketId === socket?.id}
          placeholder={currentDrawer?.socketId === socket?.id ? "You are drawing! 🎨" : 'Guess the word...'}
          className='flex-1 px-4 py-2 font-patrick text-lg text-purple-900 bg-transparent outline-none placeholder:text-purple-300 disabled:text-gray-500 disabled:placeholder:text-gray-500'
        />
        <button
          onClick={handleSend}
          disabled={currentDrawer?.socketId === socket?.id}
          className='w-10 h-10 shrink-0 flex items-center justify-center bg-purple-500 rounded-full hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100 hover:scale-105 active:scale-95'
        >
          <SendHorizontal className='text-white w-5 h-5 -ml-0.5' strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

export default ChatSection