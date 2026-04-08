'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
interface Application { id: number; status: string; hotel_name: string; contact_name: string | null; contact_phone: string | null; contact_email: string | null; form_data: any; generated_prompt: string | null; hotel_id: number | null; created_at: string }
export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [slug, setSlug] = useState('')
  const [tgToken, setTgToken] = useState('')
  const [waPhone, setWaPhone] = useState('')
  useEffect(() => { const load = async () => { try { const res = await api.get('/admin/applications/' + params.id); setApp(res.data); setSlug(res.data.hotel_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')) } catch {} setLoading(false) }; load() }, [params.id])
  const activate = async () => {
    if (!slug) return; setActivating(true)
    try { await api.post('/admin/applications/' + params.id + '/activate', { slug, telegram_bot_token: tgToken || null, whatsapp_phone: waPhone || null }); alert('Bot activated!'); router.push('/dashboard') }
    catch (err: any) { alert(err.response?.data?.detail || 'Activation error') }
    setActivating(false)
  }
  if (loading) return <div className="p-8 text-neutral-400">Loading...</div>
  if (!app) return <div className="p-8 text-red-500">Application not found</div>
  const fd = app.form_data || {}
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold">{app.hotel_name}</h1><p className="text-sm text-neutral-500">Заявка #{app.id} от {new Date(app.created_at).toLocaleDateString('ru')}</p></div><span className={`text-sm px-3 py-1 rounded-full ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : app.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-neutral-100'}`}>{app.status}</span></div>
      <div className="bg-white rounded-xl p-6 shadow-sm"><h2 className="font-semibold mb-3">Контакты</h2><div className="grid grid-cols-3 gap-4 text-sm"><div><span className="text-neutral-500">Имя:</span> {app.contact_name || '-'}</div><div><span className="text-neutral-500">Тел:</span> {app.contact_phone || '-'}</div><div><span className="text-neutral-500">Email:</span> {app.contact_email || '-'}</div></div></div>
      <div className="bg-white rounded-xl p-6 shadow-sm"><h2 className="font-semibold mb-3">Данные отеля</h2>{fd.description && <p className="text-sm mb-3">{fd.description}</p>}{fd.address && <p className="text-sm text-neutral-500 mb-3">Адрес: {fd.address}</p>}{fd.rooms?.length > 0 && <div className="mb-3"><div className="text-sm font-medium mb-1">Номера:</div>{fd.rooms.map((r: any, i: number) => <div key={i} className="text-sm text-neutral-600">- {r.name}: {r.capacity} чел., {r.price} сом</div>)}</div>}</div>
      {app.generated_prompt && <div className="bg-white rounded-xl p-6 shadow-sm"><h2 className="font-semibold mb-3">Промпт</h2><pre className="text-xs bg-neutral-50 rounded-lg p-4 overflow-auto max-h-60 whitespace-pre-wrap">{app.generated_prompt}</pre></div>}
      {app.status === 'pending' && (<div className="bg-white rounded-xl p-6 shadow-sm border-2 border-blue-100"><h2 className="font-semibold mb-4">Активировать бота</h2><div className="space-y-3"><div><label className="block text-sm font-medium mb-1">Slug *</label><input className="w-full border rounded-lg px-4 py-2 text-sm" value={slug} onChange={e => setSlug(e.target.value)} placeholder="ton-azure" /><div className="text-xs text-neutral-400 mt-1">Webhook: /webhooks/telegram/{slug}</div></div><div><label className="block text-sm font-medium mb-1">Telegram Bot Token</label><input className="w-full border rounded-lg px-4 py-2 text-sm font-mono" value={tgToken} onChange={e => setTgToken(e.target.value)} placeholder="123456:ABC-DEF..." /></div><div><label className="block text-sm font-medium mb-1">WhatsApp</label><input className="w-full border rounded-lg px-4 py-2 text-sm" value={waPhone} onChange={e => setWaPhone(e.target.value)} placeholder="+996..." /></div><button onClick={activate} disabled={activating || !slug} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">{activating ? 'Активация...' : 'Активировать бота'}</button></div></div>)}
      {app.status === 'active' && <div className="bg-green-50 rounded-xl p-6 text-center"><div className="text-2xl mb-2">&#9989;</div><div className="font-medium">Бот активирован</div><div className="text-sm text-neutral-500">Hotel ID: {app.hotel_id}</div></div>}
    </div>
  )
}
