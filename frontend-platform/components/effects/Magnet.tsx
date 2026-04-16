'use client'

import React, { useState, useEffect, useRef, ReactNode } from 'react'

interface MagnetProps {
  children: ReactNode
  padding?: number
  disabled?: boolean
  magnetStrength?: number
  className?: string
}

const Magnet: React.FC<MagnetProps> = ({
  children,
  padding = 100,
  disabled = false,
  magnetStrength = 2,
  className = '',
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isActive, setIsActive] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled) { setPosition({ x: 0, y: 0 }); return }
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return
      const { left, top, width, height } = ref.current.getBoundingClientRect()
      const cx = left + width / 2, cy = top + height / 2
      const dx = Math.abs(cx - e.clientX), dy = Math.abs(cy - e.clientY)
      if (dx < width / 2 + padding && dy < height / 2 + padding) {
        setIsActive(true)
        setPosition({ x: (e.clientX - cx) / magnetStrength, y: (e.clientY - cy) / magnetStrength })
      } else {
        setIsActive(false)
        setPosition({ x: 0, y: 0 })
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [padding, disabled, magnetStrength])

  return (
    <div ref={ref} className={className} style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: isActive ? 'transform 0.3s ease-out' : 'transform 0.5s ease-in-out',
        willChange: 'transform'
      }}>
        {children}
      </div>
    </div>
  )
}

export default Magnet
