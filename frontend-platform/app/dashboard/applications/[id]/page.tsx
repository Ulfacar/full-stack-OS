'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, User, Phone, Mail, Building2, FileText, CheckCircle2, Rocket } from 'lucide-react'
import api from '@/lib/api'
import Link from 'next/link'

interface Application {
  id: number; status: string; hotel_name: string; contact_name: string | null
  contact_phone: string | null; contact_email: string | null; form_data: any
  generated_prompt: string | null; hotel_id: number | null; created_at: string
}

const STATUS_MAP: Record<string, { variant: 'warning' | 'success' | 'info' | 'default'; label: string }> = {
  pending: { variant: 'warning', label: 'Ожидает' },
  active: { variant: 'success', label: 'Активен' },
  configuring: { variant: 'info', label: 'Настройка' },
  rejected: { variant: 'default', label: 'Отклонён' },
}

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [slug, setSlug] = useState('')
  const [tgToken, setTgToken] = useState('')
  const [waPhone, setWaPhone] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/applications/' + params.id)
        setApp(res.data)
        setSlug(res.data.hotel_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'))
      } catch {}
      setLoading(false)
    }
    load()
  }, [params.id])

  const activate = async () => {
    if (!slug) return
    setActivating(true)
    try {
      await api.post('/admin/applications/' + params.id + '/activate', {
        slug,
        telegram_bot_token: tgToken || null,
        whatsapp_phone: waPhone || null,
      })
      alert('Bot activated!')
      router.push('/dashboard')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Activation error')
    }
    setActivating(false)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8 space-y-4">
        <div className="skeleton h-6 w-32 rounded-lg" />
        <div className="skeleton h-10 w-64 rounded-lg" />
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    )
  }

  if (!app) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">
        <Card className="text-center py-16">
          <Building2 size={40} className="mx-auto text-[#262626] mb-4" strokeWidth={1} />
          <p className="text-[#737373] text-sm">Заявка не найдена</p>
        </Card>
      </div>
    )
  }

  const fd = app.form_data || {}
  const statusInfo = STATUS_MAP[app.status] || { variant: 'default' as const, label: app.status }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8 space-y-6">
      {/* Back link */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#FAFAFA] transition-colors">
        <ArrowLeft size={14} />
        Назад
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight mb-1 text-[#FAFAFA]">{app.hotel_name}</h1>
          <p className="text-sm text-[#737373] tracking-tight">
            Заявка #{app.id} от {new Date(app.created_at).toLocaleDateString('ru')}
          </p>
        </div>
        <Badge variant={statusInfo.variant}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            app.status === 'active' ? 'bg-emerald-500' : app.status === 'pending' ? 'bg-amber-500' : 'bg-[#737373]'
          }`} />
          {statusInfo.label}
        </Badge>
      </div>

      {/* Contacts */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-base font-semibold tracking-tight mb-4 text-[#FAFAFA]">Контакты</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#262626] flex items-center justify-center">
              <User size={14} className="text-[#737373]" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-xs text-[#737373]">Имя</div>
              <div className="font-medium tracking-tight text-[#FAFAFA]">{app.contact_name || '—'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#262626] flex items-center justify-center">
              <Phone size={14} className="text-[#737373]" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-xs text-[#737373]">Телефон</div>
              <div className="font-medium tracking-tight text-[#FAFAFA]">{app.contact_phone || '—'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#262626] flex items-center justify-center">
              <Mail size={14} className="text-[#737373]" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-xs text-[#737373]">Email</div>
              <div className="font-medium tracking-tight text-[#FAFAFA]">{app.contact_email || '—'}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Hotel data */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <h2 className="text-base font-semibold tracking-tight mb-4 text-[#FAFAFA]">Данные отеля</h2>
        <div className="space-y-3 text-sm">
          {fd.description && <p className="text-[#A3A3A3] leading-relaxed">{fd.description}</p>}
          {fd.address && <p className="text-[#737373]">Адрес: <span className="text-[#A3A3A3]">{fd.address}</span></p>}
          {fd.rooms?.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2 text-[#FAFAFA]">Номера:</div>
              <div className="space-y-1">
                {fd.rooms.map((r: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-[#A3A3A3]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#737373]" />
                    {r.name}: {r.capacity} чел., {r.price} сом
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Prompt */}
      {app.generated_prompt && (
        <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-[#737373]" strokeWidth={1.5} />
            <h2 className="text-base font-semibold tracking-tight text-[#FAFAFA]">Промпт</h2>
          </div>
          <pre className="text-xs bg-[#1A1A1A] rounded-xl p-4 overflow-auto max-h-60 whitespace-pre-wrap font-mono text-[#A3A3A3] border border-[#262626]">
            {app.generated_prompt}
          </pre>
        </Card>
      )}

      {/* Activation form */}
      {app.status === 'pending' && (
        <Card className="border-emerald-500/20 bg-emerald-500/5 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center gap-2 mb-5">
            <Rocket size={16} className="text-emerald-400" strokeWidth={1.5} />
            <h2 className="text-base font-semibold tracking-tight text-[#FAFAFA]">Активировать бота</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="ton-azure" />
              <p className="text-xs text-[#737373]">Webhook: /webhooks/telegram/{slug}</p>
            </div>
            <div className="space-y-2">
              <Label>Telegram Bot Token</Label>
              <Input className="font-mono" value={tgToken} onChange={e => setTgToken(e.target.value)} placeholder="123456:ABC-DEF..." />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={waPhone} onChange={e => setWaPhone(e.target.value)} placeholder="+996..." />
            </div>
            <Button onClick={activate} disabled={activating || !slug} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {activating ? 'Активация...' : 'Активировать бота'}
            </Button>
          </div>
        </Card>
      )}

      {/* Activated state */}
      {app.status === 'active' && (
        <Card className="text-center py-10 border-emerald-500/20 bg-emerald-500/5 animate-scale-in">
          <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-3" strokeWidth={1.5} />
          <div className="font-semibold tracking-tight text-[#FAFAFA]">Бот активирован</div>
          <div className="text-sm text-[#737373]">Hotel ID: {app.hotel_id}</div>
        </Card>
      )}
    </div>
  )
}
