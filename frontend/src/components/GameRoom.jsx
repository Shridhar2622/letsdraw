import React from 'react';
import PlayerList from './PlayerList';
import CanvasBoard from './CanvasBoard';
import ChatBox from './ChatBox';

export default function GameRoom() {
    // TODO: Listen for 'game_started', 'new_turn', 'game_over' events to manage the room UI
    // TODO: Display the current word hint (e.g., "A _ _ L E") at the top
    // TODO: Display the timer at the top
    // TODO: Render the Start Game button if the user is the host and the game hasn't started yet

    return (
        <div className="game-room">
            {/* Header: Word Hint, Timer, Start Button */}
            <div className="game-header">
                {/* Header content */}
            </div>

            <div className="game-layout">
                {/* Left Sidebar: Players */}
                <PlayerList />

                {/* Center: Canvas */}
                <CanvasBoard />

                {/* Right Sidebar: Chat */}
                <ChatBox />
            </div>
        </div>
    );
}
