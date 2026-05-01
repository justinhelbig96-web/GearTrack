'use client'

import { useState, useCallback } from 'react'
import { UploadDropzone } from '@/components/UploadDropzone'
import { cn } from '@/lib/utils'
import type { GearSlot, ParsedItem, ItemRarity } from '@/lib/types'
import { RARITY_BORDER } from '@/lib/types'
import { Loader2, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react'

export type SlotState = 'empty' | 'uploading' | 'parsed' | 'needs_review' | 'compared'

export interface ArmorySlotData {
  state: SlotState
  imageUrl?: string
  parsedItem?: ParsedItem
  itemId?: string
  ocrConfidence?: number
}

interface ArmorySlotProps {
  slot: GearSlot
  label: string
  icon?: string
  slotData: ArmorySlotData
  onUpload: (slot: GearSlot, file: File) => Promise<void>
  onClick: (slot: GearSlot) => void
  compareScore?: number
  className?: string
}

const STATE_ICON: Record<SlotState, React.ReactNode> = {
  empty:        <HelpCircle className="h-3 w-3 text-d4-muted" />,
  uploading:    <Loader2 className="h-3 w-3 text-d4-gold animate-spin" />,
  parsed:       <CheckCircle className="h-3 w-3 text-cmp-good" />,
  needs_review: <AlertCircle className="h-3 w-3 text-cmp-partial" />,
  compared:     <CheckCircle className="h-3 w-3 text-d4-gold" />,
}

const STATE_BORDER: Record<SlotState, string> = {
  empty:        'border-d4-border',
  uploading:    'border-d4-gold/50',
  parsed:       'border-cmp-good/60',
  needs_review: 'border-cmp-partial/60',
  compared:     'border-d4-gold/80',
}

function rarityBorder(rarity?: ItemRarity): string {
  if (!rarity) return ''
  return RARITY_BORDER[rarity]
}

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-cmp-good'
  if (score >= 50) return 'bg-cmp-partial'
  return 'bg-cmp-bad'
}

export function ArmorySlot({
  slot,
  label,
  icon,
  slotData,
  onUpload,
  onClick,
  compareScore,
  className,
}: ArmorySlotProps) {
  const [draggingOver, setDraggingOver] = useState(false)

  const handleFile = useCallback(
    async (file: File) => {
      await onUpload(slot, file)
    },
    [slot, onUpload]
  )

  const rarity = slotData.parsedItem?.rarity
  const border = rarity ? rarityBorder(rarity) : STATE_BORDER[slotData.state]

  return (
    <div
      className={cn(
        'group relative flex flex-col',
        className
      )}
      onClick={() => onClick(slot)}
    >
      {/* Slot label */}
      <span className="mb-1 text-[10px] text-d4-muted text-center uppercase tracking-widest font-diablo">
        {label}
      </span>

      {/* Slot box */}
      <UploadDropzone
        onFile={handleFile}
        disabled={slotData.state === 'uploading'}
        previewUrl={slotData.imageUrl}
        className={cn(
          'w-full aspect-square border-2 transition-all duration-200 rounded',
          border,
          slotData.state === 'empty' && 'bg-slot-empty',
          slotData.state !== 'empty' && 'bg-slot-filled',
          'hover:shadow-slot-hover hover:border-d4-gold/60 cursor-pointer'
        )}
      >
        {slotData.state === 'uploading' ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-d4-gold animate-spin" />
          </div>
        ) : slotData.imageUrl ? (
          <div className="relative h-full w-full">
            <img
              src={slotData.imageUrl}
              alt={label}
              className="h-full w-full object-cover rounded"
            />
            {/* Rarity glow overlay */}
            {rarity === 'LEGENDARY' && (
              <div className="absolute inset-0 rounded pointer-events-none shadow-rarity-legendary" />
            )}
            {rarity === 'UNIQUE' && (
              <div className="absolute inset-0 rounded pointer-events-none shadow-rarity-unique" />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1 p-1">
            <span className="text-2xl opacity-30">{icon}</span>
            <span className="text-[9px] text-d4-muted text-center opacity-60">
              Drop screenshot
            </span>
          </div>
        )}
      </UploadDropzone>

      {/* Status indicator */}
      <div className="absolute top-5 right-1 flex items-center gap-0.5">
        {STATE_ICON[slotData.state]}
      </div>

      {/* Compare score bar */}
      {compareScore !== undefined && (
        <div className="mt-1 h-1 w-full bg-d4-border rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', scoreColor(compareScore))}
            style={{ width: `${compareScore}%` }}
          />
        </div>
      )}

      {/* Score label */}
      {compareScore !== undefined && (
        <span className="text-[9px] text-center mt-0.5 font-mono"
          style={{ color: compareScore >= 80 ? '#22c55e' : compareScore >= 50 ? '#eab308' : '#ef4444' }}>
          {compareScore}%
        </span>
      )}

      {/* Parsed item name */}
      {slotData.parsedItem?.itemName && slotData.state !== 'empty' && (
        <p className="mt-1 text-[9px] text-d4-text text-center truncate leading-tight px-0.5">
          {slotData.parsedItem.itemName}
        </p>
      )}
    </div>
  )
}
