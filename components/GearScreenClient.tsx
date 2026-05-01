'use client'

import { useState, useCallback, useRef } from 'react'
import type { GearSlot, ParsedItem } from '@/lib/types'
import type { ParsedBuild } from '@/app/api/parse-build/route'

const D4 = 'var(--font-diablo)'

/* ─── Layout constants ─────────────────────────────────────── */
const T  = 96   // tile size px
const GL = 18   // gap between left-column slots
const GR = 56   // gap between right-column slots
const PR = 64   // right-column padding-top (aligns Amulet at neck level)
const CW = 320  // center portrait width

/* ─── Slot definitions ─────────────────────────────────────── */
const LEFT_SLOTS: { slot: GearSlot; label: string }[] = [
  { slot: 'HELMET',  label: 'Helm'   },
  { slot: 'CHEST',   label: 'Chest'  },
  { slot: 'GLOVES',  label: 'Gloves' },
  { slot: 'PANTS',   label: 'Pants'  },
  { slot: 'BOOTS',   label: 'Boots'  },
]
const RIGHT_SLOTS: { slot: GearSlot; label: string }[] = [
  { slot: 'AMULET', label: 'Amulet' },
  { slot: 'RING1',  label: 'Ring 1' },
  { slot: 'RING2',  label: 'Ring 2' },
]
const WEAPON_SLOTS: { slot: GearSlot; label: string }[] = [
  { slot: 'MAIN_HAND', label: 'Main Hand' },
  { slot: 'OFF_HAND',  label: 'Off Hand'  },
]

/* ─── Icons ────────────────────────────────────────────────── */
const ICONS: Record<GearSlot, React.ReactNode> = {
  HELMET: (
    <svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor">
      <path d="M20 4C12 4 7 10 7 17v6l2 4h22l2-4v-6C33 10 28 4 20 4z" opacity=".8"/>
      <path d="M11 25v5c0 1.5 1 2.5 2.5 2.5h13c1.5 0 2.5-1 2.5-2.5v-5z" opacity=".4"/>
      <rect x="5" y="20" width="5" height="7" rx="1.5" opacity=".4"/>
      <rect x="30" y="20" width="5" height="7" rx="1.5" opacity=".4"/>
    </svg>
  ),
  CHEST: (
    <svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor">
      <path d="M8 10l4-5h16l4 5v24a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10z" opacity=".8"/>
      <path d="M14 5l-2 8 8 3 8-3-2-8" fill="currentColor" opacity=".4"/>
      <line x1="20" y1="16" x2="20" y2="36" stroke="currentColor" strokeWidth="1.5" opacity=".25"/>
    </svg>
  ),
  GLOVES: (
    <svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor">
      <path d="M12 36V20l-5-6V8a2 2 0 0 1 4 0v6h3V6a2 2 0 0 1 4 0v8h2V8a2 2 0 0 1 4 0v6h2V10a2 2 0 0 1 4 0v10l-5 8v8" opacity=".8"/>
    </svg>
  ),
  PANTS: (
    <svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor">
      <path d="M7 5h26L30 22l-5 13H15L10 22 7 5z" opacity=".8"/>
      <line x1="20" y1="5" x2="20" y2="18" stroke="currentColor" strokeWidth="1.5" opacity=".35"/>
    </svg>
  ),
  BOOTS: (
    <svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor">
      <path d="M9 32l4-18h10l3 9 6 5v4H9z" opacity=".8"/>
      <path d="M13 14V8a2 2 0 0 1 4 0v6" opacity=".5"/>
      <path d="M9 36h23v-4H9z" opacity=".4"/>
    </svg>
  ),
  AMULET: (
    <svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor">
      <circle cx="20" cy="27" r="8" opacity=".8"/>
      <circle cx="20" cy="27" r="4" opacity=".35"/>
      <path d="M20 19V8" stroke="currentColor" strokeWidth="2" opacity=".7"/>
      <path d="M12 12a10 10 0 0 1 16 0" stroke="currentColor" strokeWidth="2" fill="none" opacity=".4"/>
    </svg>
  ),
  RING1: (
    <svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor">
      <circle cx="20" cy="22" r="11" opacity=".7"/>
      <circle cx="20" cy="22" r="6" opacity=".3"/>
      <circle cx="20" cy="11" r="4" opacity=".9"/>
    </svg>
  ),
  RING2: (
    <svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor">
      <circle cx="20" cy="22" r="11" opacity=".7"/>
      <circle cx="20" cy="22" r="6" opacity=".3"/>
      <circle cx="20" cy="11" r="4" opacity=".9"/>
    </svg>
  ),
  MAIN_HAND: (
    <svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor">
      <rect x="18.5" y="4" width="3" height="26" rx="1.5" opacity=".85"/>
      <rect x="10" y="15" width="20" height="3" rx="1.5" opacity=".6"/>
      <path d="M18 30l-4 6h12l-4-6z" opacity=".65"/>
    </svg>
  ),
  OFF_HAND: (
    <svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor">
      <path d="M7 8h26v24a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8z" opacity=".7"/>
      <rect x="10" y="11" width="8" height="3" rx="1" opacity=".45"/>
      <rect x="10" y="17" width="12" height="3" rx="1" opacity=".45"/>
      <rect x="10" y="23" width="9" height="3" rx="1" opacity=".45"/>
      <path d="M7 4h26l2 4H5z" opacity=".5"/>
    </svg>
  ),
}

