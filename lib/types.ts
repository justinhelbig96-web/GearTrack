// ─────────────────────────────────────────
// Shared type definitions for GearGap
// ─────────────────────────────────────────

export type GearSlot =
  | 'HELMET'
  | 'CHEST'
  | 'GLOVES'
  | 'PANTS'
  | 'BOOTS'
  | 'AMULET'
  | 'RING1'
  | 'RING2'
  | 'MAIN_HAND'
  | 'OFF_HAND'

export type ItemRarity = 'NORMAL' | 'MAGIC' | 'RARE' | 'LEGENDARY' | 'UNIQUE'

export interface Affix {
  name: string
  value?: number
  valueText?: string  // e.g. "+15.5%"
  raw: string         // original text
}

export interface ItemAspect {
  name: string
  effect: string
}

export interface ParsedItem {
  slot?: GearSlot
  itemName?: string
  itemPower?: number
  rarity?: ItemRarity
  affixes: Affix[]
  greaterAffixes: string[]       // names of affixes flagged as "greater"
  aspect?: ItemAspect
  temperingAffixes: Affix[]
  masterworkLevel: number
  gem?: string
  rune?: string
}

export interface OcrResult {
  rawText: string
  confidence: number
  parsedItem: ParsedItem
}

// ─────────────────────────────────────────
// Build types
// ─────────────────────────────────────────

export interface BuildAffixRequirement {
  name: string
  minValue?: number
  required: boolean
}

export interface BuildSlotRequirement {
  slot: GearSlot
  affixes: BuildAffixRequirement[]
  aspect?: string
  notes?: string
}

export type BuildSlotData = Partial<Record<GearSlot, BuildSlotRequirement>>

// ─────────────────────────────────────────
// Comparison types
// ─────────────────────────────────────────

export interface AffixComparison {
  name: string
  status: 'present' | 'missing' | 'wrong'
  required: boolean
  hasGreater?: boolean
}

export interface SlotComparison {
  slot: GearSlot
  score: number          // 0–100
  affixComparisons: AffixComparison[]
  missingAffixes: string[]
  wrongAffixes: string[]
  missingAspect?: string
  suggestions: string[]
}

export interface BuildComparison {
  totalScore: number
  slotResults: Partial<Record<GearSlot, SlotComparison>>
}

// ─────────────────────────────────────────
// Slot metadata (display)
// ─────────────────────────────────────────

export interface SlotMeta {
  slot: GearSlot
  label: string
  icon: string
}

export const GEAR_SLOTS: SlotMeta[] = [
  { slot: 'HELMET',    label: 'Helmet',      icon: '⛑' },
  { slot: 'CHEST',     label: 'Chest',       icon: '🛡' },
  { slot: 'GLOVES',    label: 'Gloves',      icon: '🧤' },
  { slot: 'PANTS',     label: 'Pants',       icon: '👖' },
  { slot: 'BOOTS',     label: 'Boots',       icon: '👢' },
  { slot: 'AMULET',    label: 'Amulet',      icon: '📿' },
  { slot: 'RING1',     label: 'Ring 1',      icon: '💍' },
  { slot: 'RING2',     label: 'Ring 2',      icon: '💍' },
  { slot: 'MAIN_HAND', label: 'Main Hand',   icon: '⚔' },
  { slot: 'OFF_HAND',  label: 'Off Hand',    icon: '🗡' },
]

export const RARITY_COLORS: Record<ItemRarity, string> = {
  NORMAL:    'text-rarity-normal',
  MAGIC:     'text-rarity-magic',
  RARE:      'text-rarity-rare',
  LEGENDARY: 'text-rarity-legendary',
  UNIQUE:    'text-rarity-unique',
}

export const RARITY_BORDER: Record<ItemRarity, string> = {
  NORMAL:    'border-d4-muted',
  MAGIC:     'border-rarity-magic',
  RARE:      'border-rarity-rare',
  LEGENDARY: 'border-rarity-legendary',
  UNIQUE:    'border-rarity-unique',
}
