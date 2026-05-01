import { NextResponse } from 'next/server'
import { z } from 'zod'
import { registerUser } from '@/lib/auth/credentials'
import { createSessionToken, setSessionCookie } from '@/lib/auth/session'

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = RegisterSchema.parse(body)

    const user = await registerUser(data.email, data.password, data.name)
    const token = await createSessionToken(user.id)
    await setSessionCookie(token)

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
