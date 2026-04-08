'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Application { id: number; status: string; hotel_name: string; contact_name: string | null; contact_phone: string | null; created_at: string }
interface Hotel { id: number; name: string; slug: string; is_active: boolean; telegram_bot_token: string | null; created_at: string }

const STATUS_LABELS: Record<string, string> = { pending: 'Ожидает', configuring: 'Настройка', active: 'Активен', rejected: 'Отклонён' }
const STATUS_COLORS: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', configuring: 'bg-blue-100 text-blue-700', active: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [appsRes, hotelsRes] = await Promise.all([
          api.get('/admin/applications'),
          api.get('/hotels'),
        ])
        setApplications(appsRes.data)
        setHotels(hotelsRes.data)
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-8 text-neutral-400">Загрузка...</div>

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold mb-1">Dashboard</h1><p className="text-neutral-500 text-sm">Управление ботами отелей</p></div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-2xl font-bold">{applications.filter(a => a.status === 'pending').length}</div><div className="text-sm text-neutral-500">Новых заявок</div></div>
        <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-2xl font-bold">{hotels.filter(h => h.is_active).length}</div><div className="text-sm text-neutral-500">Активных ботов</div></div>
        <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-2xl font-bold">{hotels.length}</div><div className="text-sm text-neutral-500">Всего отелей</div></div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Заявки</h2>
        {applications.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-neutral-400 shadow-sm">Пока нет заявок.</div>
        ) : (
          <div className="space-y-2">
            {applications.map(app => (
              <a key={app.id} href={`/dashboard/applications/${app.id}`} className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{app.hotel_name}</div>
                    <div className="text-sm text-neutral-500">{app.contact_name} &middot; {app.contact_phone} &middot; {new Date(app.created_at).toLocaleDateString('ru')}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[app.status] || 'bg-neutral-100'}`}>{STATUS_LABELS[app.status] || app.status}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Активные отели</h2>
        {hotels.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-neutral-400 shadow-sm">Нет активных отелей.</div>
        ) : (
          <div className="space-y-2">
            {hotels.map(hotel => (
              <div key={hotel.id} className="bg-white rounded-xl p-4 shadow-sm flex justify-between items-center">
                <div><div className="font-medium">{hotel.name}</div><div className="text-sm text-neutral-500">/{hotel.slug} &middot; {hotel.telegram_bot_token ? 'TG connected' : 'TG not set'}</div></div>
                <div className={`w-3 h-3 rounded-full ${hotel.is_active ? 'bg-green-500' : 'bg-neutral-300'}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
