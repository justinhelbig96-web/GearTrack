import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import LandingClient from './LandingClient'

export default async function Home() {
  const user = await getCurrentUser()
  if (user) redirect('/dashboard')
  return <LandingClient />
}
