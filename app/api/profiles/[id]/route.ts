import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import type { GearSlot } from '@/lib/types'

const SLOT_FIELD_MAP: Record<GearSlot, string> = {
  HELMET:    'helmetId',
  CHEST:     'chestId',
  GLOVES:    'glovesId',
  PANTS:     'pantsId',
  BOOTS:     'bootsId',
  AMULET:    'amuletId',
  RING1:     'ring1Id',
  RING2:     'ring2Id',
  MAIN_HAND: 'mainHandId',
  OFF_HAND:  'offHandId',
}

// GET /api/profiles/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const profile = await prisma.gearProfile.findFirst({
    where: { id, userId: user.id },
    include: {
      helmet: true, chest: true, gloves: true, pants: true, boots: true,
      amulet: true, ring1: true, ring2: true, mainHand: true, offHand: true,
    },
  })

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ profile })
}

// PATCH /api/profiles/[id]  — assign an item to a slot
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { slot, itemId }: { slot: GearSlot; itemId: string | null } = body

  if (!slot) return NextResponse.json({ error: 'slot is required' }, { status: 400 })

  const profile = await prisma.gearProfile.findFirst({ where: { id, userId: user.id } })
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const slotField = SLOT_FIELD_MAP[slot]
  const updatedProfile = await prisma.gearProfile.update({
    where: { id },
    data: { [slotField]: itemId },
    include: {
      helmet: true, chest: true, gloves: true, pants: true, boots: true,
      amulet: true, ring1: true, ring2: true, mainHand: true, offHand: true,
    },
  })

  return NextResponse.json({ profile: updatedProfile })
}

// DELETE /api/profiles/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await prisma.gearProfile.deleteMany({ where: { id, userId: user.id } })
  return NextResponse.json({ ok: true })
}
