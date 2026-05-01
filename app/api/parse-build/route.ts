import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import type { GearSlot } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface SlotData {
  affixes: string[]
  greaterAffixes: string[]
  itemName?: string
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
function detectSlot(text: string | undefined | null): GearSlot | null {
  if (!text) return null
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

  // Split into chunks by known slot headers — use non-capturing inner groups to avoid undefined in parts
  const slotPattern = /\b(helm(?:et)?|chest\s*(?:armor)?|gloves?|pants?|trousers|boots?|amulet|necklace|ring\s*[12]|(?:main|off)\s*hand|weapon|sword|staff|focus|shield|dagger)\b/gi
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
 * d4builds overview section: [IMG:ItemName] rune rune ItemName SlotLabel
 * Scan only the overview text (before "Gear Stats") and pair img alts with slot labels.
 */
function extractD4ItemNames(overviewText: string): Partial<Record<GearSlot, string>> {
  const result: Partial<Record<GearSlot, string>> = {}

  const SKIP = new Set([
    'cir','thul','igni','mot','ral','ort','ith','nef','el','eld','tir',
    'sapphire','diamond','amethyst','ruby','emerald','skull','topaz','jade','seal','image',
  ])
  const SKIP_RE = /background|selected|logo|icon|arrow|shard|fragment|node|category|twitch|youtube|share|save|gear|skill|paragon|character|warplan|note|diablo/i

  const SLOT_TEXT: [RegExp, GearSlot][] = [
    [/\bHelm\b/i,          'HELMET'],
    [/\bChest\s+Armor\b/i, 'CHEST'],
    [/\bGloves\b/i,        'GLOVES'],
    [/\bPants\b/i,         'PANTS'],
    [/\bBoots\b/i,         'BOOTS'],
    [/\bAmulet\b/i,        'AMULET'],
    [/\bRing\s+1\b/i,      'RING1'],
    [/\bRing\s+2\b/i,      'RING2'],
    [/\bWeapon\b/i,        'MAIN_HAND'],
    [/\bOffhand\b/i,       'OFF_HAND'],
  ]

  const imgRe = /\[IMG:([^\]]+)\]/g
  let m: RegExpExecArray | null
  while ((m = imgRe.exec(overviewText)) !== null) {
    const alt = m[1].trim()
    const lower = alt.toLowerCase()
    if (alt.length < 3 || SKIP.has(lower) || SKIP_RE.test(alt)) continue

    const ahead = overviewText.slice(m.index + m[0].length, m.index + m[0].length + 250)
    if (!ahead.includes(alt.slice(0, Math.min(8, alt.length)))) continue

    for (const [slotRe, slot] of SLOT_TEXT) {
      if (result[slot]) continue
      if (slotRe.test(ahead)) { result[slot] = alt; break }
    }
  }
  return result
}

/**
 * mobalytics.gg: affixes are client-side only.
 * Item names ARE server-rendered: "1 Helm DeathlessVisage", "2 Chest armor Shroud..."
 */
function parseMobalytics(html: string): ParsedBuild | null {
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#?\w+;/g, ' ')

  const MOBALYTICS_SLOT_MAP: [RegExp, GearSlot][] = [
    [/\bHelm(?:et)?\b/i,          'HELMET'],
    [/\bChest\s*armo(?:r|ur)?\b/i,'CHEST'],
    [/\bGloves?\b/i,              'GLOVES'],
    [/\bPants?\b/i,               'PANTS'],
    [/\bBoots?\b/i,               'BOOTS'],
    [/\bAmulet\b/i,               'AMULET'],
    [/\bRing\s*1\b/i,             'RING1'],
    [/\bRing\s*2\b/i,             'RING2'],
    [/\bWeapon\b/i,               'MAIN_HAND'],
    [/\bOffhand\b/i,              'OFF_HAND'],
  ]

  const build: ParsedBuild = {}
  // "N SlotLabel ItemName" — stop before next entry or "Equipment"
  const entryRe = /\b(\d+)\s+(Helm(?:et)?|Chest\s*armo(?:r|ur)?|Gloves?|Pants?|Boots?|Amulet|Ring\s*[12]|Weapon|Offhand)\s+([\w'][\w\s'',.`\u2019-]{2,55}?)(?=\s{3,}|\s+\d+\s+(?:Helm|Chest|Gloves|Pants|Boots|Amulet|Ring|Weapon|Offhand)|Equipment|\s*$)/gi
  let m: RegExpExecArray | null
  while ((m = entryRe.exec(text)) !== null) {
    const slotText = m[2]
    const itemName = m[3].trim()
    for (const [re, slot] of MOBALYTICS_SLOT_MAP) {
      if (!re.test(slotText) || itemName.length < 2) continue
      if (!build[slot]) build[slot] = { affixes: [], greaterAffixes: [], itemName }
      else if (!build[slot]!.itemName) build[slot]!.itemName = itemName
      break
    }
  }
  return Object.keys(build).length > 0 ? build : null
}

/**
 * d4builds.gg embeds all build data in __NEXT_DATA__ even though the UI is CSR.
 * Deep-walk the JSON to find slot-keyed item objects with affix arrays.
 */
function parseD4BuildsNextData(html: string): ParsedBuild | null {
  const m = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i)
  if (!m) return null
  let root: unknown
  try { root = JSON.parse(m[1]) } catch { return null }

  const build: ParsedBuild = {}

  const SLOT_PATTERNS: [RegExp, GearSlot][] = [
    [/^hel[lm]?$|^helmet$|^head$/i,                                                       'HELMET'],
    [/^chest[_\s]?armo[ur]?$|^chest$|^body$|^torso$/i,                                    'CHEST'],
    [/^glov(es?)?$/i,                                                                       'GLOVES'],
    [/^pants?$|^legs?$|^trousers?$/i,                                                       'PANTS'],
    [/^boots?$|^feet?$|^shoes?$/i,                                                          'BOOTS'],
    [/^amulet$|^neck(lace)?$/i,                                                             'AMULET'],
    [/^ring[_\s]?1$|^ring1$/i,                                                             'RING1'],
    [/^ring[_\s]?2$|^ring2$/i,                                                             'RING2'],
    [/^(main[_\s]?hand|weapon|sword|staff|scythe|axe|mace|bow|crossbow|wand|dagger|sickle)$/i, 'MAIN_HAND'],
    [/^(off[_\s]?hand|focus|shield|offhand|totem|quiver)$/i,                              'OFF_HAND'],
  ]

  function toSlot(s: string): GearSlot | null {
    const t = s.trim().toLowerCase()
    for (const [re, slot] of SLOT_PATTERNS) { if (re.test(t)) return slot }
    return null
  }

  function pick(o: Record<string, unknown>, keys: string[]): string | null {
    for (const k of keys) {
      if (typeof o[k] === 'string' && (o[k] as string).trim().length > 0) return (o[k] as string).trim()
    }
    return null
  }

  function flatStr(v: unknown, d = 0): string[] {
    if (d > 5) return []
    if (typeof v === 'string') return v.length > 2 && v.length < 130 ? [v] : []
    if (Array.isArray(v)) return v.flatMap(x => flatStr(x, d + 1))
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>
      for (const k of ['name', 'text', 'label', 'value', 'desc', 'description', 'stat', 'affix', 'displayText']) {
        if (typeof o[k] === 'string' && (o[k] as string).length > 2) return [o[k] as string]
      }
    }
    return []
  }

  function parseItem(obj: unknown): { affixes: string[]; greaterAffixes: string[]; itemName?: string } | null {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null
    const o = obj as Record<string, unknown>
    const itemName = pick(o, ['name', 'itemName', 'item_name', 'title', 'label', 'displayName']) ?? undefined
    let affixes: string[] = []
    let greaterAffixes: string[] = []

    for (const k of ['affixes', 'stats', 'mods', 'modifiers', 'properties', 'attributes', 'statList']) {
      if (!Array.isArray(o[k]) || !(o[k] as unknown[]).length) continue
      const arr = o[k] as unknown[]
      const out: string[] = []
      const outGA: string[] = []
      for (const x of arr) {
        if (x && typeof x === 'object' && !Array.isArray(x)) {
          const xo = x as Record<string, unknown>
          const s = pick(xo, ['name', 'text', 'label', 'value', 'affix', 'description', 'displayText'])
          if (s && s.length >= 3) {
            out.push(s)
            if (xo.isGreater || xo.is_greater || xo.greater || xo.ga || xo.isGA) outGA.push(s)
          }
        } else {
          out.push(...flatStr(x))
        }
      }
      if (out.length) { affixes = out; greaterAffixes = outGA; break }
    }

    if (!greaterAffixes.length) {
      for (const k of ['greaterAffixes', 'greater_affixes', 'ga', 'greater']) {
        if (Array.isArray(o[k])) {
          greaterAffixes = (o[k] as unknown[]).flatMap(x => flatStr(x)).filter(s => s.length >= 3)
          if (greaterAffixes.length) break
        }
      }
    }

    return (affixes.length || itemName) ? { affixes, greaterAffixes, itemName } : null
  }

  function walk(obj: unknown, depth = 0) {
    if (depth > 14 || !obj || typeof obj !== 'object') return
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (item && typeof item === 'object') {
          const o = item as Record<string, unknown>
          let slot: GearSlot | null = null
          for (const k of ['slot', 'type', 'slotType', 'slot_type', 'itemSlot', 'gearSlot', 'position', 'equipSlot']) {
            if (typeof o[k] === 'string') { slot = toSlot(o[k] as string); if (slot) break }
          }
          if (slot) { const d = parseItem(item); if (d && !build[slot]) build[slot] = d }
        }
        walk(item, depth + 1)
      }
      return
    }
    const o = obj as Record<string, unknown>
    for (const [key, val] of Object.entries(o)) {
      const slot = toSlot(key)
      if (slot && val && typeof val === 'object' && !Array.isArray(val)) {
        const d = parseItem(val); if (d && !build[slot]) build[slot] = d
      }
      walk(val, depth + 1)
    }
  }

  walk(root)
  return Object.keys(build).length > 0 ? build : null
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
    const raw = tokens[i]
    if (raw == null) continue
    const val = raw.trim()
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

  // Extract item names from the overview section (before "Gear Stats")
  const overviewText = withMarkers.split(/Gear\s+Stats/i)[0]
  const itemNames = extractD4ItemNames(overviewText)
  for (const [slot, name] of Object.entries(itemNames) as [GearSlot, string][]) {
    if (!build[slot]) build[slot] = { affixes: [], greaterAffixes: [] }
    build[slot]!.itemName = name
  }

  return Object.keys(build).length > 0 ? build : null
}

