'use client'

import { useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { motion, useMotionValue, useAnimationFrame, useTransform } from 'framer-motion'

interface GradientTextProps {
  children: ReactNode
  className?: string
  colors?: string[]
  animationSpeed?: number
  showBorder?: boolean
}

export default function GradientText({
  children,
  className = '',
  colors = ['#5227FF', '#FF9FFC', '#B19EEF'],
  animationSpeed = 8,
  showBorder = false,
}: GradientTextProps) {
  const progress = useMotionValue(0)
  const elapsedRef = useRef(0)
  const lastTimeRef = useRef<number | null>(null)
  const dur = animationSpeed * 1000

  useAnimationFrame(time => {
    if (lastTimeRef.current === null) { lastTimeRef.current = time; return }
    const dt = time - lastTimeRef.current
    lastTimeRef.current = time
    elapsedRef.current += dt
    const full = dur * 2
    const ct = elapsedRef.current % full
    progress.set(ct < dur ? (ct / dur) * 100 : 100 - ((ct - dur) / dur) * 100)
  })

  const backgroundPosition = useTransform(progress, p => `${p}% 50%`)
  const gradientColors = [...colors, colors[0]].join(', ')
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${gradientColors})`,
    backgroundSize: '300% 100%',
    backgroundRepeat: 'repeat' as const,
  }

  return (
    <motion.div className={`relative inline-flex items-center justify-center overflow-hidden cursor-pointer ${showBorder ? 'py-1 px-2 rounded-[1.25rem]' : ''} ${className}`}>
      {showBorder && (
        <motion.div className="absolute inset-0 z-0 pointer-events-none rounded-[1.25rem]" style={{ ...gradientStyle, backgroundPosition }}>
          <div className="absolute bg-black rounded-[1.25rem] z-[-1]" style={{ width: 'calc(100% - 2px)', height: 'calc(100% - 2px)', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
        </motion.div>
      )}
      <motion.div className="inline-block relative z-[2] text-transparent bg-clip-text" style={{ ...gradientStyle, backgroundPosition, WebkitBackgroundClip: 'text' }}>
        {children}
      </motion.div>
    </motion.div>
  )
}
