import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db/prisma'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'geargap-dev-secret-change-in-production'
)

const COOKIE_NAME = 'geargap_session'
const EXPIRY_HOURS = 24 * 7 // 7 days

// ─── Token creation ──────────────────────────────────────────────────────────

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRY_HOURS}h`)
    .sign(SECRET)
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload.sub ?? null
  } catch {
    return null
  }
}

// ─── Cookie helpers ──────────────────────────────────────────────────────────

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: EXPIRY_HOURS * 60 * 60,
    path: '/',
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}

// ─── Session resolution ──────────────────────────────────────────────────────

export async function getCurrentUser() {
  const token = await getSessionToken()
  if (!token) return null

  const userId = await verifySessionToken(token)
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  })

  return user
}

export type AuthUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