/**
 * Parse the "Gear Stats" text copied directly from d4builds.gg.
 *
 * The copied text looks like (slot headers + affix lines, icons become special chars or disappear):
 *   Helm
 *   27% Critical Strike Chance
 *   25% Lucky Hit Chance
 *   25% Movement Speed
 *   Chest Armor
 *   Willpower
 *   Maximum Resource
 *   ...
 *
 * GA detection: lines immediately after a "✦"-prefixed line or preceded by orange icon are GAs.
 * Since color is lost, we detect GAs by position (lines with ✦ in front when pasting) or heuristics.
 */
function parseGearStatsText(raw: string): ParsedBuild {
  const build: ParsedBuild = {}

  const SLOT_MAP: [RegExp, GearSlot][] = [
    [/^helm(?:et)?$/i,                     'HELMET'],
    [/^chest\s*armo(?:r|ur)?$|^chest$/i,   'CHEST'],
    [/^gloves?$/i,                          'GLOVES'],
    [/^pants?$|^legs?$|^trousers?$/i,       'PANTS'],
    [/^boots?$/i,                           'BOOTS'],
    [/^amulet$|^necklace$/i,                'AMULET'],
    [/^ring\s*1$|^ring1$/i,                 'RING1'],
    [/^ring\s*2$|^ring2$/i,                 'RING2'],
    [/^(?:main\s*hand|weapon|sword|staff|scythe|axe|mace|bow|crossbow|wand|dagger|sickle)$/i, 'MAIN_HAND'],
    [/^(?:off\s*hand|focus|shield|offhand|totem|quiver)$/i, 'OFF_HAND'],
  ]

  function toSlot(s: string): GearSlot | null {
    for (const [re, slot] of SLOT_MAP) if (re.test(s)) return slot
    return null
  }

  // normalise decorative unicode that appears in copy-paste from d4builds
  const ICON_RE = /^[\s✦✥✧✩✪✫✬✭✮✯✰★☆✱✲✳✴✵✶✷✸✹✺✻✼✽✾✿❀❁❂❃❄❅❆❇❈❉❊❋○●◎◉◌◍◎►◄▶◀▸◂▹◃▷◁▻◅▴▵▾▿△▽→←↑↓↳↵⇒⇐•·‧‣⁃·▪□■◆◇◈⬤⬟⬠❯❮≡≣|—–*\-/\\]+/u

  let currentSlot: GearSlot | null = null

  for (const rawLine of raw.split(/\r?\n/)) {
    // Strip leading icon characters
    const line = rawLine.replace(ICON_RE, '').trim()
    if (!line) continue

    // Check if it's a slot header (short, no digits, matches name)
    const slot = toSlot(line)
    if (slot) {
      currentSlot = slot
      if (!build[currentSlot]) build[currentSlot] = { affixes: [], greaterAffixes: [] }
      continue
    }

    if (!currentSlot) continue

    // Detect GA: if the original line (before stripping) had a leading ✦ char
    const hadGA = /^[\s]*✦/.test(rawLine)

    // Skip section-title-like lines that aren't affixes
    if (line.length < 3 || line.length > 120) continue
    // Skip pure number lines
    if (/^\d+$/.test(line)) continue
    // Must look like an affix: has a keyword or a number
    const isAffix = /\d|\b(damage|life|speed|chance|strike|skill|resource|stat|armor|shield|dodge|regen|multiplier|lucky|movement|attack|critical|willpower|strength|dexterity|intelligence|core|basic|ultimate|passive|ranks?|to all|all stats)\b/i.test(line)
    if (!isAffix) continue

    const data = build[currentSlot]!
    if (!data.affixes.includes(line)) {
      data.affixes.push(line)
      if (hadGA) data.greaterAffixes.push(line)
    }
  }

  return build
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let url: string | undefined
  let pastedText: string | undefined
  try {
    const body = await req.json()
    url = body.url as string | undefined
    pastedText = body.text as string | undefined
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // ── Paste-text mode ───────────────────────────────────────────
  if (pastedText?.trim()) {
    const build = parseGearStatsText(pastedText)
    const slotCount = Object.keys(build).length
    return NextResponse.json({
      build,
      slotCount,
      source: 'pasted text',
      note: slotCount === 0 ? 'No slots detected. Make sure to copy the "Gear Stats" section from d4builds.' : `Detected ${slotCount} slots from pasted text.`,
    })
  }

  if (!url?.startsWith('http')) {
    return NextResponse.json({ error: 'Provide a URL or paste build text.' }, { status: 400 })
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
    const urlLower = url.toLowerCase()

    // 1. Route by domain for best results
    let build: ParsedBuild | null = null
    if (urlLower.includes('mobalytics.gg')) {
      build = parseMobalytics(html)
    } else if (urlLower.includes('d4builds.gg')) {
      build = parseD4BuildsNextData(html)
      if (!build || Object.keys(build).length === 0) build = parseD4BuildsHTML(html)
    } else {
      // 2. Try generic alt-text aware parse first
      build = parseD4BuildsHTML(html)
    }

    // 3. Fall back to text-based parse
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
