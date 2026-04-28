'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import api from '@/lib/api'

interface HotelPublicPreview {
  name: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  rooms: Array<{ name: string; capacity?: number; price?: number; description?: string }>
  amenities: Record<string, unknown>
  rules: Record<string, unknown>
  languages: string[]
  communication_style: string
}

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'Wi-Fi',
  parking: 'Парковка',
  breakfast: 'Завтрак',
  pool: 'Бассейн',
  restaurant: 'Ресторан',
  conference: 'Конференц-зал',
  sauna: 'Сауна',
  playground: 'Детская площадка',
  beach: 'Пляж',
  transfer: 'Трансфер',
  excursions: 'Экскурсии',
}

export default function SharePage() {
  const params = useParams()
  const token = params?.token as string

  const [hotel, setHotel] = useState<HotelPublicPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    const load = async () => {
      try {
        // Bypass the JWT interceptor — share is intentionally public
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/share/${token}`,
        )
        if (cancelled) return
        if (res.status === 410) {
          setError('Ссылка истекла. Попросите владельца отеля сгенерировать новую.')
        } else if (res.status === 404) {
          setError('Ссылка не найдена или была удалена.')
        } else if (!res.ok) {
          setError('Не удалось загрузить превью отеля. Попробуйте позже.')
        } else {
          setHotel(await res.json())
        }
      } catch {
        if (!cancelled) setError('Сеть недоступна. Попробуйте позже.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [token])

  const amenitiesList = hotel
    ? Object.entries(hotel.amenities)
        .filter(([k, v]) => v && AMENITY_LABELS[k])
        .map(([k]) => AMENITY_LABELS[k])
    : []

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <span className="text-sm text-zinc-500">Ex-Machina · превью отеля</span>
          <Link href="/" className="text-sm text-[#3B82F6] hover:underline">
            На главную →
          </Link>
        </div>

        {loading && <div className="text-zinc-500">Загрузка…</div>}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
            {error}
          </div>
        )}

        {hotel && (
          <>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
              {hotel.name}
            </h1>
            {hotel.address && (
              <p className="text-[#A3A3A3] mb-1">{hotel.address}</p>
            )}
            {hotel.description && (
              <p className="text-[#D4D4D4] mb-6 max-w-2xl">{hotel.description}</p>
            )}

            <div className="flex flex-wrap gap-3 mb-8 text-sm text-[#A3A3A3]">
              {hotel.phone && <span>📞 {hotel.phone}</span>}
              {hotel.email && <span>✉️ {hotel.email}</span>}
              {hotel.website && (
                <a
                  href={hotel.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3B82F6] hover:underline"
                >
                  🌐 {hotel.website}
                </a>
              )}
            </div>

            {hotel.rooms.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Номера</h2>
                <div className="space-y-2">
                  {hotel.rooms.map((r, i) => (
                    <div
                      key={`${r.name}-${i}`}
                      className="rounded-lg border border-[#262626] bg-[#0F0F0F] px-4 py-3 text-sm"
                    >
                      <div className="font-medium text-[#FAFAFA]">
                        {r.name}
                        {r.capacity ? ` · до ${r.capacity} гостей` : ''}
                      </div>
                      {(r.price || r.description) && (
                        <div className="text-xs text-[#A3A3A3] mt-1">
                          {r.price ? `${r.price} сом/ночь` : ''}
                          {r.price && r.description ? ' · ' : ''}
                          {r.description || ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {amenitiesList.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Удобства</h2>
                <div className="flex flex-wrap gap-2">
                  {amenitiesList.map((a) => (
                    <span
                      key={a}
                      className="text-xs px-2.5 py-1 rounded-full border border-[#262626] bg-[#141414] text-[#D4D4D4]"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-8 text-sm text-[#A3A3A3]">
              <span>Языки бота: {hotel.languages.join(', ')}</span>
            </section>

            <div className="rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/5 p-6 mt-12">
              <h3 className="text-lg font-semibold mb-2">Это превью для партнёра</h3>
              <p className="text-sm text-[#A3A3A3] mb-4">
                Владелец «{hotel.name}» делится с вами концепцией перед запуском
                AI-ассистента Ex-Machina. Если хотите узнать больше — посмотрите как
                работает наш бот.
              </p>
              <Link
                href="/"
                className="text-sm bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2 rounded-md inline-block"
              >
                Что такое Ex-Machina →
              </Link>
            </div>

            <p className="text-[11px] text-zinc-600 mt-8">
              Ссылка действительна 7 дней. Реквизиты, токены и контакты менеджеров
              в превью не показываются.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
