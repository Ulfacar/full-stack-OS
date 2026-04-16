'use client'

import React, { useRef, useEffect, useCallback } from 'react'

interface ClickSparkProps {
  sparkColor?: string
  sparkSize?: number
  sparkRadius?: number
  sparkCount?: number
  duration?: number
  children?: React.ReactNode
}

interface Spark {
  x: number; y: number; angle: number; startTime: number
}

const ClickSpark: React.FC<ClickSparkProps> = ({
  sparkColor = '#000',
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  children
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sparksRef = useRef<Spark[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const resize = () => {
      const { width, height } = parent.getBoundingClientRect()
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width; canvas.height = height
      }
    }
    const ro = new ResizeObserver(resize)
    ro.observe(parent)
    resize()
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let id: number
    const draw = (ts: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      sparksRef.current = sparksRef.current.filter(s => {
        const elapsed = ts - s.startTime
        if (elapsed >= duration) return false
        const p = elapsed / duration
        const eased = p * (2 - p)
        const dist = eased * sparkRadius
        const len = sparkSize * (1 - eased)
        const x1 = s.x + dist * Math.cos(s.angle)
        const y1 = s.y + dist * Math.sin(s.angle)
        const x2 = s.x + (dist + len) * Math.cos(s.angle)
        const y2 = s.y + (dist + len) * Math.sin(s.angle)
        ctx.strokeStyle = sparkColor
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        return true
      })
      id = requestAnimationFrame(draw)
    }
    id = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(id)
  }, [sparkColor, sparkSize, sparkRadius, duration])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    const now = performance.now()
    sparksRef.current.push(...Array.from({ length: sparkCount }, (_, i) => ({
      x, y, angle: (2 * Math.PI * i) / sparkCount, startTime: now
    })))
  }

  return (
    <div className="relative w-full h-full" onClick={handleClick}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-50" />
      {children}
    </div>
  )
}

export default ClickSpark
