'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const D4 = 'var(--font-diablo)'

/* ─── Ember Particle ─────────────────────────────────────────── */
interface Ember { id: number; left: number; delay: number; duration: number; size: number }

function EmberLayer({ count = 60 }: { count?: number }) {
  const [embers, setEmbers] = useState<Ember[]>([])
  useEffect(() => {
    setEmbers(Array.from({ length: count }, (_, i) => ({
      id: i,
      left:     Math.random() * 100,
      delay:    Math.random() * 12,
      duration: 7 + Math.random() * 9,
      size:     1 + Math.random() * 3,
    })))
  }, [count])
  return (
    <>
      {embers.map(e => (
        <div
          key={e.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left:     `${e.left}%`,
            bottom:   '-6px',
            width:    `${e.size}px`,
            height:   `${e.size}px`,
            background: 'radial-gradient(circle, #ff8040 20%, #c84b1a 80%)',
            boxShadow: `0 0 ${e.size * 4}px #c84b1a99`,
            animationName: 'ember-rise',
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.duration}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
        />
      ))}
    </>
  )
}

/* ─── Scroll Reveal Hook ─────────────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ─── Reveal Wrapper ─────────────────────────────────────────── */
function Reveal({ children, delay = 0, from = 'bottom' }: {
  children: React.ReactNode
  delay?: number
  from?: 'bottom' | 'left' | 'right'
}) {
  const { ref, visible } = useReveal()
  const translate = from === 'left' ? 'translateX(-40px)' : from === 'right' ? 'translateX(40px)' : 'translateY(40px)'
  return (
    <div
      ref={ref}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'none' : translate,
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

/* ─── Animated Counter ───────────────────────────────────────── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const { ref, visible } = useReveal(0.3)
  useEffect(() => {
    if (!visible) return
    const steps = 60
    const inc = to / steps
    let cur = 0
    const timer = setInterval(() => {
      cur += inc
      if (cur >= to) { setVal(to); clearInterval(timer) }
      else setVal(Math.floor(cur))
    }, 20)
    return () => clearInterval(timer)
  }, [visible, to])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

/* ─── Feature Card ───────────────────────────────────────────── */
function FeatureCard({
  icon, title, desc, delay, from,
}: { icon: React.ReactNode; title: string; desc: string; delay: number; from: 'left' | 'right' | 'bottom' }) {
  return (
    <Reveal delay={delay} from={from}>
      <div
        className="relative rounded-lg p-7 overflow-hidden group"
        style={{
          background: 'linear-gradient(135deg, rgba(28,26,38,0.9) 0%, rgba(12,10,20,0.95) 100%)',
          boxShadow:  '0 0 0 1px rgba(200,168,75,0.12), 0 8px 40px rgba(0,0,0,0.6)',
          transition: 'box-shadow 0.4s ease, transform 0.4s ease',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLElement).style.boxShadow =
            '0 0 0 1px rgba(200,168,75,0.4), 0 8px 60px rgba(0,0,0,0.7), 0 0 30px rgba(200,100,0,0.12)'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLElement).style.boxShadow =
            '0 0 0 1px rgba(200,168,75,0.12), 0 8px 40px rgba(0,0,0,0.6)'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        }}
      >
        {/* Top shimmer */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(200,168,75,0.5), transparent)' }} />

        {/* Icon */}
        <div className="mb-5" style={{ filter: 'drop-shadow(0 0 10px rgba(200,100,0,0.6))' }}>
          {icon}
        </div>

        <h3 style={{
          color:         '#c8a84b',
          fontSize:      '0.85rem',
          fontFamily:    D4,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom:  '0.6rem',
        }}>
          {title}
        </h3>
        <p style={{ color: '#8a7a62', fontSize: '0.85rem', lineHeight: 1.7 }}>
          {desc}
        </p>
      </div>
    </Reveal>
  )
}

