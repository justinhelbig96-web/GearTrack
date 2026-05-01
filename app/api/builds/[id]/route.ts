import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const build = await prisma.build.findFirst({ where: { id, userId: user.id } })
  if (!build) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ build })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  await prisma.build.updateMany({
    where: { id, userId: user.id },
    data: {
      name:      body.name      ?? undefined,
      class:     body.class     ?? undefined,
      rawText:   body.rawText   ?? undefined,
      slots:     body.slots     ?? undefined,
      sourceUrl: body.sourceUrl ?? undefined,
    },
  })

  const build = await prisma.build.findUnique({ where: { id } })
  return NextResponse.json({ build })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.build.deleteMany({ where: { id, userId: user.id } })

  return NextResponse.json({ ok: true })
}
