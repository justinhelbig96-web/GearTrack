import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createOcrService } from '@/lib/ocr/ocrService'
import { parseD4ItemTooltip } from '@/lib/parser/d4parser'
import { prisma } from '@/lib/db/prisma'
import type { GearSlot } from '@/lib/types'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE     = 10 * 1024 * 1024 // 10MB

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file  = formData.get('file') as File | null
  const slot  = formData.get('slot') as GearSlot | null
  const itemId = formData.get('itemId') as string | null  // optional existing item to update

  if (!file || !slot) {
    return NextResponse.json({ error: 'file and slot are required' }, { status: 400 })
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported image format' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  // Read image as base64
  const buffer     = await file.arrayBuffer()
  const base64     = Buffer.from(buffer).toString('base64')
  const mimeType   = file.type

  // Optionally store the image URL (we store data-URI for simplicity; swap for Blob storage in prod)
  const imageUrl = `data:${mimeType};base64,${base64}`

  // Run OCR
  const ocrService = createOcrService()
  const { text: rawText, confidence } = await ocrService.extractText(base64, mimeType)

  // Parse item
  const parsed = parseD4ItemTooltip(rawText)
  parsed.slot = slot  // override slot from URL context

  // Upsert item in DB
  const itemData = {
    userId:          user.id,
    slot,
    imageUrl,
    ocrRawText:      rawText,
    ocrConfidence:   confidence,
    parseStatus:     'parsed',
    itemName:        parsed.itemName ?? null,
    itemPower:       parsed.itemPower ?? null,
    rarity:          parsed.rarity ?? null,
    affixes:         parsed.affixes as object,
    greaterAffixes:  parsed.greaterAffixes as object,
    aspect:          parsed.aspect ? (parsed.aspect as object) : undefined,
    temperingAffixes: parsed.temperingAffixes as object,
    masterworkLevel: parsed.masterworkLevel,
    gem:             parsed.gem ?? null,
    rune:            parsed.rune ?? null,
  }

  let item
  if (itemId) {
    item = await prisma.item.update({
      where: { id: itemId },
      data: itemData,
    })
  } else {
    item = await prisma.item.create({ data: itemData })
  }

  return NextResponse.json({ item, parsed, rawText, confidence })
}