/* ─── Step ───────────────────────────────────────────────────── */
function Step({ num, title, desc, delay }: { num: string; title: string; desc: string; delay: number }) {
  return (
    <Reveal delay={delay} from="bottom">
      <div className="flex gap-5 items-start group">
        {/* Number */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center relative"
          style={{
            background: 'linear-gradient(135deg, #2a1e0f, #1a1206)',
            boxShadow:  '0 0 0 1px rgba(200,168,75,0.3), 0 0 20px rgba(200,100,0,0.15)',
          }}>
          <span style={{ color: '#c8a84b', fontSize: '0.85rem', fontFamily: D4, fontWeight: 700 }}>
            {num}
          </span>
          {/* connecting line (not last) */}
        </div>
        <div>
          <h4 style={{ color: '#c5b89a', fontSize: '1rem', fontFamily: D4, letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
            {title}
          </h4>
          <p style={{ color: '#6b5e4a', fontSize: '0.82rem', lineHeight: 1.75 }}>
            {desc}
          </p>
        </div>
      </div>
    </Reveal>
  )
}

/* ─── Main Landing ───────────────────────────────────────────── */
export default function LandingClient() {
  const [mounted, setMounted] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ background: '#020205', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ══════════════════ NAV ══════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background:    scrollY > 40 ? 'rgba(2,2,5,0.92)' : 'transparent',
          backdropFilter: scrollY > 40 ? 'blur(16px)' : 'none',
          borderBottom:   scrollY > 40 ? '1px solid rgba(200,168,75,0.1)' : '1px solid transparent',
          transition:     'all 0.4s ease',
          padding:        '1rem 2rem',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span style={{ color: '#c8a84b', fontFamily: D4, fontSize: '1.1rem', letterSpacing: '0.3em' }}>
            GearGap
          </span>
          <Link
            href="/api/auth/battlenet"
            className="flex items-center gap-2 px-4 py-2 rounded text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #0e5aa7, #0074E0)', boxShadow: '0 2px 16px rgba(0,116,224,0.35)', fontFamily: D4, letterSpacing: '0.08em' }}
          >
            <BnetIcon />
            Sign In
          </Link>
        </div>
      </nav>

      {/* ══════════════════ HERO ══════════════════ */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ background: '#000' }}
      >
        {/* ── YouTube Video Background ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <iframe
            src="https://www.youtube.com/embed/qjEp8Q6OElg?autoplay=1&mute=1&loop=1&playlist=qjEp8Q6OElg&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&start=10"
            allow="autoplay; encrypted-media"
            className="absolute"
            style={{
              top: '50%', left: '50%',
              width: '177.8vh', minWidth: '100%',
              height: '100vh', minHeight: '56.25vw',
              transform: 'translate(-50%, -50%)',
              border: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Dark overlay so text is readable */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)' }} />

        {/* Parallax hell-glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom:    `${-10 - scrollY * 0.08}%`,
            left:      '50%',
            width:     '130%',
            height:    '60%',
            background: 'radial-gradient(ellipse at center bottom, rgba(160,20,10,0.45) 0%, rgba(100,10,5,0.15) 40%, transparent 70%)',
            transform: 'translateX(-50%)',
            animation: 'hellglow-pulse 6s ease-in-out infinite',
          }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.65) 100%)' }} />

        {/* Embers */}
        <EmberLayer count={70} />

        {/* Hero content */}
        <div
          className="relative z-10 text-center px-6 max-w-3xl"
          style={{
            opacity:   mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
            style={{
              background:  'rgba(200,168,75,0.08)',
              border:      '1px solid rgba(200,168,75,0.25)',
              color:       '#c8a84b',
              fontSize:    '0.65rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8a84b', display: 'inline-block', animation: 'hellglow-pulse 2s infinite' }} />
            Diablo IV · Gear Companion
          </div>

          {/* Main headline */}
          <h1
            className="gold-breathe"
            style={{
              fontFamily:    D4,
              fontSize:      'clamp(2.8rem, 6vw, 5.5rem)',
              fontWeight:    900,
              color:         '#c8a84b',
              letterSpacing: '0.08em',
              lineHeight:    1.05,
              marginBottom:  '1.5rem',
              textShadow:    '0 2px 40px rgba(0,0,0,0.9)',
            }}
          >
            Master Your<br />
            <span style={{ color: '#c84b1a', textShadow: '0 0 60px rgba(200,75,26,0.9), 0 2px 40px rgba(0,0,0,0.9)' }}>Sanctuary</span>{' '}
            Gear
          </h1>

          <p style={{
            color:         'rgba(197,184,154,0.85)',
            fontSize:      'clamp(0.95rem, 2vw, 1.1rem)',
            lineHeight:    1.8,
            maxWidth:      '520px',
            margin:        '0 auto 2.5rem',
            textShadow:    '0 1px 8px rgba(0,0,0,0.8)',
          }}>
            Screenshot your items. Track your full armory.
            Compare gear in seconds — all in one place.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/api/auth/battlenet"
              className="flex items-center gap-2.5 px-7 py-3.5 rounded text-white font-semibold"
              style={{
                background:    'linear-gradient(135deg, #0e5aa7 0%, #0074E0 50%, #0d8fff 100%)',
                boxShadow:     '0 4px 30px rgba(0,116,224,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                fontFamily:    D4,
                fontSize:      '0.8rem',
                letterSpacing: '0.1em',
                transition:    'all 0.3s',
              }}
            >
              <BnetIcon />
              Start for Free
            </Link>

            <a
              href="#features"
              className="flex items-center gap-2 px-6 py-3.5 rounded font-medium"
              style={{
                color:         '#c8a84b',
                border:        '1px solid rgba(200,168,75,0.4)',
                fontFamily:    D4,
                fontSize:      '0.75rem',
                letterSpacing: '0.12em',
                transition:    'all 0.3s',
                background:    'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(8px)',
              }}
            >
              Explore Features
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2"
          style={{ transform: 'translateX(-50%)', opacity: mounted ? 1 : 0, transition: 'opacity 1s ease 1.5s' }}
        >
          <div style={{ width: 24, height: 38, border: '1px solid rgba(200,168,75,0.25)', borderRadius: 12, display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
            <div style={{
              width: 4, height: 8, background: '#c8a84b', borderRadius: 2,
              animation: 'scrollDot 2s ease-in-out infinite',
            }} />
          </div>
        </div>
      </section>

      {/* ══════════════════ STATS BAR ══════════════════ */}
      <section style={{ borderTop: '1px solid rgba(200,168,75,0.08)', borderBottom: '1px solid rgba(200,168,75,0.08)', background: 'rgba(200,168,75,0.03)', padding: '2rem 1.5rem' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Item Slots', value: 10, suffix: '' },
            { label: 'Gear Comparisons', value: 100, suffix: '+' },
            { label: 'Sec to Sign In', value: 5, suffix: '' },
            { label: 'Database Entries', value: 50000, suffix: '+' },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div>
                <div style={{ color: '#c8a84b', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontFamily: D4, fontWeight: 700 }}>
                  <Counter to={s.value} suffix={s.suffix} />
                </div>
                <div style={{ color: '#6b5e4a', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '0.3rem' }}>
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section id="features" style={{ padding: 'clamp(5rem, 10vw, 9rem) 1.5rem' }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p style={{ color: '#c84b1a', fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                ✦ &nbsp; Features &nbsp; ✦
              </p>
              <h2 style={{ color: '#c8a84b', fontFamily: D4, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '0.08em' }}>
                Everything for Your Build
              </h2>
              <div className="mx-auto mt-5"
                style={{ width: 60, height: 2, background: 'linear-gradient(to right, transparent, #c8a84b, transparent)' }} />
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<ScanIcon />}
              title="Gear Scanner"
              desc="Upload a screenshot — AI automatically detects all affixes, stats, and item type. No manual typing needed."
              delay={0}
              from="left"
            />
            <FeatureCard
              icon={<ArmoryIcon />}
              title="Armory"
              desc="10 equipment slots in the Diablo style. Keep track of your complete build at a single glance."
              delay={0.15}
              from="bottom"
            />
            <FeatureCard
              icon={<CompareIcon />}
              title="Gear Compare"
              desc="Compare two items side by side. Green and red values instantly show you what's an upgrade."
              delay={0.3}
              from="right"
            />
          </div>

          {/* Second row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-4xl mx-auto">
            <FeatureCard
              icon={<BuildIcon />}
              title="Build Manager"
              desc="Save complete builds, name them, and switch between different setups for leveling and endgame."
              delay={0.1}
              from="left"
            />
            <FeatureCard
              icon={<CloudIcon />}
              title="Cloud Sync"
              desc="Your items and builds are tied to your Battle.net account — available everywhere, always up to date."
              delay={0.25}
              from="right"
            />
          </div>
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section
        style={{
          padding:    'clamp(5rem, 10vw, 9rem) 1.5rem',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(20,5,5,0.8) 0%, transparent 70%)',
          borderTop:  '1px solid rgba(200,168,75,0.06)',
        }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Heading */}
          <div>
            <Reveal from="left">
              <p style={{ color: '#c84b1a', fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                ✦ &nbsp; How It Works &nbsp; ✦
              </p>
              <h2 style={{ color: '#c8a84b', fontFamily: D4, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '0.08em', lineHeight: 1.2, marginBottom: '1.2rem' }}>
                3 Steps to Your<br />Perfect Build
              </h2>
              <p style={{ color: '#6b5e4a', fontSize: '0.9rem', lineHeight: 1.8 }}>
                No tedious typing, no chaos. GearGap makes gear management as simple as it should be.
              </p>
            </Reveal>
          </div>

          {/* Right: Steps */}
          <div className="flex flex-col gap-8">
            <Step num="01" title="Sign in with Battle.net"
              desc="One click — all you need is your Battle.net account. No separate password, no registration form."
              delay={0} />
            <Reveal delay={0.05}>
              <div className="h-px ml-6" style={{ background: 'linear-gradient(to right, rgba(200,168,75,0.2), transparent)' }} />
            </Reveal>
            <Step num="02" title="Scan or Enter Items"
              desc="Upload a screenshot → AI reads all stats. Or enter items manually for maximum control."
              delay={0.15} />
            <Reveal delay={0.2}>
              <div className="h-px ml-6" style={{ background: 'linear-gradient(to right, rgba(200,168,75,0.2), transparent)' }} />
            </Reveal>
            <Step num="03" title="Compare & Optimize"
              desc="Stack items against each other — GearGap shows you exactly which affixes are better or worse. No more guessing."
              delay={0.3} />
          </div>
        </div>
      </section>

      {/* ══════════════════ FINAL CTA ══════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ padding: 'clamp(6rem, 12vw, 10rem) 1.5rem', background: 'radial-gradient(ellipse at 50% 110%, #1a0404 0%, #060409 50%, #020205 100%)' }}
      >
        <EmberLayer count={40} />
        <div className="absolute pointer-events-none"
          style={{
            bottom: '-10%', left: '50%', width: '100%', height: '60%',
            background: 'radial-gradient(ellipse at center bottom, rgba(160,20,10,0.4) 0%, transparent 65%)',
            transform: 'translateX(-50%)',
            animation: 'hellglow-pulse 5s ease-in-out infinite',
          }} />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <Reveal>
            <p style={{ color: '#c84b1a', fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              ✦ &nbsp; Ready? &nbsp; ✦
            </p>
            <h2
              className="gold-breathe"
              style={{ fontFamily: D4, fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#c8a84b', letterSpacing: '0.08em', marginBottom: '1.5rem', lineHeight: 1.15 }}
            >
              Forge Your<br />Perfect Build
            </h2>
            <p style={{ color: '#6b5e4a', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              Free. No download. Just your Battle.net account.
            </p>

            <Link
              href="/api/auth/battlenet"
              className="inline-flex items-center gap-3 px-9 py-4 rounded text-white font-bold"
              style={{
                background:    'linear-gradient(135deg, #0e5aa7 0%, #0074E0 50%, #0d8fff 100%)',
                boxShadow:     '0 4px 40px rgba(0,116,224,0.55), inset 0 1px 0 rgba(255,255,255,0.15)',
                fontFamily:    D4,
                fontSize:      '0.8rem',
                letterSpacing: '0.12em',
                transition:    'all 0.3s',
              }}
            >
              <BnetIcon size={22} />
              Play for Free with Battle.net
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer style={{ borderTop: '1px solid rgba(200,168,75,0.08)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <p style={{ color: '#3d3028', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          GearGap &nbsp;·&nbsp; Not affiliated with Blizzard Entertainment &nbsp;·&nbsp; Only your BattleTag is stored
        </p>
      </footer>
    </div>
  )
}

/* ─── Icon Components ────────────────────────────────────────── */
function BnetIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className="fill-white flex-shrink-0">
      <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 2c6.627 0 12 5.373 12 12S22.627 28 16 28 4 22.627 4 16 9.373 4 16 4zm4.5 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM16 10l-2.5 3.5c-.648-.31-1.38-.5-2-.5v-1.5L16 10zm0 0 5 1.5V13c-.62 0-1.352.19-2 .5L16 10zm-4 6.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zm5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zm-5.5 3.5L16 22l4.5-2-.5-2.5a3.49 3.49 0 0 1-4 0l-.5 2.5z"/>
    </svg>
  )
}

function ScanIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="4" y="4" width="12" height="12" rx="2" stroke="#c8a84b" strokeWidth="1.5" fill="none" opacity="0.7"/>
      <rect x="24" y="4" width="12" height="12" rx="2" stroke="#c8a84b" strokeWidth="1.5" fill="none" opacity="0.7"/>
      <rect x="4" y="24" width="12" height="12" rx="2" stroke="#c8a84b" strokeWidth="1.5" fill="none" opacity="0.7"/>
      <path d="M28 24h8M28 28h6M28 32h8M32 24v8" stroke="#c84b1a" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M2 18h36" stroke="#c8a84b" strokeWidth="1" opacity="0.4" strokeDasharray="3 2"/>
    </svg>
  )
}

function ArmoryIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path d="M20 4 L24 18 L20 22 L16 18 Z" stroke="#c8a84b" strokeWidth="1.5" fill="rgba(200,168,75,0.1)"/>
      <path d="M20 22 L16 26 L8 37 L20 30 L32 37 L24 26 Z" stroke="#c84b1a" strokeWidth="1.5" fill="rgba(200,75,26,0.1)"/>
      <path d="M10 17 L16 17 L20 21" stroke="#c8a84b" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <path d="M30 17 L24 17 L20 21" stroke="#c8a84b" strokeWidth="1.5" fill="none" opacity="0.6"/>
    </svg>
  )
}

function CompareIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="3" y="8" width="15" height="24" rx="2" stroke="#c8a84b" strokeWidth="1.5" fill="rgba(200,168,75,0.06)"/>
      <rect x="22" y="8" width="15" height="24" rx="2" stroke="#c84b1a" strokeWidth="1.5" fill="rgba(200,75,26,0.06)"/>
      <path d="M7 16h7M7 20h5M7 24h7" stroke="#c8a84b" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
      <path d="M26 16h7M26 20h9M26 24h5" stroke="#c84b1a" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
      <path d="M19 20h2" stroke="#6b5e4a" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function BuildIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="4" y="10" width="32" height="6" rx="1.5" stroke="#c8a84b" strokeWidth="1.5" fill="rgba(200,168,75,0.06)"/>
      <rect x="4" y="22" width="32" height="6" rx="1.5" stroke="#c8a84b" strokeWidth="1.5" fill="rgba(200,168,75,0.06)"/>
      <circle cx="10" cy="13" r="2" fill="#c8a84b" opacity="0.7"/>
      <circle cx="10" cy="25" r="2" fill="#c84b1a" opacity="0.8"/>
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path d="M28 28H12a8 8 0 0 1-1-16 10 10 0 0 1 18 3 6 6 0 0 1 1 13z" stroke="#c8a84b" strokeWidth="1.5" fill="rgba(200,168,75,0.06)"/>
      <path d="M20 20v8M17 25l3 3 3-3" stroke="#c84b1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