/* ─── Slot Tile ─────────────────────────────────────────────── */
interface SlotTileProps {
  slot: GearSlot
  label: string
  item?: ParsedItem
  imageUrl?: string
  uploading?: boolean
  targetAffixes?: string[]
  targetGreaterAffixes?: string[]
  onUpload: (slot: GearSlot, file: File) => void
  onSelect: (slot: GearSlot) => void
  selected: boolean
}

function SlotTile({
  slot, label, item, imageUrl, uploading,
  targetAffixes, onUpload, onSelect, selected,
}: SlotTileProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hasItem  = !!item

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(slot, file)
    e.target.value = ''
  }

  const handleClick = () => {
    onSelect(slot)
    if (!hasItem && !uploading) inputRef.current?.click()
  }

  const matchCount = targetAffixes && item
    ? item.affixes.filter(a => targetAffixes.some(t =>
        a.name?.toLowerCase().includes(t.toLowerCase().split('%')[0].trim())
      )).length
    : 0

  const matchColor = !targetAffixes || !item ? null
    : matchCount === targetAffixes.length ? '#22c55e'
    : matchCount > 0 ? '#eab308'
    : '#ef4444'

  const borderCol = selected
    ? 'rgba(200,168,75,0.9)'
    : hasItem ? 'rgba(90,65,35,0.65)'
    : 'rgba(50,38,25,0.38)'

  const tileShadow = [
    'inset 0 0 22px rgba(0,0,0,0.78)',
    selected ? '0 0 22px rgba(200,168,75,0.45), 0 0 44px rgba(200,168,75,0.14)' : '',
    matchColor && !selected ? `0 0 10px ${matchColor}28` : '',
  ].filter(Boolean).join(', ')

  const greaterCount = Math.min(item?.greaterAffixes?.length ?? 0, 4)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <div
        role="button"
        onClick={handleClick}
        className="group"
        style={{
          width: T, height: T,
          position: 'relative',
          cursor: 'pointer',
          flexShrink: 0,
          background: hasItem
            ? 'radial-gradient(ellipse at 50% 30%, rgba(24,20,30,0.97) 0%, rgba(8,6,12,0.99) 100%)'
            : 'radial-gradient(ellipse at 50% 30%, rgba(14,11,18,0.93) 0%, rgba(5,4,8,0.97) 100%)',
          border: `2px solid ${borderCol}`,
          borderRadius: 3,
          boxShadow: tileShadow,
          overflow: 'hidden',
          transition: 'border-color 0.18s, box-shadow 0.18s',
        }}
      >
        {/* D4-style corner ornaments */}
        {(['tl','tr','bl','br'] as const).map(c => (
          <div key={c} style={{
            position: 'absolute',
            top:    c.startsWith('t') ? 0 : undefined,
            bottom: c.startsWith('b') ? 0 : undefined,
            left:   c.endsWith('l')   ? 0 : undefined,
            right:  c.endsWith('r')   ? 0 : undefined,
            width: 12, height: 12,
            borderTop:    c.startsWith('t') ? '1px solid rgba(200,168,75,0.3)' : undefined,
            borderBottom: c.startsWith('b') ? '1px solid rgba(200,168,75,0.3)' : undefined,
            borderLeft:   c.endsWith('l')   ? '1px solid rgba(200,168,75,0.3)' : undefined,
            borderRight:  c.endsWith('r')   ? '1px solid rgba(200,168,75,0.3)' : undefined,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Image or icon */}
        {imageUrl ? (
          <img src={imageUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#c8a84b',
            opacity: uploading ? 1 : hasItem ? 0.6 : 0.18,
          }}>
            {uploading
              ? <div style={{ width: 24, height: 24, border: '2px solid #c8a84b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : ICONS[slot]
            }
          </div>
        )}

        {/* Hover replace overlay */}
        {hasItem && !uploading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.68)' }}
            onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c8a84b" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span style={{ color: '#c8a84b', fontSize: '0.52rem', fontFamily: D4, letterSpacing: '0.1em', marginTop: 4 }}>Replace</span>
          </div>
        )}

        {/* Match bar at bottom */}
        {matchColor && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: matchColor, opacity: 0.85 }} />
        )}

        {/* Greater affix indicator */}
        {greaterCount > 0 && (
          <div style={{ position: 'absolute', top: 3, right: 4, color: '#c8a84b', fontSize: '0.5rem', lineHeight: 1, textShadow: '0 0 6px #c8a84b', letterSpacing: '-0.5px' }}>
            {'✦'.repeat(greaterCount)}
          </div>
        )}
      </div>

      {/* Label below tile */}
      <span style={{
        fontFamily: D4, fontSize: '0.52rem', letterSpacing: '0.2em', textTransform: 'uppercase',
        color: selected ? '#c8a84b' : hasItem ? '#5a4a30' : '#2e2418',
        transition: 'color 0.18s', userSelect: 'none',
      }}>
        {label}
      </span>

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  )
}

