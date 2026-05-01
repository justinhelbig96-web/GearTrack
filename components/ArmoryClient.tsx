'use client'

import { useState, useCallback } from 'react'
import { ArmorySlot, type ArmorySlotData, type SlotState } from '@/components/ArmorySlot'
import { ItemDetailPanel } from '@/components/ItemDetailPanel'
import type { GearSlot, ParsedItem, SlotComparison } from '@/lib/types'
import { cn } from '@/lib/utils'
import { RefreshCw, Plus } from 'lucide-react'

// ─── Slot layout positions on the silhouette ─────────────────────────────────
// We use a CSS grid with named areas to position slots around the character.
// Layout mirrors a classic Diablo 4 inventory screen.

const SLOT_LAYOUT = [
  // Left column (top to bottom)
  { slot: 'HELMET'    as GearSlot, label: 'Helmet',     icon: '⛑',  col: 1, row: 1 },
  { slot: 'CHEST'     as GearSlot, label: 'Chest',      icon: '🛡',  col: 1, row: 2 },
  { slot: 'GLOVES'    as GearSlot, label: 'Gloves',     icon: '🧤',  col: 1, row: 3 },
  { slot: 'PANTS'     as GearSlot, label: 'Pants',      icon: '👖',  col: 1, row: 4 },
  // Right column (top to bottom)
  { slot: 'AMULET'    as GearSlot, label: 'Amulet',     icon: '📿',  col: 3, row: 1 },
  { slot: 'RING1'     as GearSlot, label: 'Ring 1',     icon: '💍',  col: 3, row: 2 },
  { slot: 'RING2'     as GearSlot, label: 'Ring 2',     icon: '💍',  col: 3, row: 3 },
  { slot: 'BOOTS'     as GearSlot, label: 'Boots',      icon: '👢',  col: 3, row: 4 },
  // Bottom row (weapons)
  { slot: 'MAIN_HAND' as GearSlot, label: 'Main Hand',  icon: '⚔',  col: 1, row: 5 },
  { slot: 'OFF_HAND'  as GearSlot, label: 'Off Hand',   icon: '🗡',  col: 3, row: 5 },
]

type InventoryState = Partial<Record<GearSlot, ArmorySlotData>>

interface ArmoryClientProps {
  profileId: string
  initialInventory: InventoryState
  comparisons: Partial<Record<GearSlot, SlotComparison>>
}

export function ArmoryClient({ profileId, initialInventory, comparisons }: ArmoryClientProps) {
  const [inventory, setInventory] = useState<InventoryState>(initialInventory)
  const [selectedSlot, setSelectedSlot] = useState<GearSlot | null>(null)

  function getSlotData(slot: GearSlot): ArmorySlotData {
    return inventory[slot] ?? { state: 'empty' }
  }

  const handleUpload = useCallback(async (slot: GearSlot, file: File) => {
    // Optimistic update: uploading state
    setInventory(prev => ({
      ...prev,
      [slot]: { ...prev[slot], state: 'uploading' },
    }))

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('slot', slot)

      const currentItemId = inventory[slot]?.itemId
      if (currentItemId) formData.append('itemId', currentItemId)

      const res = await fetch('/api/ocr', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'OCR failed')
      }

      const { item, parsed, rawText: _raw, confidence } = await res.json()

      // Assign item to profile slot
      await fetch(`/api/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, itemId: item.id }),
      })

      const imageUrl = item.imageUrl ?? undefined

      setInventory(prev => ({
        ...prev,
        [slot]: {
          state: confidence < 0.7 ? 'needs_review' : 'parsed',
          imageUrl,
          parsedItem: parsed as ParsedItem,
          itemId: item.id,
          ocrConfidence: confidence,
        },
      }))
      setSelectedSlot(slot)
    } catch (e) {
      setInventory(prev => ({
        ...prev,
        [slot]: { ...prev[slot], state: 'needs_review' },
      }))
      console.error('[Armory] Upload error:', e)
    }
  }, [inventory, profileId])

  const selectedData = selectedSlot ? getSlotData(selectedSlot) : null
  const selectedComparison = selectedSlot ? comparisons[selectedSlot] : undefined

  return (
    <div className="relative flex-1 flex flex-col">
      {/* Armory grid */}
      <div
        className="flex-1 grid items-start justify-center p-6"
        style={{
          gridTemplateColumns: '120px minmax(160px,220px) 120px',
          gridTemplateRows: 'repeat(5, 120px)',
          gap: '12px',
          maxWidth: 520,
          margin: '0 auto',
        }}
      >
        {/* Character silhouette (center column, rows 1-4) */}
        <div
          style={{ gridColumn: 2, gridRow: '1 / 5' }}
          className="flex items-center justify-center bg-slot-empty border border-d4-border/50 rounded-lg overflow-hidden"
        >
          <CharacterSilhouette />
        </div>

        {/* Weapon row — center empty */}
        <div style={{ gridColumn: 2, gridRow: 5 }} className="flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border border-d4-border/30 bg-d4-bg/50 flex items-center justify-center text-d4-muted/30 text-2xl">
            ⚔
          </div>
        </div>

        {/* Gear slots */}
        {SLOT_LAYOUT.map(({ slot, label, icon, col, row }) => (
          <div key={slot} style={{ gridColumn: col, gridRow: row }}>
            <ArmorySlot
              slot={slot}
              label={label}
              icon={icon}
              slotData={getSlotData(slot)}
              onUpload={handleUpload}
              onClick={setSelectedSlot}
              compareScore={comparisons[slot]?.score}
              className="w-full"
            />
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selectedSlot && (
        <ItemDetailPanel
          item={selectedData?.parsedItem ?? null}
          imageUrl={selectedData?.imageUrl}
          itemId={selectedData?.itemId}
          ocrConfidence={selectedData?.ocrConfidence}
          slotComparison={selectedComparison}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </div>
  )
}

function CharacterSilhouette() {
  return (
    <svg viewBox="0 0 120 220" className="w-full h-full opacity-20 text-d4-text" fill="currentColor">
      {/* Head */}
      <ellipse cx="60" cy="30" rx="18" ry="20" />
      {/* Neck */}
      <rect x="54" y="49" width="12" height="12" />
      {/* Torso */}
      <path d="M30 61 Q25 65 22 90 L22 140 Q22 145 30 148 L90 148 Q98 145 98 140 L98 90 Q95 65 90 61 Z" />
      {/* Left arm */}
      <path d="M30 65 L14 68 L10 115 L20 118 L24 82 L34 80 Z" />
      {/* Right arm */}
      <path d="M90 65 L106 68 L110 115 L100 118 L96 82 L86 80 Z" />
      {/* Left leg */}
      <path d="M34 148 L28 148 L22 210 L42 210 L46 165 L52 148 Z" />
      {/* Right leg */}
      <path d="M86 148 L92 148 L98 210 L78 210 L74 165 L68 148 Z" />
    </svg>
  )
}
