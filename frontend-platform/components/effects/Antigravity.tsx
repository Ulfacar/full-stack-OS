'use client'

import { useRef, useEffect, useCallback } from 'react'

interface AntigravityProps {
  count?: number
  magnetRadius?: number
  ringRadius?: number
  waveSpeed?: number
  waveAmplitude?: number
  particleSize?: number
  lerpSpeed?: number
  color?: string
  autoAnimate?: boolean
  particleVariance?: number
  rotationSpeed?: number
  depthFactor?: number
  pulseSpeed?: number
  particleShape?: 'circle' | 'capsule'
  fieldStrength?: number
}

interface Particle {
  x: number
  y: number
  baseX: number
  baseY: number
  vx: number
  vy: number
  size: number
  depth: number
  phase: number
  capsuleAngle: number
  capsuleLength: number
}

export default function Antigravity({
  count = 300,
  magnetRadius = 12,
  ringRadius = 14,
  waveSpeed = 0.4,
  waveAmplitude = 1,
  particleSize = 1.5,
  lerpSpeed = 0.09,
  color = '#3B82F6',
  autoAnimate = true,
  particleVariance = 1,
  depthFactor = 1,
  pulseSpeed = 3,
  particleShape = 'capsule',
  fieldStrength = 18,
}: AntigravityProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const particlesRef = useRef<Particle[]>([])
  const timeRef = useRef(0)
  const rafRef = useRef<number>(0)

  const scaledMagnetRadius = magnetRadius * 20
  const scaledRingRadius = ringRadius * 20

  const initParticles = useCallback((w: number, h: number) => {
    const particles: Particle[] = []
    for (let i = 0; i < count; i++) {
      const depth = 0.3 + Math.random() * 0.7
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        baseX: Math.random() * w,
        baseY: Math.random() * h,
        vx: 0,
        vy: 0,
        size: particleSize * (0.5 + Math.random() * particleVariance) * depth,
        depth,
        phase: Math.random() * Math.PI * 2,
        capsuleAngle: Math.random() * Math.PI,
        capsuleLength: particleSize * (1 + Math.random() * 2),
      })
    }
    particlesRef.current = particles
  }, [count, particleSize, particleVariance])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const parent = canvas.parentElement
    if (!parent) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = parent.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.scale(dpr, dpr)
      initParticles(rect.width, rect.height)
    }

    resize()
    window.addEventListener('resize', resize)

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    const animate = () => {
      const rect = parent.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      timeRef.current += 0.016

      ctx.clearRect(0, 0, w, h)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const t = timeRef.current

      // Parse color for alpha manipulation
      ctx.fillStyle = color

      for (const p of particlesRef.current) {
        // Wave motion
        if (autoAnimate) {
          const wave = Math.sin(t * waveSpeed + p.phase) * waveAmplitude * p.depth * depthFactor
          const waveY = Math.cos(t * waveSpeed * 0.7 + p.phase * 1.3) * waveAmplitude * 0.6 * p.depth * depthFactor
          p.baseX += Math.sin(t * 0.1 + p.phase) * 0.1
          p.baseY += Math.cos(t * 0.08 + p.phase) * 0.08

          // Keep in bounds
          if (p.baseX < 0) p.baseX = w
          if (p.baseX > w) p.baseX = 0
          if (p.baseY < 0) p.baseY = h
          if (p.baseY > h) p.baseY = 0

          var targetX = p.baseX + wave * 15
          var targetY = p.baseY + waveY * 15
        } else {
          var targetX = p.baseX
          var targetY = p.baseY
        }

        // Magnetic repulsion from mouse
        const dx = p.x - mx
        const dy = p.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < scaledMagnetRadius && dist > 0) {
          const force = (1 - dist / scaledMagnetRadius) * fieldStrength
          const angle = Math.atan2(dy, dx)
          targetX += Math.cos(angle) * force * 8
          targetY += Math.sin(angle) * force * 8
        }

        // Ring attraction
        if (dist > scaledMagnetRadius && dist < scaledRingRadius && dist > 0) {
          const ringForce = (1 - Math.abs(dist - (scaledMagnetRadius + scaledRingRadius) / 2) / ((scaledRingRadius - scaledMagnetRadius) / 2)) * 0.5
          const angle = Math.atan2(dy, dx)
          targetX -= Math.cos(angle) * ringForce * 3
          targetY -= Math.sin(angle) * ringForce * 3
        }

        // Lerp to target
        p.x += (targetX - p.x) * lerpSpeed
        p.y += (targetY - p.y) * lerpSpeed

        // Pulse
        const pulse = 1 + Math.sin(t * pulseSpeed + p.phase) * 0.15
        const currentSize = p.size * pulse

        // Alpha based on depth
        const alpha = 0.2 + p.depth * 0.6

        ctx.save()
        ctx.globalAlpha = alpha

        if (particleShape === 'capsule') {
          ctx.translate(p.x, p.y)
          ctx.rotate(p.capsuleAngle + t * 0.2 * p.depth)
          ctx.beginPath()
          const cl = p.capsuleLength * pulse
          const cr = currentSize * 0.5
          ctx.moveTo(-cl, -cr)
          ctx.lineTo(cl, -cr)
          ctx.arc(cl, 0, cr, -Math.PI / 2, Math.PI / 2)
          ctx.lineTo(-cl, cr)
          ctx.arc(-cl, 0, cr, Math.PI / 2, -Math.PI / 2)
          ctx.closePath()
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [
    count, magnetRadius, ringRadius, waveSpeed, waveAmplitude,
    particleSize, lerpSpeed, color, autoAnimate, particleVariance,
    depthFactor, pulseSpeed, particleShape, fieldStrength,
    initParticles, scaledMagnetRadius, scaledRingRadius,
  ])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
      }}
    />
  )
}
