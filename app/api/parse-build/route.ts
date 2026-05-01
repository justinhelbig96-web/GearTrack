import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import type { GearSlot } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface SlotData {
  affixes: string[]
  greaterAffixes: string[]
  aspect?: string
  notes?: string
}

export type ParsedBuild = Partial<Record<GearSlot, SlotData>>

const SLOT_KEYWORDS: Record<string, GearSlot> = {
  helm:      'HELMET',
  helmet:    'HELMET',
  chest:     'CHEST',
  armor:     'CHEST',
  gloves:    'GLOVES',
  pants:     'PANTS',
  trousers:  'PANTS',
  boots:     'BOOTS',
  amulet:    'AMULET',
  necklace:  'AMULET',
  'ring 1':  'RING1',
  'ring 2':  'RING2',
  ring1:     'RING1',
  ring2:     'RING2',
  'main hand': 'MAIN_HAND',
  mainhand:    'MAIN_HAND',
  weapon:      'MAIN_HAND',
  sword:       'MAIN_HAND',
  staff:       'MAIN_HAND',
  'off hand':  'OFF_HAND',
  offhand:     'OFF_HAND',
  focus:       'OFF_HAND',
  shield:      'OFF_HAND',
  dagger:      'OFF_HAND',
}

/** Try to detect which slot a text block belongs to */
function detectSlot(text: string): GearSlot | null {
  const lower = text.toLowerCase()
  for (const [kw, slot] of Object.entries(SLOT_KEYWORDS)) {
    if (lower.includes(kw)) return slot
  }
  return null
}

/** Known strong affixes that indicate a Greater Affix */
const GREATER_AFFIX_INDICATORS = [
  'critical strike damage',
  'critical strike chance',
  'maximum life',
  'total armor',
  'all stats',
  'main stat',
  'core skill damage',
  'lucky hit chance',
  'resource cost reduction',
  'cooldown reduction',
  'movement speed',
  'attack speed',
]

function isLikelyGreaterAffix(affix: string): boolean {
  const lower = affix.toLowerCase()
  return GREATER_AFFIX_INDICATORS.some(g => lower.includes(g))
}

/** Parse a generic page text into a build */
function parseGenericText(text: string): ParsedBuild {
  const build: ParsedBuild = {}

  // Split into chunks by known slot headers
  const slotPattern = /\b(helm(?:et)?|chest\s*(?:armor)?|gloves?|pants?|trousers|boots?|amulet|necklace|ring\s*[12]|(main|off)\s*hand|weapon|sword|staff|focus|shield|dagger)\b/gi
  const parts = text.split(slotPattern)

  let currentSlot: GearSlot | null = null
  for (const part of parts) {
    const slot = detectSlot(part)
    if (slot) {
      currentSlot = slot
      if (!build[currentSlot]) build[currentSlot] = { affixes: [], greaterAffixes: [] }
      continue
    }

    if (!currentSlot) continue

    // Extract affix-like lines: lines with % or numeric boost patterns
    const lines = part.split(/[\n,;|]+/)
    for (const line of lines) {
      const cleaned = line.replace(/[[\]{}()]/g, '').trim()
      if (cleaned.length < 5 || cleaned.length > 80) continue
      if (/\d+\s*%|[\+\-]\s*\d|\bto\b.*\bskill|\bchance\b|\bdamage\b|\bspeed\b|\blife\b|\barmor\b|\bstrike\b|\bcooldown\b|\bresource\b|\bstat\b/i.test(cleaned)) {
        const slot = build[currentSlot!]!
        if (!slot.affixes.includes(cleaned)) {
          slot.affixes.push(cleaned)
          if (isLikelyGreaterAffix(cleaned)) {
            slot.greaterAffixes.push(cleaned)
          }
        }
      }
    }
  }

  return build
}

/**
 * Parse d4builds.gg HTML by converting <img alt="..."> into text markers.
 * The site uses:
 *   <img alt="Chest Armor">  → slot header
 *   <img alt="greater affix"> → marks the next text as a Greater Affix
 *   <img alt="Tempering Stat"> → marks the next text as a tempering affix
 */
function parseD4BuildsHTML(html: string): ParsedBuild | null {
  const SLOT_ALT_MAP: Record<string, GearSlot> = {
    'helm':        'HELMET',
    'helmet':      'HELMET',
    'chest armor': 'CHEST',
    'gloves':      'GLOVES',
    'pants':       'PANTS',
    'boots':       'BOOTS',
    'amulet':      'AMULET',
    'ring 1':      'RING1',
    'ring 2':      'RING2',
    'weapon':      'MAIN_HAND',
    'offhand':     'OFF_HAND',
    'off hand':    'OFF_HAND',
  }

  // Replace <img alt="..."> with a placeholder marker, then strip remaining tags
  const withMarkers = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<img[^>]+alt="([^"]*)"[^>]*\/?>/gi, (_m, alt: string) => ` [IMG:${alt}] `)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#?\w+;/g, ' ')

  // Split on [IMG:...] — after split with capture group:
  //   even indices = text between markers, odd indices = img alt values
  const tokens = withMarkers.split(/\[IMG:([^\]]+)\]/g)

  const build: ParsedBuild = {}
  let currentSlot: GearSlot | null = null
  let nextIsGA = false
  let nextIsTempering = false

  for (let i = 0; i < tokens.length; i++) {
    const isImg = i % 2 === 1
    const val = tokens[i].trim()
    if (!val) continue

    if (isImg) {
      const alt = val.toLowerCase()
      const slot = SLOT_ALT_MAP[alt]
      if (slot) {
        currentSlot = slot
        nextIsGA = false
        nextIsTempering = false
        if (!build[currentSlot]) build[currentSlot] = { affixes: [], greaterAffixes: [] }
      } else if (alt === 'greater affix') {
        nextIsGA = true
        nextIsTempering = false
      } else if (alt.includes('tempering')) {
        nextIsTempering = true
        nextIsGA = false
      } else {
        // gem, skill, or other decorative image — reset wait flags
        nextIsGA = false
        nextIsTempering = false
      }
    } else if (currentSlot && (nextIsGA || nextIsTempering)) {
      const affix = val.replace(/\s+/g, ' ').trim()
      if (affix.length >= 2 && affix.length <= 100) {
        const slotData = build[currentSlot]!
        if (!slotData.affixes.includes(affix)) {
          slotData.affixes.push(affix)
          if (nextIsGA) slotData.greaterAffixes.push(affix)
        }
      }
      nextIsGA = false
      nextIsTempering = false
    }
  }

  return Object.keys(build).length > 0 ? build : null
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let url: string
  try {
    const body = await req.json()
    url = body.url as string
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!url?.startsWith('http')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GearGap/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Site returned ${response.status}` }, { status: 502 })
    }

    const html = await response.text()

    // 1. Try alt-text aware parse (works for d4builds.gg and similar sites)
    let build = parseD4BuildsHTML(html)

    // 2. Fall back to text-based parse for other sites
    if (!build || Object.keys(build).length === 0) {
      const text = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#?\w+;/g, ' ')

      build = parseGenericText(text)
    }

    const slotCount = Object.keys(build).length

    return NextResponse.json({
      build,
      slotCount,
      source: url,
      note: slotCount === 0
        ? 'Could not auto-detect slots. The site may use client-side rendering. Try copying build text manually.'
        : `Detected ${slotCount} slots.`,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Fetch failed: ${msg}` }, { status: 502 })
  }
}
