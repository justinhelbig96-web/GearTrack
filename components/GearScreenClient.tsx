'use client'

import { useState, useCallback, useRef } from 'react'
import type { GearSlot, ParsedItem } from '@/lib/types'
import type { ParsedBuild } from '@/app/api/parse-build/route'

const D4 = 'var(--font-diablo)'

/* ─── Slot layout ───────────────────────────────────────────── */
// Left column: Helm, Chest, Gloves, Pants, Boots
// Right column: Amulet, Ring1, Ring2
// Bottom: Main Hand, Off Hand

const LEFT_SLOTS: { slot: GearSlot; label: string }[] = [
  { slot: 'HELMET',    label: 'Helm'    },
  { slot: 'CHEST',     label: 'Chest'   },
  { slot: 'GLOVES',    label: 'Gloves'  },
  { slot: 'PANTS',     label: 'Pants'   },
  { slot: 'BOOTS',     label: 'Boots'   },
]

const RIGHT_SLOTS: { slot: GearSlot; label: string }[] = [
  { slot: 'AMULET', label: 'Amulet'  },
  { slot: 'RING1',  label: 'Ring 1'  },
  { slot: 'RING2',  label: 'Ring 2'  },
]

const WEAPON_SLOTS: { slot: GearSlot; label: string }[] = [
  { slot: 'MAIN_HAND', label: 'Main Hand' },
  { slot: 'OFF_HAND',  label: 'Off Hand'  },
]

