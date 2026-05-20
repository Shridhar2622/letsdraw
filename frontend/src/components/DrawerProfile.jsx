import React, { useEffect, useRef } from 'react'
import { gsap } from "gsap"
import { AVATARS } from '../context/Avtar'
import { Pencil } from "lucide-react"

export default function DrawerProfile({ currentDrawer, name, points, isYou, avatarId }) {
    const avatarObj = AVATARS.find(a => a.id === avatarId) || AVATARS[7]; // Default to cat if not found
    const avatarImg = avatarObj ? avatarObj.src : '';
    const pencilRef = useRef(null)
    useEffect(() => {
        let animation;
        if (currentDrawer && pencilRef.current) {
            animation = gsap.to(pencilRef.current, {
                y: -8,
                duration: 0.5,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut"
            })
        }
        return () => {
            if (animation) animation.kill();
        }
    }, [currentDrawer])
    return (
        <div className={`w-full rounded-[1.5rem] h-[4.5rem] flex items-center p-3 transition-all relative ${currentDrawer
            ? "bg-[#FFF8DC] border-purple-400 border-[2px] shadow-sm scale-[1.02] ml-1"
            : "border border-purple-200 bg-white hover:bg-purple-50"
            }`}>
            {/* Active Drawer decorative elements */}
            {currentDrawer && (
                <>
                    <svg className="absolute -top-3 -left-4 w-8 h-8 text-purple-600" viewBox="0 0 24 24">
                        <path d="M4 12 Q 8 6 12 4 M8 16 Q 14 10 18 8 M12 20 Q 18 14 22 12" fill="transparent" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </>
            )}

            <div className="relative">
                <div className={`absolute inset-0 rounded-full blur-[6px] opacity-40 ${currentDrawer ? 'bg-yellow-400' : 'bg-purple-200'}`}></div>
                <img src={avatarImg} className='relative w-12 h-12 rounded-full border border-purple-200 mr-4 bg-white' alt="avatar" />
            </div>

            <div className='flex flex-col justify-center flex-1 min-w-0'>
                <p className={`text-xl font-patrick leading-tight truncate font-bold ${currentDrawer ? "text-purple-900" : "text-purple-800"}`}>
                    {name} {isYou && <span className="text-sm text-purple-400 font-normal ml-1 inline-block">(you)</span>}
                </p>
                <p className={`text-sm font-patrick px-3 py-0.5 mt-0.5 rounded-full inline-block w-fit border ${currentDrawer ? "bg-[#FFF0BA] text-yellow-700 border-yellow-300 font-bold" : "bg-purple-50 text-purple-500 border-purple-100 font-semibold"
                    }`}>
                    {points} pts
                </p>
            </div>

            <div className="ml-auto flex items-center justify-center">
                {currentDrawer ? (
                    <div ref={pencilRef} className="w-8 h-8 rounded-full border border-yellow-600/30 flex items-center justify-center bg-[#FFF4CE]" title="Currently Drawing">
                        <Pencil color="#854D0E" size={16} strokeWidth={2.5} />
                    </div>
                ) : (
                    <div className="text-purple-200 text-2xl" title="Waiting">
                        ★
                    </div>
                )}
            </div>
        </div>
    )
}
