import type { Metadata } from 'next'
import { Cinzel_Decorative } from 'next/font/google'
import './globals.css'

const cinzel = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-cinzel',
})

export const metadata: Metadata = {
  title: 'GearGap — Diablo 4 Gear Companion',
  description: 'Upload screenshots, parse your gear, compare to your target build.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${cinzel.variable} bg-d4-bg text-d4-text antialiased`}>
        {children}
      </body>
    </html>
  )
}
