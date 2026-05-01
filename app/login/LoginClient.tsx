'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const ERROR_MESSAGES: Record<string, string> = {
  denied:  'Login was cancelled.',
  invalid: 'Invalid OAuth request.',
  state:   'Security error — please try again.',
  oauth:   'Battle.net login failed — please try again.',
}

interface Ember {
  id: number
  left: number
  delay: number
  duration: number
  size: number
  drift: number
}

export default function LoginClient({ error }: { error?: string }) {
  const [embers, setEmbers]   = useState<Ember[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setEmbers(
      Array.from({ length: 55 }, (_, i) => ({
        id:       i,
        left:     Math.random() * 100,
        delay:    Math.random() * 10,
        duration: 6 + Math.random() * 8,
        size:     1 + Math.random() * 3.5,
        drift:    (Math.random() - 0.5) * 80,
      }))
    )
    setMounted(true)
  }, [])

  const errorMsg = error ? (ERROR_MESSAGES[error] ?? 'Unbekannter Fehler.') : null

  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% 120%, #1a0404 0%, #060409 50%, #020205 100%)' }}
    >
      {/* ── Background layers ── */}

      {/* Hell gate glow — bottom center */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-5%',
          left: '50%',
          width: '110%',
          height: '55%',
          background: 'radial-gradient(ellipse at center bottom, rgba(160,20,10,0.45) 0%, rgba(100,10,5,0.2) 40%, transparent 70%)',
          animation: 'hellglow-pulse 5s ease-in-out infinite',
          transform: 'translateX(-50%)',
        }}
      />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.75) 100%)' }}
      />

      {/* Subtle grain noise */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* ── Ember particles ── */}
      {mounted && embers.map(e => (
        <div
          key={e.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left:            `${e.left}%`,
            bottom:          '-8px',
            width:           `${e.size}px`,
            height:          `${e.size}px`,
            background:      `radial-gradient(circle, #ff8040 20%, #c84b1a 80%)`,
            boxShadow:       `0 0 ${e.size * 3}px #c84b1a88`,
            animationName:   'ember-rise',
            animationDelay:  `${e.delay}s`,
            animationDuration:`${e.duration}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
        />
      ))}

      {/* ── Main content ── */}
      <div
        className="relative z-10 w-full max-w-md px-5"
        style={{
          opacity:    mounted ? 1 : 0,
          transform:  mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        {/* Top ornamental line */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(200,168,75,0.5))' }} />
          <span style={{ color: 'rgba(200,168,75,0.6)', fontSize: '0.55rem', letterSpacing: '0.6em' }}>✦ ✦ ✦</span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(200,168,75,0.5))' }} />
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          {/* Sword icon with glow */}
          <div className="inline-flex items-center justify-center mb-4" style={{ filter: 'drop-shadow(0 0 20px rgba(200,100,0,0.8))' }}>
            <svg viewBox="0 0 64 64" width="56" height="56" fill="none">
              <path d="M32 4 L36 28 L32 32 L28 28 Z" fill="#c8a84b" opacity="0.9" />
              <path d="M32 32 L28 36 L18 60 L24 54 L32 44 L40 54 L46 60 L36 36 Z" fill="#8b5e1a" opacity="0.85" />
              <path d="M20 28 L28 28 L32 32 L28 36 L20 28Z" fill="#c8a84b" opacity="0.6" />
              <path d="M44 28 L36 28 L32 32 L36 36 L44 28Z" fill="#c8a84b" opacity="0.6" />
              <rect x="30" y="28" width="4" height="16" rx="1" fill="#3d2e1e" opacity="0.7" />
            </svg>
          </div>

          <h1
            className="gold-breathe"
            style={{
              fontFamily:    'var(--font-diablo)',
              fontSize:      '2.8rem',
              fontWeight:    700,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color:         '#c8a84b',
              lineHeight:    1,
              marginBottom:  '0.4rem',
            }}
          >
            GearGap
          </h1>

          <p style={{ color: '#6b5e4a', fontSize: '0.65rem', letterSpacing: '0.35em', textTransform: 'uppercase' }}>
            Diablo IV &nbsp;·&nbsp; Gear Companion
          </p>
        </div>

        {/* ── Card ── */}
        <div
          className="login-card-enter relative rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(22,18,32,0.97) 0%, rgba(8,6,14,0.99) 100%)',
            boxShadow:  '0 0 0 1px rgba(200,168,75,0.18), 0 0 80px rgba(0,0,0,0.95), 0 0 40px rgba(180,30,10,0.08), inset 0 1px 0 rgba(200,168,75,0.12)',
          }}
        >
          {/* Top shimmer bar */}
          <div
            className="h-px w-full"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(200,168,75,0.7) 30%, rgba(200,100,0,0.9) 50%, rgba(200,168,75,0.7) 70%, transparent 100%)' }}
          />

          <div className="relative p-8 space-y-5">
            {/* Corner accents */}
            {[
              'top-3 left-3 border-t border-l',
              'top-3 right-3 border-t border-r',
              'bottom-3 left-3 border-b border-l',
              'bottom-3 right-3 border-b border-r',
            ].map((cls, i) => (
              <div key={i} className={`absolute w-5 h-5 ${cls}`} style={{ borderColor: 'rgba(200,168,75,0.3)' }} />
            ))}

            {/* Heading */}
            <div className="text-center">
              <h2 style={{ color: '#c5b89a', fontFamily: 'var(--font-diablo)', fontSize: '0.75rem', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
                Welcome, Nephalem
              </h2>
              <p style={{ color: '#6b5e4a', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                Sign in with your Battle.net account
              </p>
            </div>

            {/* Divider */}
            <div className="w-full h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(200,168,75,0.35), transparent)' }} />

            {/* Error */}
            {errorMsg && (
              <div style={{ color: '#f87171', fontSize: '0.7rem', textAlign: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', padding: '8px 12px' }}>
                {errorMsg}
              </div>
            )}

            {/* ── Battle.net Button ── */}
            <Link
              href="/api/auth/battlenet"
              className="group relative flex items-center justify-center gap-3 w-full rounded py-3.5 px-5 text-white font-semibold text-sm overflow-hidden"
              style={{
                background:  'linear-gradient(135deg, #0e5aa7 0%, #0074E0 50%, #0d8fff 100%)',
                boxShadow:   '0 2px 24px rgba(0,116,224,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
                transition:  'all 0.3s ease',
                letterSpacing: '0.04em',
              }}
            >
              {/* Hover overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100"
                style={{ background: 'linear-gradient(135deg, #1670c0 0%, #0090ff 50%, #20aaff 100%)', transition: 'opacity 0.3s ease' }}
              />
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-md"
                style={{ background: 'rgba(0,144,255,0.2)', transition: 'opacity 0.3s ease' }}
              />

              {/* Battle.net official logo */}
              <svg viewBox="0 0 32 32" className="relative h-5 w-5 flex-shrink-0 fill-white">
                <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 2c6.627 0 12 5.373 12 12S22.627 28 16 28 4 22.627 4 16 9.373 4 16 4zm4.5 5.5c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm-9 0c-.828 0-1.5.672-1.5 1.5S10.672 12.5 11.5 12.5 13 11.828 13 11s-.672-1.5-1.5-1.5zM16 10l-2.5 3.5c-.648-.31-1.38-.5-2-.5v-1.5L16 10zm0 0l5 1.5V13c-.62 0-1.352.19-2 .5L16 10zm-4 6.5c0 .828.672 1.5 1.5 1.5a1.5 1.5 0 0 0 0-3c-.828 0-1.5.672-1.5 1.5zm5 0c0 .828.672 1.5 1.5 1.5a1.5 1.5 0 0 0 0-3c-.828 0-1.5.672-1.5 1.5zm-5.5 3.5L16 22l4.5-2-.5-2.5a3.49 3.49 0 0 1-2 .5 3.49 3.49 0 0 1-2-.5l-.5 2.5z"/>
              </svg>

              <span className="relative tracking-wide" style={{ fontFamily: 'var(--font-diablo)', fontSize: '0.75rem', letterSpacing: '0.12em' }}>Sign in with Battle.net</span>
            </Link>

            <p style={{ color: 'rgba(107,94,74,0.7)', fontSize: '0.6rem', textAlign: 'center', lineHeight: 1.7 }}>
              Only your BattleTag is stored &nbsp;·&nbsp; No game access &nbsp;·&nbsp; No password
            </p>
          </div>

          {/* Bottom shimmer bar */}
          <div
            className="h-px w-full"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(200,168,75,0.4), transparent)' }}
          />
        </div>

        {/* Bottom ornament */}
        <div className="flex items-center gap-4 mt-6">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(200,168,75,0.15))' }} />
          <span style={{ color: 'rgba(200,168,75,0.2)', fontSize: '0.5rem', letterSpacing: '0.6em' }}>✦ ✦ ✦</span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(200,168,75,0.15))' }} />
        </div>
      </div>
    </div>
  )
}
