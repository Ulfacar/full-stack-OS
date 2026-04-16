'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface TrueFocusProps {
  sentence?: string;
  separator?: string;
  manualMode?: boolean;
  enableHover?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
}

interface FocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const TrueFocus: React.FC<TrueFocusProps> = ({
  sentence = 'True Focus',
  separator = ' ',
  manualMode = false,
  enableHover = false,
  blurAmount = 5,
  borderColor = 'rgba(0,0,0,0.3)',
  glowColor = 'rgba(0,0,0,0.15)',
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  className = '',
}) => {
  const words = sentence.split(separator);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState<FocusRect>({
    x: 0, y: 0, width: 0, height: 0
  });

  // Auto-cycle (pauses when hovering if enableHover is true)
  useEffect(() => {
    if (manualMode) return;
    if (enableHover && isHovering) return;

    const interval = setInterval(
      () => { setCurrentIndex(prev => (prev + 1) % words.length); },
      (animationDuration + pauseBetweenAnimations) * 1000
    );
    return () => clearInterval(interval);
  }, [manualMode, enableHover, isHovering, animationDuration, pauseBetweenAnimations, words.length]);

  // Update focus rect position
  const updateRect = useCallback((index: number) => {
    if (!wordRefs.current[index] || !containerRef.current) return;
    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = wordRefs.current[index]!.getBoundingClientRect();
    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height
    });
  }, []);

  useEffect(() => {
    if (currentIndex >= 0) updateRect(currentIndex);
  }, [currentIndex, updateRect, words.length]);

  const handleMouseEnter = (index: number) => {
    if (manualMode || enableHover) {
      setIsHovering(true);
      setCurrentIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (manualMode || enableHover) {
      setIsHovering(false);
    }
  };

  return (
    <div className={`relative flex gap-[0.4em] justify-center items-center flex-wrap select-none ${className}`} ref={containerRef}>
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={index}
            ref={el => { if (el) wordRefs.current[index] = el; }}
            className="relative cursor-pointer"
            style={{
              filter: isActive ? 'blur(0px)' : `blur(${blurAmount}px)`,
              transition: `filter ${animationDuration}s ease`,
            }}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {word}
          </span>
        );
      })}

      <motion.div
        className="absolute top-0 left-0 pointer-events-none"
        style={{ boxSizing: 'content-box' }}
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: currentIndex >= 0 ? 1 : 0
        }}
        transition={{ duration: animationDuration }}
      >
        <span className="absolute -top-2.5 -left-2.5 w-4 h-4 border-t-[3px] border-l-[3px] rounded-[3px]" style={{ borderColor: borderColor, filter: `drop-shadow(0px 0px 4px ${glowColor})` }} />
        <span className="absolute -top-2.5 -right-2.5 w-4 h-4 border-t-[3px] border-r-[3px] rounded-[3px]" style={{ borderColor: borderColor, filter: `drop-shadow(0px 0px 4px ${glowColor})` }} />
        <span className="absolute -bottom-2.5 -left-2.5 w-4 h-4 border-b-[3px] border-l-[3px] rounded-[3px]" style={{ borderColor: borderColor, filter: `drop-shadow(0px 0px 4px ${glowColor})` }} />
        <span className="absolute -bottom-2.5 -right-2.5 w-4 h-4 border-b-[3px] border-r-[3px] rounded-[3px]" style={{ borderColor: borderColor, filter: `drop-shadow(0px 0px 4px ${glowColor})` }} />
      </motion.div>
    </div>
  );
};

export default TrueFocus;
