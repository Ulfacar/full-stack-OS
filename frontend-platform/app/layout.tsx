import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Providers } from '@/lib/providers'

const dmSans = DM_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-body' })
const playfair = Playfair_Display({ subsets: ['latin', 'cyrillic'], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'Ex-Machina | AI-боты для отелей',
  description: 'SaaS-платформа для создания умных ассистентов для отелей. Демо-бот за 5 минут.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className="scroll-smooth">
      <body className={`${dmSans.variable} ${playfair.variable} font-sans`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