/* ─── Icon SVGs ─────────────────────────────────────────────── */
const SLOT_ICONS: Record<GearSlot, React.ReactNode> = {
  HELMET:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-6 h-6 opacity-40"><path d="M12 3C7 3 4 7 4 11v3l1 2h14l1-2v-3C20 7 17 3 12 3z"/><path d="M8 16v2a4 4 0 0 0 8 0v-2"/></svg>,
  CHEST:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-6 h-6 opacity-40"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M12 4v16"/></svg>,
  GLOVES:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-6 h-6 opacity-40"><path d="M8 20V12L5 8V5a1 1 0 0 1 2 0v4h2V4a1 1 0 0 1 2 0v5h1V5a1 1 0 0 1 2 0v4h1V7a1 1 0 0 1 2 0v6l-3 4v3"/></svg>,
  PANTS:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-6 h-6 opacity-40"><path d="M5 4h14l-2 10-3 6H10L7 14 5 4z"/><path d="M12 4v8"/></svg>,
  BOOTS:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-6 h-6 opacity-40"><path d="M4 18h14l2-8H8L6 6H3v4l1 8z"/></svg>,
  AMULET:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-6 h-6 opacity-40"><circle cx="12" cy="14" r="4"/><path d="M12 10V4M9 7l3-3 3 3"/></svg>,
  RING1:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-6 h-6 opacity-40"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  RING2:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-6 h-6 opacity-40"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  MAIN_HAND: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-6 h-6 opacity-40"><path d="M12 3v18M9 6l3-3 3 3M6 12l6-6 6 6M5 21h14"/></svg>,
  OFF_HAND:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-6 h-6 opacity-40"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>,
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
  slot, label, item, imageUrl, uploading, targetAffixes, targetGreaterAffixes,
  onUpload, onSelect, selected,
}: SlotTileProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    onSelect(slot)
    if (!item && !uploading) inputRef.current?.click()
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(slot, file)
    e.target.value = ''
  }

  const hasItem = !!item
  const greaterCount = item?.greaterAffixes?.length ?? 0

  // Compare: how many target affixes are present
  const matchCount = targetAffixes && item
    ? item.affixes.filter(a =>
        targetAffixes.some(t => a.name?.toLowerCase().includes(t.toLowerCase().split('%')[0].trim()))
      ).length
    : 0
  const scoreColor = !targetAffixes ? 'transparent'
    : matchCount === targetAffixes.length ? '#22c55e'
    : matchCount > 0 ? '#eab308'
    : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ width: 80 }}>
      <span style={{ fontFamily: D4, fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b5e4a' }}>
        {label}
      </span>

      <div
        onClick={handleClick}
        className="relative cursor-pointer group"
        style={{
          width: 80, height: 80,
          background: 'radial-gradient(ellipse at center, #1c1a26 0%, #0a0a0f 100%)',
          border: `2px solid ${selected ? '#c8a84b' : hasItem ? '#3d2e1e' : '#1e1a2a'}`,
          borderRadius: 6,
          boxShadow: selected
            ? '0 0 16px rgba(200,168,75,0.5), inset 0 0 8px rgba(0,0,0,0.8)'
            : hasItem
            ? `0 0 0 1px ${scoreColor}40, inset 0 0 8px rgba(0,0,0,0.8)`
            : 'inset 0 0 8px rgba(0,0,0,0.8)',
          transition: 'all 0.2s ease',
          overflow: 'hidden',
        }}
      >
        {/* Image or icon */}
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#c5b89a]">
            {uploading ? (
              <div style={{ width: 20, height: 20, border: '2px solid #c8a84b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              SLOT_ICONS[slot]
            )}
          </div>
        )}

        {/* Hover upload overlay */}
        {hasItem && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c8a84b" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span style={{ color: '#c8a84b', fontSize: '0.5rem', marginTop: 3, fontFamily: D4, letterSpacing: '0.1em' }}>Replace</span>
          </div>
        )}

        {/* Comparison indicator bar */}
        {targetAffixes && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
            background: scoreColor, opacity: 0.8,
          }} />
        )}

        {/* Greater affix gold stars */}
        {greaterCount > 0 && (
          <div style={{
            position: 'absolute', top: 2, right: 2,
            color: '#c8a84b', fontSize: '0.5rem', lineHeight: 1,
            textShadow: '0 0 6px #c8a84b',
          }}>
            {'✦'.repeat(greaterCount)}
          </div>
        )}
      </div>

      {/* Item name */}
      {item?.itemName && (
        <span style={{ fontSize: '0.5rem', color: '#8a7a62', textAlign: 'center', lineHeight: 1.3, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.itemName}
        </span>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
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

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 overflow-y-auto"
      style={{
        width: 320,
        background: 'linear-gradient(180deg, rgba(18,16,28,0.98) 0%, rgba(6,4,14,0.99) 100%)',
        borderLeft: '1px solid rgba(200,168,75,0.15)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.8)',
      }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: D4, color: '#c8a84b', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            {slotLabel}
          </h3>
          <button onClick={onClose} style={{ color: '#6b5e4a', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
        </div>

        <div className="h-px mb-4" style={{ background: 'linear-gradient(to right, transparent, rgba(200,168,75,0.3), transparent)' }} />

        {!item ? (
          <p style={{ color: '#6b5e4a', fontSize: '0.75rem', textAlign: 'center', paddingTop: '2rem' }}>
            No item scanned yet.<br />Click the slot to upload a screenshot.
          </p>
        ) : (
          <>
            {/* Item header */}
            <div className="mb-3">
              {item.itemName && (
                <p style={{ color: '#c8a84b', fontFamily: D4, fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
                  {item.itemName}
                </p>
              )}
              <div className="flex gap-3">
                {item.itemPower && <span style={{ color: '#8a7a62', fontSize: '0.65rem' }}>Power {item.itemPower}</span>}
                {item.rarity && <span style={{ color: rarityColor(item.rarity), fontSize: '0.65rem', textTransform: 'uppercase' }}>{item.rarity}</span>}
                {item.masterworkLevel > 0 && <span style={{ color: '#a78bfa', fontSize: '0.65rem' }}>MW {item.masterworkLevel}</span>}
              </div>
            </div>

            {/* Affixes */}
            {item.affixes.length > 0 && (
              <div className="mb-3">
                <p style={{ color: '#6b5e4a', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Affixes</p>
                {item.affixes.map((a, i) => {
                  const isGreater = item.greaterAffixes.includes(a.name ?? '')
                  const isTarget = targetData?.affixes.some(t => a.name?.toLowerCase().includes(t.toLowerCase().split('%')[0].trim()))
                  return (
                    <div key={i} className="flex items-start gap-2 mb-1">
                      {isGreater && <span style={{ color: '#c8a84b', fontSize: '0.6rem', flexShrink: 0 }}>✦</span>}
                      {!isGreater && <span style={{ width: 10, flexShrink: 0 }} />}
                      <span style={{
                        fontSize: '0.7rem',
                        color: isTarget ? '#22c55e' : '#c5b89a',
                        lineHeight: 1.4,
                      }}>
                        {a.raw ?? `${a.name} ${a.valueText ?? ''}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Aspect */}
            {item.aspect && (
              <div className="mb-3 p-2 rounded" style={{ background: 'rgba(200,100,0,0.08)', border: '1px solid rgba(200,100,0,0.2)' }}>
                <p style={{ color: '#c84b1a', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Aspect</p>
                <p style={{ color: '#c5b89a', fontSize: '0.68rem' }}>{item.aspect.name}</p>
                <p style={{ color: '#6b5e4a', fontSize: '0.6rem', marginTop: '0.2rem' }}>{item.aspect.effect}</p>
              </div>
            )}

            {/* Target comparison */}
            {targetData && targetData.affixes.length > 0 && (
              <div>
                <div className="h-px mb-3" style={{ background: 'linear-gradient(to right, transparent, rgba(200,168,75,0.2), transparent)' }} />
                <p style={{ color: '#6b5e4a', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Build Requirements
                </p>
                {targetData.affixes.map((req, i) => {
                  const found = item.affixes.some(a => a.name?.toLowerCase().includes(req.toLowerCase().split('%')[0].trim()))
                  const needsGreater = targetData.greaterAffixes.includes(req)
                  const hasGreater = found && item.greaterAffixes.some(g => req.toLowerCase().includes(g.toLowerCase()))
                  return (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: '0.65rem', color: found ? '#22c55e' : '#ef4444' }}>
                        {found ? '✓' : '✗'}
                      </span>
                      {needsGreater && <span style={{ fontSize: '0.55rem', color: hasGreater ? '#c8a84b' : '#6b5e4a' }}>✦</span>}
                      <span style={{ fontSize: '0.68rem', color: found ? '#c5b89a' : '#6b5e4a' }}>{req}</span>
                    </div>
                  )
                })}
              </div>
            )}
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

  const allSlots = [...LEFT_SLOTS, ...RIGHT_SLOTS, ...WEAPON_SLOTS]

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(ellipse at 50% 100%, #0f0508 0%, #05040a 60%, #020205 100%)' }}
    >
      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{ borderBottom: '1px solid rgba(200,168,75,0.1)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }}
      >
        <span style={{ fontFamily: D4, color: '#c8a84b', fontSize: '1rem', letterSpacing: '0.3em' }}>GearGap</span>

        <div className="flex items-center gap-3">
          {/* Build import button */}
          <button
            onClick={() => { setBuildPanelOpen(true); setSelectedSlot(null) }}
            className="flex items-center gap-2 px-4 py-2 rounded"
            style={{
              fontFamily:    D4,
              fontSize:      '0.65rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              background:    'rgba(200,168,75,0.08)',
              border:        '1px solid rgba(200,168,75,0.25)',
              color:         '#c8a84b',
              cursor:        'pointer',
              transition:    'all 0.2s',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Import Build
          </button>

          {/* Score badge */}
          {Object.keys(targetBuild).length > 0 && (
            <div style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 4, padding: '3px 10px', fontSize: '0.6rem', color: '#22c55e', fontFamily: D4, letterSpacing: '0.1em',
            }}>
              Build loaded
            </div>
          )}

          {/* BattleTag */}
          <span style={{ color: '#6b5e4a', fontSize: '0.7rem', fontFamily: D4, letterSpacing: '0.1em' }}>
            {name ?? battleTag}
          </span>

          {/* Logout */}
          <a href="/api/auth/logout" style={{ color: '#3d2e1e', fontSize: '0.65rem', fontFamily: D4, letterSpacing: '0.1em', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c84b1a')}
            onMouseLeave={e => (e.currentTarget.style.color = '#3d2e1e')}>
            Logout
          </a>
        </div>
      </div>

      {/* ── Character Screen ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-8" style={{ position: 'relative' }}>

        {/* Hell glow */}
        <div className="absolute pointer-events-none" style={{
          bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '80%', height: '40%',
          background: 'radial-gradient(ellipse at center bottom, rgba(120,15,5,0.25) 0%, transparent 70%)',
        }} />

        <div className="relative flex items-center gap-6" style={{ maxWidth: 700 }}>

          {/* ── Left slots ── */}
          <div className="flex flex-col gap-4">
            {LEFT_SLOTS.map(({ slot, label }) => (
              <SlotTile
                key={slot}
                slot={slot}
                label={label}
                item={inventory[slot]?.parsedItem}
                imageUrl={inventory[slot]?.imageUrl}
                uploading={inventory[slot]?.uploading}
                targetAffixes={targetBuild[slot]?.affixes}
                targetGreaterAffixes={targetBuild[slot]?.greaterAffixes}
                onUpload={handleUpload}
                onSelect={s => { setSelectedSlot(s); setBuildPanelOpen(false) }}
                selected={selectedSlot === slot}
              />
            ))}
          </div>

          {/* ── Center ── */}
          <div className="flex flex-col items-center gap-4" style={{ width: 160 }}>
            {/* Character silhouette */}
            <div style={{
              width: 140, height: 280,
              background: 'radial-gradient(ellipse at center, rgba(28,26,38,0.8) 0%, rgba(5,4,10,0.9) 100%)',
              border: '1px solid rgba(200,168,75,0.12)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Glow from bottom */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'radial-gradient(ellipse at center bottom, rgba(180,30,10,0.15) 0%, transparent 70%)' }} />
              {/* Silhouette SVG */}
              <svg viewBox="0 0 60 120" width="60" height="120" style={{ opacity: 0.25, fill: '#c8a84b' }}>
                <circle cx="30" cy="14" r="10"/>
                <path d="M20 25 Q15 35 16 55 Q20 70 30 72 Q40 70 44 55 Q45 35 40 25 Q35 22 30 22 Q25 22 20 25Z"/>
                <path d="M16 55 Q8 60 6 80 Q5 90 10 92 Q12 80 16 72"/>
                <path d="M44 55 Q52 60 54 80 Q55 90 50 92 Q48 80 44 72"/>
                <path d="M22 72 Q18 85 18 110 Q22 112 24 110 Q26 95 30 88 Q34 95 36 110 Q38 112 42 110 Q42 85 38 72"/>
              </svg>
            </div>

            {/* Weapons row */}
            <div className="flex gap-3">
              {WEAPON_SLOTS.map(({ slot, label }) => (
                <SlotTile
                  key={slot}
                  slot={slot}
                  label={label}
                  item={inventory[slot]?.parsedItem}
                  imageUrl={inventory[slot]?.imageUrl}
                  uploading={inventory[slot]?.uploading}
                  targetAffixes={targetBuild[slot]?.affixes}
                  targetGreaterAffixes={targetBuild[slot]?.greaterAffixes}
                  onUpload={handleUpload}
                  onSelect={s => { setSelectedSlot(s); setBuildPanelOpen(false) }}
                  selected={selectedSlot === slot}
                />
              ))}
            </div>
          </div>

          {/* ── Right slots ── */}
          <div className="flex flex-col gap-4">
            {RIGHT_SLOTS.map(({ slot, label }) => (
              <SlotTile
                key={slot}
                slot={slot}
                label={label}
                item={inventory[slot]?.parsedItem}
                imageUrl={inventory[slot]?.imageUrl}
                uploading={inventory[slot]?.uploading}
                targetAffixes={targetBuild[slot]?.affixes}
                targetGreaterAffixes={targetBuild[slot]?.greaterAffixes}
                onUpload={handleUpload}
                onSelect={s => { setSelectedSlot(s); setBuildPanelOpen(false) }}
                selected={selectedSlot === slot}
              />
            ))}
          </div>
        </div>

        {/* Hint text when nothing uploaded */}
        {Object.values(inventory).every(v => !v?.parsedItem) && (
          <div
            className="absolute bottom-6 left-1/2"
            style={{ transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'none' }}
          >
            <p style={{ color: '#3d2e1e', fontSize: '0.65rem', fontFamily: D4, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
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

      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
