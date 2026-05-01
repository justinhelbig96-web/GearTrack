/**
 * Diablo 4 Item Tooltip Parser
 *
 * Accepts raw OCR text and extracts structured item data.
 * Designed to be robust against noisy OCR output.
 */

import type { ParsedItem, Affix, ItemRarity, GearSlot, ItemAspect } from '@/lib/types'

// ─── Rarity detection ─────────────────────────────────────────────────────────

const RARITY_PATTERNS: [RegExp, ItemRarity][] = [
  [/\bunique\b/i,     'UNIQUE'],
  [/\blegendary\b/i,  'LEGENDARY'],
  [/\brare\b/i,       'RARE'],
  [/\bmagic\b/i,      'MAGIC'],
  [/\bnormal\b/i,     'NORMAL'],
]

// Words whose presence in the title line indicate a rarity
const RARITY_TITLE_WORDS: Record<string, ItemRarity> = {
  Ancestral: 'LEGENDARY', Sacred: 'LEGENDARY',
}

function detectRarity(lines: string[]): ItemRarity | undefined {
  for (const line of lines) {
    for (const [pattern, rarity] of RARITY_PATTERNS) {
      if (pattern.test(line)) return rarity
    }
    for (const [word, rarity] of Object.entries(RARITY_TITLE_WORDS)) {
      if (line.includes(word)) return rarity
    }
  }
  return undefined
}

// ─── Slot detection ────────────────────────────────────────────────────────────

const SLOT_PATTERNS: [RegExp, GearSlot][] = [
  [/\bhelmet\b|\bhelm\b|\bhood\b|\bcrown\b|\bcap\b/i,              'HELMET'],
  [/\bchest\b|\barmor\b|\btunic\b|\bcoat\b|\bplate\b/i,            'CHEST'],
  [/\bgloves\b|\bgauntlets\b|\bfists\b/i,                           'GLOVES'],
  [/\bpants\b|\bleggings\b|\bgreaves\b|\btrousers\b/i,              'PANTS'],
  [/\bboots\b|\bsabatons\b|\bshoes\b|\bsandals\b/i,                'BOOTS'],
  [/\bamulet\b|\bnecklace\b|\bpendant\b|\btorc\b/i,                'AMULET'],
  [/\bring\b/i,                                                      'RING1'],
  [/\b(two.?hand|staff|scythe|bow|crossbow)\b/i,                   'MAIN_HAND'],
  [/\b(one.?hand|sword|axe|mace|dagger|wand|focus|shield|orb)\b/i, 'MAIN_HAND'],
  [/\boff.?hand\b|\bfocus\b|\btome\b/i,                            'OFF_HAND'],
]

function detectSlot(lines: string[]): GearSlot | undefined {
  for (const line of lines) {
    for (const [pattern, slot] of SLOT_PATTERNS) {
      if (pattern.test(line)) return slot
    }
  }
  return undefined
}

// ─── Item Power ────────────────────────────────────────────────────────────────

const ITEM_POWER_RE = /item\s+power\s+(\d+)/i

function parseItemPower(text: string): number | undefined {
  const m = ITEM_POWER_RE.exec(text)
  return m ? parseInt(m[1], 10) : undefined
}

// ─── Masterwork level ──────────────────────────────────────────────────────────

const MASTERWORK_RE = /masterwork(?:ing)?\s+(?:rank\s+)?(\d+)/i

function parseMasterwork(text: string): number {
  const m = MASTERWORK_RE.exec(text)
  return m ? parseInt(m[1], 10) : 0
}

// ─── Aspect ────────────────────────────────────────────────────────────────────

const ASPECT_NAME_RE = /Aspect\s+of\s+[\w\s]+|[\w\s]+\'s?\s+Aspect/gi

