import React, { useContext } from 'react';
import DRAWERIMG from "../assets/Profile/ChatGPT Image Feb 28, 2026, 02_34_50 PM.png"
import DrawerProfile from './DrawerProfile';
import { PlayerContext } from '../context/PlayerContext';
import { useSocket } from '../context/SocketContext';

export default function PlayerList({ totalPlayers }) {
    const { playerList,gameSettings } = useContext(PlayerContext);
    const socket = useSocket();

    return (
        <div className="relative p-4 w-full h-full rounded-3xl border-[3px] border-purple-900 bg-white before:content-[''] before:absolute before:inset-0 before:translate-x-2 before:translate-y-2 before:bg-purple-500 before:rounded-3xl before:-z-10 flex flex-col">

            <div className='flex items-center justify-between mb-2 shrink-0'>
                <h3 className='text-purple-800 font-patrick text-2xl md:text-3xl tracking-wider'>
                    Drawers ({playerList?.length || 0}/{gameSettings.maxPlayers})
                </h3>
                <img className='w-16 h-12 md:w-20 md:h-16 object-contain' alt="players" src={DRAWERIMG} />
            </div>
            <div className='border-b-2 border-dashed border-gray-300 mb-4 shrink-0'></div>
            <div className='flex flex-col gap-3 overflow-y-auto w-full h-full pr-1'>
                {playerList && playerList.length > 0 ? (
                    playerList.map((player) => (
                        <DrawerProfile
                            key={player.socketId || player.id}
                            currentDrawer={player.isDrawer || false}
                            name={player.name}
                            points={player.score || 0}
                            isYou={socket && player.socketId === socket.id}
                            avatarId={player.avatar}
                        />
                    ))
                ) : (
                    <p className="font-patrick text-gray-500 text-center mt-4">Waiting for players...</p>
                )}
            </div>
        </div>
    );
}