/* ─── Item Detail Panel ─────────────────────────────────────── */
function ItemPanel({ slot, item, targetData, onClose }: {
  slot: GearSlot
  item: ParsedItem | null
  targetData?: { affixes: string[]; greaterAffixes: string[]; aspect?: string }
  onClose: () => void
}) {
  const slotLabel = [...LEFT_SLOTS, ...RIGHT_SLOTS, ...WEAPON_SLOTS].find(s => s.slot === slot)?.label ?? slot

  // Normalise affix text for loose matching
  const normAffix = (s: string) => s.toLowerCase().replace(/[+\-%\d.,]/g, '').trim()

  const myAffixes = item?.affixes ?? []
  const buildAffixes = targetData?.affixes ?? []

  const myMatchesBuild = (affix: { name?: string; raw?: string }) => {
    const base = normAffix(affix.name ?? affix.raw ?? '')
    return buildAffixes.some(t => {
      const tn = normAffix(t)
      return base.includes(tn) || tn.includes(base)
    })
  }

  const buildMatchesMy = (req: string) => {
    const tn = normAffix(req)
    return myAffixes.some(a => {
      const base = normAffix(a.name ?? a.raw ?? '')
      return base.includes(tn) || tn.includes(base)
    })
  }

  const hasBuild = buildAffixes.length > 0

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 overflow-y-auto"
      style={{
        width: hasBuild ? 440 : 320,
        background: 'linear-gradient(180deg, rgba(18,16,28,0.98) 0%, rgba(6,4,14,0.99) 100%)',
        borderLeft: '1px solid rgba(200,168,75,0.15)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.8)',
      }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontFamily: D4, color: '#c8a84b', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            {slotLabel}
          </h3>
          <button onClick={onClose} style={{ color: '#6b5e4a', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
        </div>

        {/* Item name + meta */}
        {item && (
          <div className="mb-3">
            {item.itemName && (
              <p style={{ color: '#c8a84b', fontFamily: D4, fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>
                {item.itemName}
              </p>
            )}
            <div className="flex gap-3">
              {item.itemPower && <span style={{ color: '#8a7a62', fontSize: '0.62rem' }}>Power {item.itemPower}</span>}
              {item.rarity     && <span style={{ color: rarityColor(item.rarity), fontSize: '0.62rem', textTransform: 'uppercase' }}>{item.rarity}</span>}
              {item.masterworkLevel > 0 && <span style={{ color: '#a78bfa', fontSize: '0.62rem' }}>MW {item.masterworkLevel}</span>}
            </div>
          </div>
        )}

        <div className="h-px mb-4" style={{ background: 'linear-gradient(to right, transparent, rgba(200,168,75,0.25), transparent)' }} />

        {!item && !hasBuild && (
          <p style={{ color: '#6b5e4a', fontSize: '0.75rem', textAlign: 'center', paddingTop: '2rem' }}>
            No item scanned yet.<br />Click the slot to upload a screenshot.
          </p>
        )}

        {/* ── Side-by-side comparison ── */}
        {hasBuild ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

            {/* LEFT — Your affixes */}
            <div>
              <p style={{ color: '#6b5e4a', fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Your Item
              </p>
              {!item || myAffixes.length === 0 ? (
                <p style={{ color: '#3a2e1c', fontSize: '0.65rem' }}>—</p>
              ) : myAffixes.map((a, i) => {
                const match = myMatchesBuild(a)
                const isGA  = item.greaterAffixes.includes(a.name ?? '')
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 6 }}>
                    {isGA
                      ? <span style={{ color: '#c8a84b', fontSize: '0.6rem', flexShrink: 0, marginTop: 1 }}>✦</span>
                      : <span style={{ color: match ? '#22c55e' : '#6b5e4a', fontSize: '0.65rem', flexShrink: 0, marginTop: 1 }}>•</span>
                    }
                    <span style={{
                      fontSize: '0.68rem',
                      lineHeight: 1.4,
                      color: match ? '#22c55e' : '#c5b89a',
                    }}>
                      {a.raw ?? `${a.name ?? ''} ${a.valueText ?? ''}`.trim()}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Divider */}
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(200,168,75,0.08)', pointerEvents: 'none' }} />

            {/* RIGHT — Build requirements */}
            <div>
              <p style={{ color: '#6b5e4a', fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Build Target
              </p>
              {buildAffixes.map((req, i) => {
                const found       = buildMatchesMy(req)
                const needsGreater = targetData?.greaterAffixes.includes(req)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: '0.65rem', flexShrink: 0, marginTop: 1, color: found ? '#22c55e' : '#ef4444' }}>
                      {found ? '✓' : '✗'}
                    </span>
                    {needsGreater && (
                      <span style={{ fontSize: '0.55rem', color: '#c8a84b', flexShrink: 0, marginTop: 2 }}>✦</span>
                    )}
                    <span style={{ fontSize: '0.68rem', lineHeight: 1.4, color: found ? '#c5b89a' : '#ef4444' }}>
                      {req}
                    </span>
                  </div>
                )
              })}
            </div>

          </div>
        ) : (
          /* ── Single-column view when no build loaded ── */
          item && myAffixes.length > 0 && (
            <div>
              <p style={{ color: '#6b5e4a', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Affixes</p>
              {myAffixes.map((a, i) => {
                const isGA = item.greaterAffixes.includes(a.name ?? '')
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 5 }}>
                    {isGA
                      ? <span style={{ color: '#c8a84b', fontSize: '0.6rem', flexShrink: 0 }}>✦</span>
                      : <span style={{ width: 10, flexShrink: 0 }} />
                    }
                    <span style={{ fontSize: '0.7rem', color: '#c5b89a', lineHeight: 1.4 }}>
                      {a.raw ?? `${a.name ?? ''} ${a.valueText ?? ''}`.trim()}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Aspect */}
        {item?.aspect && (
          <>
            <div className="h-px my-4" style={{ background: 'linear-gradient(to right, transparent, rgba(200,100,0,0.2), transparent)' }} />
            <div className="p-2 rounded" style={{ background: 'rgba(200,100,0,0.08)', border: '1px solid rgba(200,100,0,0.2)' }}>
              <p style={{ color: '#c84b1a', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Aspect</p>
              <p style={{ color: '#c5b89a', fontSize: '0.68rem' }}>{item.aspect.name}</p>
              <p style={{ color: '#6b5e4a', fontSize: '0.6rem', marginTop: '0.2rem' }}>{item.aspect.effect}</p>
            </div>
          </>
        )}

        {/* Hint: no build loaded */}
        {!hasBuild && item && (
          <>
            <div className="h-px mt-4 mb-3" style={{ background: 'linear-gradient(to right, transparent, rgba(200,168,75,0.1), transparent)' }} />
            <p style={{ color: '#3a2e1c', fontSize: '0.6rem', lineHeight: 1.7 }}>
              Import a build to compare your affixes against build requirements.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function rarityColor(rarity: string): string {
  switch (rarity) {
    case 'LEGENDARY': return '#c86400'
    case 'UNIQUE':    return '#d4af37'
    case 'RARE':      return '#ffff00'
    case 'MAGIC':     return '#5588ff'
    default:          return '#c5b89a'
  }
}

/* ─── Character Portrait ───────────────────────────────────── */
function Portrait() {
  return (
    <div style={{
      flex: 1, width: '100%', minHeight: 300,
      position: 'relative',
      background: 'linear-gradient(180deg, rgba(8,5,12,0.93) 0%, rgba(5,3,8,0.97) 55%, rgba(2,1,4,1) 100%)',
      border: '1px solid rgba(45,32,18,0.5)',
      borderRadius: 3,
      overflow: 'hidden',
    }}>
      {/* Top shadow */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 28%)', pointerEvents: 'none' }} />
      {/* Side vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.4) 0%, transparent 22%, transparent 78%, rgba(0,0,0,0.4) 100%)', pointerEvents: 'none' }} />
      {/* Hellfire glow */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'radial-gradient(ellipse at 50% 100%, rgba(155,20,4,0.40) 0%, rgba(85,10,2,0.22) 38%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '16%', background: 'linear-gradient(0deg, rgba(130,16,3,0.34) 0%, transparent 100%)', pointerEvents: 'none' }} />

      {/* Ember particles */}
      {[0.22, 0.5, 0.78].map((x, i) => (
        <div key={i} style={{
          position: 'absolute', bottom: '8%', left: `${x * 100}%`,
          width: 2, height: 2, borderRadius: '50%',
          background: '#ff5520', opacity: 0.55,
          boxShadow: '0 0 4px #ff3510',
          animation: `ember${i} ${3.2 + i * 0.8}s ease-in infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Character silhouette */}
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
        <svg viewBox="0 0 90 210" width="200" height="466" style={{ opacity: 0.13, fill: '#d4a855' }}>
          <ellipse cx="45" cy="19" rx="12" ry="14"/>
          <rect x="41" y="32" width="8" height="7" rx="2"/>
          <ellipse cx="22" cy="47" rx="10" ry="6"/>
          <ellipse cx="68" cy="47" rx="10" ry="6"/>
          <path d="M25 41Q18 55 18 75Q18 96 27 105Q36 111 45 111Q54 111 63 105Q72 96 72 75Q72 55 65 41Q56 37 45 37Q34 37 25 41Z"/>
          <rect x="26" y="97" width="38" height="8" rx="2" opacity=".6"/>
          <path d="M24 45Q10 59 8 81Q8 93 12 99Q17 103 22 100Q27 94 28 83Q29 69 28 55Z"/>
          <path d="M66 45Q80 59 82 81Q82 93 78 99Q73 103 68 100Q63 94 62 83Q61 69 62 55Z"/>
          <path d="M8 81Q6 105 8 119Q10 127 16 127Q22 125 24 117Q26 105 26 93Q16 95 8 81Z"/>
          <path d="M82 81Q84 105 82 119Q80 127 74 127Q68 125 66 117Q64 105 64 93Q74 95 82 81Z"/>
          <path d="M27 109Q24 119 26 133Q30 139 45 139Q60 139 64 133Q66 119 63 109Z"/>
          <path d="M27 133Q22 151 22 171Q22 184 28 189Q34 192 38 190Q44 187 44 173Q44 159 42 143Q38 133 27 133Z"/>
          <path d="M63 133Q68 151 68 171Q68 184 62 189Q56 192 52 190Q46 187 46 173Q46 159 48 143Q52 133 63 133Z"/>
          <path d="M22 171Q20 189 22 201Q24 207 30 207Q36 207 38 201Q40 191 38 179L22 171Z"/>
          <path d="M68 171Q70 189 68 201Q66 207 60 207Q54 207 52 201Q50 191 52 179L68 171Z"/>
          <ellipse cx="30" cy="207" rx="9" ry="4"/>
          <ellipse cx="60" cy="207" rx="9" ry="4"/>
        </svg>
      </div>

      {/* Frame corner accents */}
      {(['tl','tr','bl','br'] as const).map(c => (
        <div key={c} style={{
          position: 'absolute',
          top:    c.startsWith('t') ? 0 : undefined,
          bottom: c.startsWith('b') ? 0 : undefined,
          left:   c.endsWith('l')   ? 0 : undefined,
          right:  c.endsWith('r')   ? 0 : undefined,
          width: 24, height: 24,
          borderTop:    c.startsWith('t') ? '2px solid rgba(200,168,75,0.2)' : undefined,
          borderBottom: c.startsWith('b') ? '2px solid rgba(200,168,75,0.2)' : undefined,
          borderLeft:   c.endsWith('l')   ? '2px solid rgba(200,168,75,0.2)' : undefined,
          borderRight:  c.endsWith('r')   ? '2px solid rgba(200,168,75,0.2)' : undefined,
          pointerEvents: 'none',
        }} />
      ))}
    </div>
  )
}

/* ─── Build Import Panel ────────────────────────────────────── */
function BuildImportPanel({
  onImport, onClose,
}: { onImport: (build: ParsedBuild) => void; onClose: () => void }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  const handleScan = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setNote('')
    try {
      const res = await fetch('/api/parse-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      if (data.slotCount === 0) {
        setError('No slot data found. The site may use client-side rendering.')
        setNote(data.note ?? '')
        return
      }
      setNote(data.note ?? '')
      onImport(data.build)
    } catch {
      setError('Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 overflow-y-auto"
      style={{
        width: 360,
        background: 'linear-gradient(180deg, rgba(18,16,28,0.99) 0%, rgba(6,4,14,1) 100%)',
        borderLeft: '1px solid rgba(200,168,75,0.15)',
        boxShadow: '-8px 0 60px rgba(0,0,0,0.9)',
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 style={{ fontFamily: D4, color: '#c8a84b', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Import Build
          </h3>
          <button onClick={onClose} style={{ color: '#6b5e4a', fontSize: '1.2rem' }}>✕</button>
        </div>

        <div className="h-px mb-5" style={{ background: 'linear-gradient(to right, transparent, rgba(200,168,75,0.3), transparent)' }} />

        <p style={{ color: '#6b5e4a', fontSize: '0.72rem', lineHeight: 1.7, marginBottom: '1.2rem' }}>
          Paste a build link from <span style={{ color: '#c8a84b' }}>maxroll.gg</span> or <span style={{ color: '#c8a84b' }}>d4builds.gg</span> to auto-import target affixes for each slot.
        </p>

        {/* URL input */}
        <div className="mb-4">
          <label style={{ fontFamily: D4, color: '#6b5e4a', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
            Build URL
          </label>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleScan()}
            placeholder="https://maxroll.gg/d4/planner/..."
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(200,168,75,0.2)',
              borderRadius: 4,
              padding: '8px 12px',
              color: '#c5b89a',
              fontSize: '0.72rem',
              outline: 'none',
            }}
          />
        </div>

        <button
          onClick={handleScan}
          disabled={loading || !url.trim()}
          className="w-full py-3 rounded font-bold"
          style={{
            fontFamily:    D4,
            fontSize:      '0.7rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            background:    loading ? 'rgba(200,168,75,0.1)' : 'linear-gradient(135deg, #2a1e0f, #c8a84b)',
            color:         loading ? '#6b5e4a' : '#0a0a0f',
            border:        '1px solid rgba(200,168,75,0.3)',
            cursor:        loading ? 'not-allowed' : 'pointer',
            transition:    'all 0.2s',
          }}
        >
          {loading ? 'Scanning…' : '⚔ Scan Build'}
        </button>

        {note && (
          <p style={{ color: '#c8a84b', fontSize: '0.65rem', marginTop: '0.8rem', lineHeight: 1.5 }}>{note}</p>
        )}

        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: '0.8rem', lineHeight: 1.5 }}>{error}</p>
        )}

        <div className="h-px my-5" style={{ background: 'linear-gradient(to right, transparent, rgba(200,168,75,0.15), transparent)' }} />

        <p style={{ color: '#3d3028', fontSize: '0.6rem', lineHeight: 1.7 }}>
          Note: Sites using client-side rendering may not return full data. If scanning fails, you can manually enter affix requirements in each slot.
        </p>
      </div>
    </div>
  )
}

/* ─── Slot inventory state ──────────────────────────────────── */
interface SlotEntry {
  itemId?: string
  imageUrl?: string
  parsedItem?: ParsedItem
  uploading?: boolean
}

/* ─── Main component ────────────────────────────────────────── */
interface GearScreenClientProps {
  profileId: string
  battleTag: string
  name?: string | null
  initialInventory: Partial<Record<GearSlot, SlotEntry>>
}

export default function GearScreenClient({
  profileId,
  battleTag,
  name,
  initialInventory,
}: GearScreenClientProps) {
  const [inventory, setInventory] = useState<Partial<Record<GearSlot, SlotEntry>>>(initialInventory)
  const [targetBuild, setTargetBuild] = useState<ParsedBuild>({})
  const [selectedSlot, setSelectedSlot] = useState<GearSlot | null>(null)
  const [buildPanelOpen, setBuildPanelOpen] = useState(false)

  const handleUpload = useCallback(async (slot: GearSlot, file: File) => {
    setInventory(prev => ({ ...prev, [slot]: { ...prev[slot], uploading: true } }))

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('slot', slot)
      const currentItemId = inventory[slot]?.itemId
      if (currentItemId) formData.append('itemId', currentItemId)

      const res = await fetch('/api/ocr', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('OCR failed')
      const { item, parsed } = await res.json()

      await fetch(`/api/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, itemId: item.id }),
      })

      setInventory(prev => ({
        ...prev,
        [slot]: {
          itemId:     item.id,
          imageUrl:   item.imageUrl ?? undefined,
          parsedItem: parsed as ParsedItem,
          uploading:  false,
        },
      }))
      setSelectedSlot(slot)
    } catch {
      setInventory(prev => ({ ...prev, [slot]: { ...prev[slot], uploading: false } }))
    }
  }, [inventory, profileId])

  const handleImportBuild = (build: ParsedBuild) => {
    setTargetBuild(build)
    setBuildPanelOpen(false)
  }

  const sp = (slot: GearSlot, label: string) => ({
    slot, label,
    selected:              selectedSlot === slot,
    item:                  inventory[slot]?.parsedItem,
    imageUrl:              inventory[slot]?.imageUrl,
    uploading:             inventory[slot]?.uploading,
    targetAffixes:         targetBuild[slot]?.affixes,
    targetGreaterAffixes:  targetBuild[slot]?.greaterAffixes,
    onUpload:              handleUpload,
    onSelect:              (s: GearSlot) => { setSelectedSlot(s); setBuildPanelOpen(false) },
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'radial-gradient(ellipse at 50% 110%, #0e0408 0%, #04030a 55%, #010106 100%)' }}>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 52, flexShrink: 0,
        background: 'rgba(0,0,0,0.55)',
        borderBottom: '1px solid rgba(200,168,75,0.08)',
        backdropFilter: 'blur(12px)',
      }}>
        <span style={{ fontFamily: D4, color: '#c8a84b', fontSize: '0.95rem', letterSpacing: '0.35em' }}>GearGap</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => { setBuildPanelOpen(true); setSelectedSlot(null) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '5px 14px',
              fontFamily: D4, fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              background: 'rgba(200,168,75,0.07)', border: '1px solid rgba(200,168,75,0.22)',
              color: '#c8a84b', cursor: 'pointer', borderRadius: 3, transition: 'all 0.18s',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Import Build
          </button>

          {Object.keys(targetBuild).length > 0 && (
            <span style={{ background: 'rgba(34,197,94,0.09)', border: '1px solid rgba(34,197,94,0.28)', borderRadius: 3, padding: '3px 9px', fontSize: '0.58rem', color: '#22c55e', fontFamily: D4, letterSpacing: '0.1em' }}>
              Build loaded
            </span>
          )}

          <span style={{ color: '#3a2e1c', fontSize: '0.68rem', fontFamily: D4, letterSpacing: '0.1em' }}>
            {name ?? battleTag}
          </span>

          <a href="/api/auth/logout"
            style={{ color: '#2e2014', fontSize: '0.62rem', fontFamily: D4, letterSpacing: '0.12em', textDecoration: 'none', transition: 'color 0.18s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c84b1a')}
            onMouseLeave={e => (e.currentTarget.style.color = '#2e2014')}
          >
            Logout
          </a>
        </div>
      </div>

      {/* ── Character Screen ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', overflow: 'auto' }}>

        {/* 3-column D4 layout — stretch aligns all columns to the tallest (left col) */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 20 }}>

          {/* Left column: 5 slots evenly spaced */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GL }}>
            {LEFT_SLOTS.map(({ slot, label }) => (
              <SlotTile key={slot} {...sp(slot, label)} />
            ))}
          </div>

          {/* Center: portrait fills left column height, weapons below */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: CW }}>
            <Portrait />
            <div style={{ display: 'flex', gap: 12 }}>
              {WEAPON_SLOTS.map(({ slot, label }) => (
                <SlotTile key={slot} {...sp(slot, label)} />
              ))}
            </div>
          </div>

          {/* Right column: Amulet at neck, Rings at body level */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GR, paddingTop: PR }}>
            {RIGHT_SLOTS.map(({ slot, label }) => (
              <SlotTile key={slot} {...sp(slot, label)} />
            ))}
          </div>

        </div>

        {/* Hint when nothing uploaded */}
        {Object.values(inventory).every(v => !v?.parsedItem) && (
          <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'none' }}>
            <p style={{ color: '#2a1e10', fontSize: '0.6rem', fontFamily: D4, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
              Click any slot to upload a gear screenshot
            </p>
          </div>
        )}
      </div>

      {/* ── Side panels ── */}
      {selectedSlot && !buildPanelOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setSelectedSlot(null)} />
          <ItemPanel
            slot={selectedSlot}
            item={inventory[selectedSlot]?.parsedItem ?? null}
            targetData={targetBuild[selectedSlot]}
            onClose={() => setSelectedSlot(null)}
          />
        </>
      )}

      {buildPanelOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setBuildPanelOpen(false)} />
          <BuildImportPanel
            onImport={handleImportBuild}
            onClose={() => setBuildPanelOpen(false)}
          />
        </>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes ember0{0%,100%{opacity:0}20%{opacity:0.5}50%{transform:translateY(-60px) translateX(5px);opacity:0.3}100%{transform:translateY(-120px);opacity:0}}@keyframes ember1{0%,100%{opacity:0}15%{opacity:0.45}60%{transform:translateY(-80px) translateX(-7px);opacity:0.2}100%{transform:translateY(-145px);opacity:0}}@keyframes ember2{0%,100%{opacity:0}25%{opacity:0.5}55%{transform:translateY(-70px) translateX(4px);opacity:0.2}100%{transform:translateY(-135px);opacity:0}}`}</style>
    </div>
  )
}
