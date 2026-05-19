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
        <div className={`w-full rounded-4xl h-20 flex items-center p-2 transition-all ${currentDrawer
            ? "bg-[#fef3c7] border-purple-600 border-2 shadow-sm -rotate-2"
            : "border border-gray-200 bg-white hover:bg-gray-50"
            }`}>
            <img src={avatarImg} className='w-12 h-12 rounded-full border border-purple-900 mr-3' alt="avatar" />

            <div className='flex flex-col justify-center flex-1 min-w-0'>
                <p className={`text-lg font-patrick leading-tight truncate ${currentDrawer ? "text-purple-800 font-bold" : "text-gray-800"}`}>
                    {name} {isYou && <span className="text-sm text-gray-500 font-normal ml-1 inline-block">(you)</span>}
                </p>
                <p className={`text-sm font-patrick px-2 py-0.5 mt-0.5 rounded-full inline-block w-fit ${currentDrawer ? "bg-white text-purple-700 font-bold" : "bg-gray-100 text-gray-600"
                    }`}>
                    {points} pts
                </p>
            </div>

            {currentDrawer && (
                <div ref={pencilRef} className="ml-auto text-xl" title="Currently Drawing">
                    <Pencil color="black" strokeWidth={1} absoluteStrokeWidth />
                </div>
            )}
        </div>
    )
}
