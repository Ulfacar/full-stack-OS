'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface RotatingTextProps {
  texts: string[]
  className?: string
  rotationInterval?: number
  staggerDuration?: number
}

export default function RotatingText({
  texts,
  className = '',
  rotationInterval = 2000,
  staggerDuration = 0.025,
}: RotatingTextProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setIndex(i => (i + 1) % texts.length), rotationInterval)
    return () => clearInterval(iv)
  }, [texts.length, rotationInterval])

  const chars = useMemo(() => {
    return texts[index].split('').map((c, i) => ({ char: c, i }))
  }, [texts, index])

  return (
    <span className={`inline-flex overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span key={index} className="inline-flex">
          {chars.map(({ char, i }) => (
            <motion.span
              key={`${index}-${i}`}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-120%', opacity: 0 }}
              transition={{
                type: 'spring', damping: 25, stiffness: 300,
                delay: i * staggerDuration
              }}
              className="inline-block"
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
