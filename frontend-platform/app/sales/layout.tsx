'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) router.push('/login')
  }, [router])

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      <Sidebar />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