function parseAspect(lines: string[]): ItemAspect | undefined {
  let aspectName: string | undefined
  let aspectEffect = ''
  let capturing = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!aspectName && ASPECT_NAME_RE.test(trimmed)) {
      aspectName = trimmed
      capturing = true
      ASPECT_NAME_RE.lastIndex = 0
      continue
    }
    if (capturing && trimmed.length > 0 && !isStatLine(trimmed)) {
      aspectEffect += (aspectEffect ? ' ' : '') + trimmed
    } else if (capturing && trimmed.length === 0) {
      capturing = false
    }
  }

  if (aspectName) return { name: aspectName, effect: aspectEffect }
  return undefined
}

// ─── Affixes ───────────────────────────────────────────────────────────────────

// A stat line starts with +/- or a number, or contains percent/flat numeric
const STAT_LINE_RE = /^[+\-]?\s*[\d.,]+\s*%?\s+|^\+\s*\d+\s+to\s+/i
const GREATER_RE   = /\[greater\]|\[g\]/i

function isStatLine(line: string): boolean {
  return STAT_LINE_RE.test(line.trim())
}

interface AffineParsed {
  affixes: Affix[]
  greaterAffixes: string[]
}

function parseAffixes(lines: string[]): AffineParsed {
  const affixes: Affix[] = []
  const greaterAffixes: string[] = []

  // We look for lines that look like stat lines
  // Example: "+ 18.5% Cooldown Reduction [GREATER]"
  const AFF_RE = /^[+\-]?\s*([\d.,]+)\s*(%|)\s+(.+?)(?:\s*\[.*\])?\s*$/i

  for (const line of lines) {
    const trimmed = line.trim()
    if (!isStatLine(trimmed)) continue
    // Skip lines that look like aspects/socket/tempering headers
    if (/aspect\s+of|tempering:|socket|gem:|rune:/i.test(trimmed)) continue

    const m = AFF_RE.exec(trimmed)
    if (m) {
      const valueText = m[1] + m[2]
      const name = m[3].trim()
      const value = parseFloat(m[1].replace(',', '.'))
      const affix: Affix = { name, value, valueText: `+${valueText}`, raw: trimmed }
      affixes.push(affix)
      if (GREATER_RE.test(trimmed)) {
        greaterAffixes.push(name)
      }
    } else {
      // fallback: raw line
      affixes.push({ name: trimmed, raw: trimmed })
    }
  }

  return { affixes, greaterAffixes }
}

// ─── Tempering ────────────────────────────────────────────────────────────────

function parseTemplering(lines: string[]): Affix[] {
  const tempering: Affix[] = []
  let inTempering = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^tempering:/i.test(trimmed)) {
      inTempering = true
      // value might be on same line after colon
      const after = trimmed.replace(/^tempering:\s*/i, '')
      if (after.length > 0) {
        tempering.push({ name: after, raw: trimmed })
      }
      continue
    }
    // Tempering section ends at blank line or next section header
    if (inTempering) {
      if (trimmed.length === 0 || /^(aspect|gem:|rune:|socket|masterwork|item power)/i.test(trimmed)) {
        inTempering = false
        continue
      }
      if (isStatLine(trimmed)) {
        tempering.push({ name: trimmed, raw: trimmed })
      } else {
        tempering.push({ name: trimmed, raw: trimmed })
      }
    }
  }

  return tempering
}

// ─── Gem / Rune ────────────────────────────────────────────────────────────────

const GEM_RE  = /^([A-Z][a-z]+\s+(?:gem|diamond|ruby|sapphire|emerald|topaz|skull|amethyst))/i
const RUNE_RE = /rune:\s*(.+)/i

function parseGemRune(lines: string[]): { gem?: string; rune?: string } {
  let gem: string | undefined
  let rune: string | undefined

  for (const line of lines) {
    const trimmed = line.trim()
    const gm = GEM_RE.exec(trimmed)
    if (gm) { gem = gm[1]; continue }
    const rm = RUNE_RE.exec(trimmed)
    if (rm) { rune = rm[1].trim(); continue }

    if (/socket\s+\(empty\)|empty\s+socket/i.test(trimmed)) {
      gem = 'Empty Socket'
    }
  }

  return { gem, rune }
}

