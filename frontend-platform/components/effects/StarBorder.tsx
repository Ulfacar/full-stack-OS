'use client'

import React from 'react'

interface StarBorderProps {
  className?: string
  children?: React.ReactNode
  color?: string
  speed?: string
  thickness?: number
}

const StarBorder: React.FC<StarBorderProps> = ({
  className = '',
  color = 'white',
  speed = '6s',
  thickness = 1,
  children,
}) => {
  return (
    <div
      className={`relative inline-block overflow-hidden rounded-[20px] ${className}`}
      style={{ padding: `${thickness}px 0` }}
    >
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animation: `star-bottom ${speed} linear infinite alternate`,
        }}
      />
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animation: `star-top ${speed} linear infinite alternate`,
        }}
      />
      <div className="relative z-[1] bg-gradient-to-b from-gray-900 to-black border border-gray-800 text-white text-center py-4 px-6 rounded-[20px]">
        {children}
      </div>
      <style jsx>{`
        @keyframes star-bottom {
          0% { transform: translate(0%, 0%); opacity: 1; }
          100% { transform: translate(-100%, 0%); opacity: 0; }
        }
        @keyframes star-top {
          0% { transform: translate(0%, 0%); opacity: 1; }
          100% { transform: translate(100%, 0%); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default StarBorder
