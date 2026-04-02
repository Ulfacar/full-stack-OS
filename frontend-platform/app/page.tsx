'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Проверяем есть ли токен
    const token = localStorage.getItem('token')

    if (token) {
      // Если авторизован - на дашборд
      router.push('/dashboard')
    } else {
      // Если нет - на логин
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="animate-pulse text-neutral-400">Загрузка...</div>
    </div>
  )
}