// ─── Item name ─────────────────────────────────────────────────────────────────

function parseItemName(lines: string[]): string | undefined {
  // Usually first non-empty line that isn't a rarity word alone
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (/^(normal|magic|rare|legendary|unique|sacred|ancestral)$/i.test(trimmed)) continue
    if (ITEM_POWER_RE.test(trimmed)) continue
    if (isStatLine(trimmed)) continue
    return trimmed
  }
  return undefined
}

// ─── Main entry point ──────────────────────────────────────────────────────────

export function parseD4ItemTooltip(rawText: string): ParsedItem {
  // Normalise line endings and split
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(l => l.replace(/\t/g, ' ').trimEnd())

  const itemName      = parseItemName(lines)
  const itemPower     = parseItemPower(rawText)
  const rarity        = detectRarity(lines)
  const slot          = detectSlot(lines)
  const masterwork    = parseMasterwork(rawText)
  const aspect        = parseAspect(lines)
  const tempering     = parseTemplering(lines)
  const { gem, rune } = parseGemRune(lines)

  // Exclude lines already consumed by other parsers
  const pureStatLines = lines.filter(l => {
    const t = l.trim()
    if (!t) return false
    if (t === itemName) return false
    if (ITEM_POWER_RE.test(t)) return false
    if (MASTERWORK_RE.test(t)) return false
    if (ASPECT_NAME_RE.test(t)) return false
    if (/^tempering:/i.test(t)) return false
    if (/socket|gem:|rune:/i.test(t)) return false
    return true
  })

  ASPECT_NAME_RE.lastIndex = 0

  const { affixes, greaterAffixes } = parseAffixes(pureStatLines)

  return {
    slot,
    itemName,
    itemPower,
    rarity,
    affixes,
    greaterAffixes,
    aspect,
    temperingAffixes: tempering,
    masterworkLevel: masterwork,
    gem,
    rune,
  }
}

// ─── Build text parser ────────────────────────────────────────────────────────
// Parses pasted Maxroll-style text like:
//   Helmet: Cooldown Reduction, Max Life, Armor

import type { BuildSlotData, BuildSlotRequirement, GearSlot as GS } from '@/lib/types'

const SLOT_NAME_MAP: Record<string, GS> = {
  helmet: 'HELMET', helm: 'HELMET',
  chest: 'CHEST', 'chest armor': 'CHEST',
  gloves: 'GLOVES', gauntlets: 'GLOVES',
  pants: 'PANTS', leggings: 'PANTS',
  boots: 'BOOTS',
  amulet: 'AMULET', necklace: 'AMULET',
  'ring 1': 'RING1', ring1: 'RING1',
  'ring 2': 'RING2', ring2: 'RING2',
  'main hand': 'MAIN_HAND', mainhand: 'MAIN_HAND', weapon: 'MAIN_HAND',
  'off hand': 'OFF_HAND', offhand: 'OFF_HAND', focus: 'OFF_HAND', shield: 'OFF_HAND',
}

export function parseBuildText(text: string): BuildSlotData {
  const result: BuildSlotData = {}
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  for (const line of lines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue

    const slotRaw = line.slice(0, colonIdx).trim().toLowerCase()
    const gearSlot = SLOT_NAME_MAP[slotRaw]
    if (!gearSlot) continue

    const affixPart = line.slice(colonIdx + 1).trim()
    const affixNames = affixPart
      .split(',')
      .map(a => a.trim())
      .filter(Boolean)

    const req: BuildSlotRequirement = {
      slot: gearSlot,
      affixes: affixNames.map(name => ({ name, required: true })),
    }

    result[gearSlot] = req
  }

  return result
}
