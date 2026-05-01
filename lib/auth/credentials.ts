import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function registerUser(
  email: string,
  password: string,
  name?: string
) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new Error('Email already registered')
  }
  const passwordHash = await hashPassword(password)
  return prisma.user.create({
    data: { email, passwordHash, name: name ?? null },
    select: { id: true, email: true, name: true },
  })
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) return null

  return { id: user.id, email: user.email, name: user.name }
}
