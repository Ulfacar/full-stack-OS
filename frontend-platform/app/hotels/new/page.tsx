'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HotelWizard } from '@/components/hotel/HotelWizard'

export default function NewHotelPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  return <HotelWizard />
}
