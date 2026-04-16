'use client'

// Step 1: Clipboard with pen that writes lines realistically
// Pen tip follows each line as it draws, then hops to next line
export function ClipboardWriteIcon() {
  // Total cycle: 4.5s (3 lines × 1s draw + 0.5s pause each, then 1.5s reset)
  const dur = '4.5s'

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Clipboard body */}
      <rect x="5" y="4" width="18" height="20" rx="2.5" stroke="#0A0A0A" strokeWidth="1.4" fill="none" />
      {/* Clipboard clip */}
      <path d="M11 4V3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" stroke="#0A0A0A" strokeWidth="1.4" strokeLinecap="round" />

      {/* Line 1: draws from x=9 to x=19 at y=10 */}
      <line x1="9" y1="10" x2="19" y2="10" stroke="#0A0A0A" strokeWidth="1" strokeLinecap="round" strokeDasharray="10" strokeDashoffset="10">
        <animate attributeName="stroke-dashoffset" values="10;0;0;0;0;10" keyTimes="0;0.2;0.33;0.66;0.85;1" dur={dur} repeatCount="indefinite" />
      </line>

      {/* Line 2: draws from x=9 to x=17 at y=14 */}
      <line x1="9" y1="14" x2="17" y2="14" stroke="#0A0A0A" strokeWidth="1" strokeLinecap="round" strokeDasharray="8" strokeDashoffset="8">
        <animate attributeName="stroke-dashoffset" values="8;8;0;0;0;8" keyTimes="0;0.22;0.44;0.66;0.85;1" dur={dur} repeatCount="indefinite" />
      </line>

      {/* Line 3: draws from x=9 to x=14 at y=18 */}
      <line x1="9" y1="18" x2="14" y2="18" stroke="#0A0A0A" strokeWidth="1" strokeLinecap="round" strokeDasharray="5" strokeDashoffset="5">
        <animate attributeName="stroke-dashoffset" values="5;5;5;0;0;5" keyTimes="0;0.44;0.5;0.66;0.85;1" dur={dur} repeatCount="indefinite" />
      </line>

      {/* Pen — moves along: start of line1 → end of line1 → start of line2 → end of line2 → start of line3 → end of line3 → lift */}
      <g>
        {/* Pen x position: follows tip of each line */}
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 10,0; 10,0; 0,4; 8,4; 8,4; 0,8; 5,8; 5,8; 0,0"
          keyTimes="0; 0.2; 0.22; 0.24; 0.44; 0.48; 0.5; 0.66; 0.85; 1"
          dur={dur}
          repeatCount="indefinite"
        />
        {/* Pen shape — angled pencil */}
        <line x1="9" y1="10" x2="7" y2="6" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="9" cy="10" r="0.6" fill="#3B82F6" />
      </g>
    </svg>
  )
}

// Step 2: Sparkles that rotate, pulse and twinkle
export function SparklesAnimIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main star */}
      <g>
        <animateTransform attributeName="transform" type="rotate" values="0 14 14;15 14 14;0 14 14;-15 14 14;0 14 14" dur="3s" repeatCount="indefinite" />
        <path d="M14 3l2.5 8.5L25 14l-8.5 2.5L14 25l-2.5-8.5L3 14l8.5-2.5Z" stroke="#3B82F6" strokeWidth="1.3" strokeLinejoin="round" fill="none">
          <animate attributeName="stroke-width" values="1.3;2;1.3" dur="1.5s" repeatCount="indefinite" />
        </path>
      </g>
      {/* Small sparkle top-right */}
      <circle cx="22" cy="6" r="1.2" fill="#3B82F6">
        <animate attributeName="r" values="0;1.2;0" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* Small sparkle bottom-left */}
      <circle cx="6" cy="22" r="1" fill="#3B82F6">
        <animate attributeName="r" values="0;1;0" dur="2s" begin="0.7s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.7s" repeatCount="indefinite" />
      </circle>
      {/* Tiny sparkle */}
      <circle cx="22" cy="20" r="0.8" fill="#3B82F6">
        <animate attributeName="r" values="0;0.8;0" dur="1.8s" begin="1.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="1.8s" begin="1.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

// Step 3: Chat bubble with pulsing dots that turn into a checkmark
export function ChatBotIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Chat bubble */}
      <path d="M4 6a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3h-5l-4 4v-4H7a3 3 0 0 1-3-3V6Z" stroke="#10B981" strokeWidth="1.5" fill="none">
        <animate attributeName="stroke-width" values="1.5;1.8;1.5" dur="2s" repeatCount="indefinite" />
      </path>
      {/* Dot 1 */}
      <circle cx="10" cy="11.5" r="1.3" fill="#10B981">
        <animate attributeName="cy" values="11.5;10;11.5" dur="1.2s" repeatCount="indefinite" />
      </circle>
      {/* Dot 2 */}
      <circle cx="14" cy="11.5" r="1.3" fill="#10B981">
        <animate attributeName="cy" values="11.5;10;11.5" dur="1.2s" begin="0.15s" repeatCount="indefinite" />
      </circle>
      {/* Dot 3 */}
      <circle cx="18" cy="11.5" r="1.3" fill="#10B981">
        <animate attributeName="cy" values="11.5;10;11.5" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}
