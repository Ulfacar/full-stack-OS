'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import './CardNav.css'

interface NavCard {
  label: string
  href: string
  description: string
  bgColor: string
  textColor: string
}

interface CardNavProps {
  cards: NavCard[]
}

export default function CardNav({ cards }: CardNavProps) {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([])
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  const calculateHeight = () => {
    const navEl = navRef.current
    if (!navEl) return 260

    const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement
    if (contentEl) {
      const wasVisibility = contentEl.style.visibility
      const wasPointerEvents = contentEl.style.pointerEvents
      const wasPosition = contentEl.style.position
      const wasHeight = contentEl.style.height

      contentEl.style.visibility = 'visible'
      contentEl.style.pointerEvents = 'auto'
      contentEl.style.position = 'static'
      contentEl.style.height = 'auto'

      void contentEl.offsetHeight

      const topBar = 48
      const padding = 16
      const contentHeight = contentEl.scrollHeight

      contentEl.style.visibility = wasVisibility
      contentEl.style.pointerEvents = wasPointerEvents
      contentEl.style.position = wasPosition
      contentEl.style.height = wasHeight

      return topBar + contentHeight + padding
    }
    return 260
  }

  const createTimeline = () => {
    const navEl = navRef.current
    if (!navEl) return null

    const cardEls = cardsRef.current.filter(Boolean)

    gsap.set(navEl, { height: 48, overflow: 'hidden' })
    gsap.set(cardEls, { y: 50, opacity: 0 })

    const tl = gsap.timeline({ paused: true })

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease: 'power3.out',
    })

    tl.to(
      cardEls,
      { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out', stagger: 0.06 },
      '-=0.15'
    )

    return tl
  }

  useLayoutEffect(() => {
    const tl = createTimeline()
    tlRef.current = tl
    return () => {
      tl?.kill()
      tlRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards])

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return
      if (isExpanded) {
        const newHeight = calculateHeight()
        gsap.set(navRef.current, { height: newHeight })
        tlRef.current.kill()
        const newTl = createTimeline()
        if (newTl) {
          newTl.progress(1)
          tlRef.current = newTl
        }
      } else {
        tlRef.current.kill()
        const newTl = createTimeline()
        if (newTl) {
          tlRef.current = newTl
        }
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded])

  const handleCardClick = () => {
    const tl = tlRef.current
    if (!tl || !isExpanded) return
    setIsHamburgerOpen(false)
    tl.eventCallback('onReverseComplete', () => setIsExpanded(false))
    tl.reverse()
  }

  const toggleMenu = () => {
    const tl = tlRef.current
    if (!tl) return
    if (!isExpanded) {
      setIsHamburgerOpen(true)
      setIsExpanded(true)
      tl.play(0)
    } else {
      setIsHamburgerOpen(false)
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false))
      tl.reverse()
    }
  }

  const setCardRef = (i: number) => (el: HTMLAnchorElement | null) => {
    cardsRef.current[i] = el
  }

  return (
    <div className="card-nav-container">
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? 'open' : ''}`}
        style={{ backgroundColor: 'rgba(10, 10, 10, 0.85)' }}
      >
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Закрыть меню' : 'Открыть меню'}
            tabIndex={0}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <Link href="/" className="card-nav-logo">
            Ex<span>-Machina</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/login" className="card-nav-login-btn">
              Войти
            </Link>
            <Link href="/create-bot" className="card-nav-cta-button">
              Создать бота
            </Link>
          </div>
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          <div className="card-nav-grid">
            {cards.map((card, idx) => (
              <a
                key={card.href}
                href={card.href}
                ref={setCardRef(idx)}
                className="nav-card"
                style={{ backgroundColor: card.bgColor, color: card.textColor }}
                onClick={handleCardClick}
              >
                <div className="nav-card-label">{card.label}</div>
                <div className="nav-card-description">{card.description}</div>
                <ArrowUpRight className="nav-card-arrow" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}
