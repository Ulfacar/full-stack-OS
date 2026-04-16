'use client'

import { useState } from 'react'

interface CaseData {
  name: string
  tag: string
  description: string
  stats: { label: string; value: string; color?: string }[]
  result: string
}

export function CaseFlipCard({ data }: { data: CaseData }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className="group cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={() => setFlipped(!flipped)}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div
        className="relative w-full h-[320px] transition-transform duration-500 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl border border-[#E5E5E5] bg-gradient-to-br from-white to-[#FAFAFA] p-8 flex flex-col justify-between shadow-sm"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div>
            <div className="text-xs font-medium text-[#3B82F6] mb-3 uppercase tracking-wider">{data.tag}</div>
            <h3 className="text-2xl font-semibold tracking-tight text-[#0A0A0A] mb-3">{data.name}</h3>
            <p className="text-sm text-[#737373] leading-relaxed">{data.description}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
            <span className="w-6 h-[1px] bg-[#D4D4D4]" />
            Наведите, чтобы увидеть результаты
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] p-6 flex flex-col justify-between"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div>
            <div className="text-[10px] font-medium text-blue-200 mb-2 uppercase tracking-wider">Результаты</div>
            <h3 className="text-base font-semibold tracking-tight text-white mb-3">{data.name}</h3>
            <div className="grid grid-cols-2 gap-2">
              {data.stats.map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                  <div className="text-lg font-semibold tracking-tight mb-0 text-white">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-blue-100/70">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-blue-100/80 leading-relaxed">{data.result}</p>
        </div>
      </div>
    </div>
  )
}
