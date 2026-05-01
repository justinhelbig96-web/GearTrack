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
  targetItemName?: string
  onUpload: (slot: GearSlot, file: File) => void
  onSelect: (slot: GearSlot) => void
  selected: boolean
}

function SlotTile({
  slot, label, item, imageUrl, uploading,
  targetAffixes, targetItemName, onUpload, onSelect, selected,
}: SlotTileProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [imgOpen, setImgOpen] = useState(false)
  const hasItem  = !!item
  const hasBuildTarget = !!targetItemName && !hasItem

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { onUpload(slot, file); setImgOpen(false) }
    e.target.value = ''
  }

  const handleClick = () => {
    if (imageUrl) { setImgOpen(true); onSelect(slot); return }
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
    : hasBuildTarget ? 'rgba(60,80,120,0.55)'
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

        {/* Image, icon, or build target name */}
        {imageUrl ? (
          <img src={imageUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : hasBuildTarget ? (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '6px 5px', gap: 4,
          }}>
            <div style={{ color: '#5a7aaa', opacity: 0.55, flexShrink: 0 }}>{ICONS[slot]}</div>
            <span style={{
              color: '#7ea4cc', fontSize: '0.44rem', fontFamily: D4,
              letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.3,
              wordBreak: 'break-word', opacity: 0.9,
            }}>
              {targetItemName}
            </span>
          </div>
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

        {/* Hover overlay — click to view */}
        {hasItem && !uploading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.5)', pointerEvents: 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c8a84b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <span style={{ color: '#c8a84b', fontSize: '0.5rem', fontFamily: D4, letterSpacing: '0.1em', marginTop: 4 }}>View</span>
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
        color: selected ? '#c8a84b' : hasItem ? '#5a4a30' : hasBuildTarget ? '#4a6080' : '#2e2418',
        transition: 'color 0.18s', userSelect: 'none',
      }}>
        {label}
      </span>

      {/* ── Lightbox modal ── */}
      {imgOpen && imageUrl && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setImgOpen(false)}
        >
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <img
              src={imageUrl} alt={label}
              style={{ maxWidth: '85vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 4, border: '1px solid rgba(200,168,75,0.2)', display: 'block' }}
            />
            {/* Close */}
            <button
              onClick={() => setImgOpen(false)}
              style={{ position: 'absolute', top: -14, right: -14, width: 28, height: 28, borderRadius: '50%', background: 'rgba(15,10,5,0.95)', border: '1px solid rgba(200,168,75,0.3)', color: '#c8a84b', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >✕</button>
            {/* Re-upload — bottom-right corner */}
            <button
              onClick={() => inputRef.current?.click()}
              style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(10,7,3,0.92)', border: '1px solid rgba(200,168,75,0.35)', borderRadius: 3, padding: '6px 12px', color: '#c8a84b', fontFamily: D4, fontSize: '0.55rem', letterSpacing: '0.12em', cursor: 'pointer' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              New Upload
            </button>
          </div>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  )
}

/* ─── UNUSED kept for compatibility ────────────────────────── */
function _ItemPanelUnused({ slot, item, targetData, onClose }: {
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

/* ─── unused import panel stub ─────────────────────────────── */
function _BuildImportPanelUnused({
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

/* ─── Build visual slot tile ───────────────────────────────── */
function BuildSlotTile({ slot, label, build, myItem, selected, onSelect }: {
  slot: GearSlot
  label: string
  build?: { affixes: string[]; greaterAffixes: string[]; itemName?: string }
  myItem?: ParsedItem
  selected: boolean
  onSelect: (s: GearSlot) => void
}) {
  const norm = (s: string) => s.toLowerCase().replace(/[+\-%\d.,]/g, '').trim()
  const affixes = build?.affixes ?? []
  const matched = myItem ? affixes.filter(r => {
    const tn = norm(r)
    return myItem.affixes.some(a => { const b = norm(a.name ?? a.raw ?? ''); return b.includes(tn) || tn.includes(b) })
  }).length : 0
  const matchColor = !build || affixes.length === 0 ? null
    : !myItem ? '#4a3c28'
    : matched === affixes.length ? '#22c55e'
    : matched > 0 ? '#eab308' : '#ef4444'
  const borderCol = selected ? 'rgba(200,168,75,0.9)' : matchColor ? `${matchColor}55` : 'rgba(50,38,25,0.35)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div
        role="button"
        onClick={() => onSelect(slot)}
        style={{
          width: 80, height: 80, position: 'relative', cursor: 'pointer',
          background: 'radial-gradient(ellipse at 50% 30%, rgba(14,11,18,0.93) 0%, rgba(5,4,8,0.97) 100%)',
          border: `2px solid ${borderCol}`, borderRadius: 3, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '5px 4px', transition: 'border-color 0.18s',
          boxShadow: selected ? '0 0 16px rgba(200,168,75,0.3)' : 'none',
        }}
      >
        {(['tl','tr','bl','br'] as const).map(c => (
          <div key={c} style={{
            position: 'absolute',
            top: c.startsWith('t') ? 0 : undefined, bottom: c.startsWith('b') ? 0 : undefined,
            left: c.endsWith('l') ? 0 : undefined, right: c.endsWith('r') ? 0 : undefined,
            width: 9, height: 9,
            borderTop:    c.startsWith('t') ? '1px solid rgba(200,168,75,0.22)' : undefined,
            borderBottom: c.startsWith('b') ? '1px solid rgba(200,168,75,0.22)' : undefined,
            borderLeft:   c.endsWith('l')   ? '1px solid rgba(200,168,75,0.22)' : undefined,
            borderRight:  c.endsWith('r')   ? '1px solid rgba(200,168,75,0.22)' : undefined,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Badge */}
        {build && affixes.length > 0 && (
          <div style={{ position: 'absolute', top: 2, right: 3, fontFamily: D4, fontSize: '0.44rem', color: matchColor ?? '#4a3c28' }}>
            {myItem ? `${matched}/${affixes.length}` : `?/${affixes.length}`}
          </div>
        )}

        {/* Item name or icon */}
        {build?.itemName ? (
          <span style={{ fontSize: '0.41rem', fontFamily: D4, color: '#a08060', textAlign: 'center', lineHeight: 1.25, wordBreak: 'break-all', padding: '0 2px' }}>{build.itemName}</span>
        ) : (
          <div style={{ color: '#c8a84b', opacity: 0.11 }}>{ICONS[slot]}</div>
        )}

        {/* Match bar */}
        {matchColor && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: matchColor, opacity: 0.75 }} />
        )}
      </div>
      <span style={{ fontFamily: D4, fontSize: '0.44rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: selected ? '#c8a84b' : '#2e2418' }}>{label}</span>
    </div>
  )
}

/* ─── All slots in order ────────────────────────────────────── */
const ALL_SLOTS = [...LEFT_SLOTS, ...RIGHT_SLOTS, ...WEAPON_SLOTS]

/* ─── Permanent Build Panel (right side) ───────────────────── */
interface BuildPanelProps {
  inventory: Partial<Record<GearSlot, SlotEntry>>
  targetBuild: ParsedBuild
  selectedSlot: GearSlot | null
  onSelectSlot: (slot: GearSlot | null) => void
  onImport: (build: ParsedBuild) => void
  onClear: () => void
}

function BuildPanel({ inventory, targetBuild, selectedSlot, onSelectSlot, onImport, onClear }: BuildPanelProps) {
  const [mode, setMode]   = useState<'url' | 'paste'>('url')
  const [url, setUrl]     = useState('')
  const [text, setText]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote]   = useState('')

  const hasBuild = Object.keys(targetBuild).length > 0

  const norm = (s: string) => s.toLowerCase().replace(/[+\-%\d.,]/g, '').trim()

  const affixMatch = (myItem: ParsedItem | undefined, req: string) => {
    if (!myItem) return false
    const tn = norm(req)
    return myItem.affixes.some(a => { const b = norm(a.name ?? a.raw ?? ''); return b.includes(tn) || tn.includes(b) })
  }

  const getSlotMatch = (slot: GearSlot) => {
    const build = targetBuild[slot]
    if (!build || build.affixes.length === 0) return null
    const myItem = inventory[slot]?.parsedItem
    const matched = build.affixes.filter(r => affixMatch(myItem, r)).length
    const total   = build.affixes.length
    const color   = !myItem ? '#6b5e4a' : matched === total ? '#22c55e' : matched > 0 ? '#eab308' : '#ef4444'
    return { matched, total, color, hasItem: !!myItem }
  }

  const handleScan = async () => {
    const isUrl  = mode === 'url'
    const value  = isUrl ? url.trim() : text.trim()
    if (!value) return
    setLoading(true); setError(''); setNote('')
    try {
      const body = isUrl ? { url: value } : { text: value }
      const res  = await fetch('/api/parse-build', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      if (data.slotCount === 0) { setError(data.note ?? 'No slot data found.'); return }
      setNote(`✓ ${data.slotCount} slots loaded`)
      onImport(data.build)
    } catch { setError('Request failed') }
    finally   { setLoading(false) }
  }

  return (
    <div style={{
      width: 520, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      borderLeft: '1px solid rgba(200,168,75,0.1)',
      background: 'linear-gradient(180deg, rgba(6,4,12,0.97) 0%, rgba(3,2,8,0.99) 100%)',
    }}>

      {/* ── Header ── */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(200,168,75,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontFamily: D4, color: '#c8a84b', fontSize: '0.68rem', letterSpacing: '0.22em', flex: 1 }}>BUILD TARGET</span>
          {hasBuild && (
            <button onClick={onClear} style={{ color: '#5a3a2a', fontSize: '0.58rem', fontFamily: D4, letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Clear</button>
          )}
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 8, borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(200,168,75,0.15)' }}>
          {(['url', 'paste'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '5px 0', fontFamily: D4, fontSize: '0.55rem', letterSpacing: '0.1em',
              textTransform: 'uppercase', cursor: 'pointer', border: 'none',
              background: mode === m ? 'rgba(200,168,75,0.12)' : 'rgba(0,0,0,0.4)',
              color: mode === m ? '#c8a84b' : '#3a2e1c',
              borderRight: m === 'url' ? '1px solid rgba(200,168,75,0.1)' : undefined,
            }}>
              {m === 'url' ? '⚔ URL' : '📋 Text Paste'}
            </button>
          ))}
        </div>

        {/* URL input */}
        {mode === 'url' && (
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="d4builds.gg / maxroll.gg / mobalytics.gg…"
              style={{ flex: 1, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(200,168,75,0.14)', borderRadius: 3, padding: '6px 9px', color: '#c5b89a', fontSize: '0.62rem', outline: 'none' }}
            />
            <button onClick={handleScan} disabled={loading || !url.trim()}
              style={{ fontFamily: D4, fontSize: '0.58rem', letterSpacing: '0.08em', background: loading ? 'rgba(200,168,75,0.06)' : 'linear-gradient(135deg,#2a1e0f,#c8a84b)', color: loading ? '#6b5e4a' : '#0a0a0f', border: '1px solid rgba(200,168,75,0.25)', borderRadius: 3, padding: '6px 11px', cursor: loading ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
              {loading ? '…' : 'Scan'}
            </button>
          </div>
        )}

        {/* Paste input */}
        {mode === 'paste' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <p style={{ color: '#3a2e1c', fontSize: '0.56rem', lineHeight: 1.5 }}>
              Scroll to <span style={{ color: '#c8a84b' }}>Gear Stats</span> on d4builds.gg → alles markieren → kopieren → hier einfügen.
            </p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={'Helm\n27% Critical Strike Chance\n25% Lucky Hit Chance\n...\nChest Armor\nWillpower\n...'}
              rows={6}
              style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(200,168,75,0.14)', borderRadius: 3, padding: '7px 9px', color: '#c5b89a', fontSize: '0.62rem', outline: 'none', resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.5 }}
            />
            <button onClick={handleScan} disabled={loading || !text.trim()}
              style={{ fontFamily: D4, fontSize: '0.58rem', letterSpacing: '0.1em', background: loading ? 'rgba(200,168,75,0.06)' : 'linear-gradient(135deg,#2a1e0f,#c8a84b)', color: loading ? '#6b5e4a' : '#0a0a0f', border: '1px solid rgba(200,168,75,0.25)', borderRadius: 3, padding: '7px', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '…' : '⚔ Parse Build Text'}
            </button>
          </div>
        )}

        {(note || error) && (
          <p style={{ fontSize: '0.58rem', marginTop: 5, color: error ? '#ef4444' : '#22c55e', lineHeight: 1.4 }}>{error || note}</p>
        )}
      </div>

      {/* ── Card grid (d4builds Gear Stats style) ── */}
      {!hasBuild ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
          <p style={{ color: '#c8a84b', fontFamily: D4, fontSize: '0.58rem', letterSpacing: '0.15em', textAlign: 'center', lineHeight: 1.8 }}>
            Paste a build URL to start<br />comparing your gear
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {ALL_SLOTS.map(({ slot, label }) => {
              const bd      = targetBuild[slot]
              const myItem  = inventory[slot]?.parsedItem
              const hasScan = !!myItem
              const affixes = bd?.affixes ?? []
              const ga      = bd?.greaterAffixes ?? []
              const hits    = hasScan ? affixes.filter(r => affixMatch(myItem, r)).length : 0
              const cardCol = !affixes.length ? null
                : !hasScan  ? '#4a3c28'
                : hits === affixes.length ? '#22c55e'
                : hits > 0  ? '#eab308' : '#ef4444'
              return (
                <div key={slot} style={{
                  background: 'rgba(8,6,14,0.92)',
                  border: `1px solid ${cardCol ? `${cardCol}38` : 'rgba(42,30,16,0.4)'}`,
                  borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                }}>

                  {/* Card header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: 'rgba(0,0,0,0.4)',
                  }}>
                    <div style={{ color: cardCol ?? '#3a2e1c', lineHeight: 0, transform: 'scale(0.45)', transformOrigin: 'left center', width: 16, height: 16, flexShrink: 0, marginRight: -8 }}>
                      {ICONS[slot]}
                    </div>
                    <span style={{ fontFamily: D4, fontSize: '0.53rem', color: cardCol ?? '#3a2e1c', letterSpacing: '0.1em', textTransform: 'uppercase', flex: 1 }}>{label}</span>
                    {affixes.length > 0 && (
                      <span style={{ fontFamily: D4, fontSize: '0.5rem', color: cardCol ?? '#3a2e1c', flexShrink: 0, marginLeft: 4 }}>
                        {hasScan ? `${hits}/${affixes.length}` : `·/${affixes.length}`}
                      </span>
                    )}
                  </div>

                  {/* Build item name */}
                  {bd?.itemName && (
                    <div style={{ padding: '3px 9px 0', fontSize: '0.57rem', color: '#886a40', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.5 }}>
                      {bd.itemName}
                    </div>
                  )}

                  {/* Affixes */}
                  <div style={{ padding: '5px 9px 8px', flex: 1 }}>
                    {!bd || affixes.length === 0 ? (
                      <span style={{ color: '#251a10', fontSize: '0.54rem' }}>No data</span>
                    ) : affixes.map((affix, i) => {
                      const isGA = ga.includes(affix)
                      const hit  = affixMatch(myItem, affix)
                      /* orange = GA   |   white = matched   |   red = missing   |   dim = not scanned */
                      const textColor = isGA      ? '#c8a84b'
                        : !hasScan    ? '#2e2014'
                        : hit         ? '#c5b89a' : '#ef4444'
                      const dotColor  = isGA      ? '#c8a84b'
                        : !hasScan    ? '#2a1e10'
                        : hit         ? '#3d3028' : '#ef444465'
                      return (
                        <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 3, alignItems: 'flex-start' }}>
                          <span style={{ color: dotColor, fontSize: '0.5rem', flexShrink: 0, marginTop: '2px' }}>{isGA ? '✦' : '✲'}</span>
                          <span style={{ fontSize: '0.62rem', lineHeight: 1.3, color: textColor }}>{affix}</span>
                        </div>
                      )
                    })}
                    {!hasScan && affixes.length > 0 && (
                      <div style={{ marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 3 }}>
                        <span style={{ color: '#2a1e10', fontSize: '0.46rem', fontFamily: D4, letterSpacing: '0.1em' }}>scan to compare</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
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

  const handleImportBuild = (build: ParsedBuild) => setTargetBuild(build)

  const sp = (slot: GearSlot, label: string) => ({
    slot, label,
    selected:              selectedSlot === slot,
    item:                  inventory[slot]?.parsedItem,
    imageUrl:              inventory[slot]?.imageUrl,
    uploading:             inventory[slot]?.uploading,
    targetAffixes:         targetBuild[slot]?.affixes,
    targetGreaterAffixes:  targetBuild[slot]?.greaterAffixes,
    targetItemName:        targetBuild[slot]?.itemName,
    onUpload:              handleUpload,
    onSelect:              (s: GearSlot) => setSelectedSlot(s),
  })

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'radial-gradient(ellipse at 50% 110%, #0e0408 0%, #04030a 55%, #010106 100%)', overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 48, flexShrink: 0,
        background: 'rgba(0,0,0,0.6)',
        borderBottom: '1px solid rgba(200,168,75,0.08)',
      }}>
        <span style={{ fontFamily: D4, color: '#c8a84b', fontSize: '0.9rem', letterSpacing: '0.35em' }}>GearGap</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#3a2e1c', fontSize: '0.65rem', fontFamily: D4, letterSpacing: '0.1em' }}>{name ?? battleTag}</span>
          <a href="/api/auth/logout"
            style={{ color: '#2e2014', fontSize: '0.6rem', fontFamily: D4, letterSpacing: '0.12em', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c84b1a')}
            onMouseLeave={e => (e.currentTarget.style.color = '#2e2014')}
          >Logout</a>
        </div>
      </div>

      {/* ── Main split layout ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT: Your character screen */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', overflow: 'auto' }}>
          <div>
            {/* Section label */}
            <p style={{ fontFamily: D4, fontSize: '0.52rem', color: '#3a2e1c', letterSpacing: '0.25em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>Your Gear</p>

            {/* 3-column D4 layout */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: GL }}>
                {LEFT_SLOTS.map(({ slot, label }) => <SlotTile key={slot} {...sp(slot, label)} />)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: CW }}>
                <Portrait />
                <div style={{ display: 'flex', gap: 10 }}>
                  {WEAPON_SLOTS.map(({ slot, label }) => <SlotTile key={slot} {...sp(slot, label)} />)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: GR, paddingTop: PR }}>
                {RIGHT_SLOTS.map(({ slot, label }) => <SlotTile key={slot} {...sp(slot, label)} />)}
              </div>
            </div>

            {Object.values(inventory).every(v => !v?.parsedItem) && (
              <p style={{ color: '#2a1e10', fontSize: '0.55rem', fontFamily: D4, letterSpacing: '0.18em', textTransform: 'uppercase', textAlign: 'center', marginTop: 14 }}>
                Click any slot to upload a gear screenshot
              </p>
            )}
          </div>
        </div>

        {/* RIGHT: Permanent build panel */}
        <BuildPanel
          inventory={inventory}
          targetBuild={targetBuild}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          onImport={handleImportBuild}
          onClear={() => { setTargetBuild({}); setSelectedSlot(null) }}
        />

      </div>

      {/* unused refs to silence TS */}
      {false && (
        <>
          <_ItemPanelUnused slot={'HELMET'} item={null} onClose={() => {}} />
          <_BuildImportPanelUnused onImport={() => {}} onClose={() => {}} />
        </>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes ember0{0%,100%{opacity:0}20%{opacity:0.5}50%{transform:translateY(-60px) translateX(5px);opacity:0.3}100%{transform:translateY(-120px);opacity:0}}@keyframes ember1{0%,100%{opacity:0}15%{opacity:0.45}60%{transform:translateY(-80px) translateX(-7px);opacity:0.2}100%{transform:translateY(-145px);opacity:0}}@keyframes ember2{0%,100%{opacity:0}25%{opacity:0.5}55%{transform:translateY(-70px) translateX(4px);opacity:0.2}100%{transform:translateY(-135px);opacity:0}}`}</style>
    </div>
  )
}
