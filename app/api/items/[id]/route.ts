import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import type { Affix, ItemAspect, ItemRarity, GearSlot } from '@/lib/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const item = await prisma.item.findFirst({ where: { id, userId: user.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ item })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const allowedFields = [
    'itemName', 'itemPower', 'rarity', 'affixes', 'greaterAffixes',
    'aspect', 'temperingAffixes', 'masterworkLevel', 'gem', 'rune',
    'parseStatus', 'slot',
  ] as const

  const updateData: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if ((body as Record<string, unknown>)[field] !== undefined) {
      updateData[field] = (body as Record<string, unknown>)[field]
    }
  }

  const item = await prisma.item.updateMany({
    where: { id, userId: user.id },
    data: updateData,
  })

  if (item.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.item.findUnique({ where: { id } })
  return NextResponse.json({ item: updated })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.item.deleteMany({ where: { id, userId: user.id } })

  return NextResponse.json({ ok: true })
}
