import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateUser } from '@/lib/auth/credentials'
import { createSessionToken, setSessionCookie } from '@/lib/auth/session'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = LoginSchema.parse(body)

    const user = await authenticateUser(data.email, data.password)
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await createSessionToken(user.id)
    await setSessionCookie(token)

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
