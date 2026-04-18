'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, Phone, Mail, User as UserIcon, Calendar, FileCode } from 'lucide-react'
import { getLead } from '@/lib/salesApi'
import type { Lead } from '@/lib/types'

const STATUS_LABELS: Record<string, string> = { pending: 'Ожидает', configuring: 'Настройка', active: 'Активен', rejected: 'Отклонён' }
const STATUS_VARIANTS: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = { pending: 'warning', configuring: 'info', active: 'success', rejected: 'error' }

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const leadId = Number(params.id)
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!leadId) return
    const load = async () => {
      try {
        const data = await getLead(leadId)
        setLead(data)
      } catch (err: any) {
        setError(err?.response?.status === 404 ? 'Лид не найден или недоступен' : 'Не удалось загрузить')
      }
      setLoading(false)
    }
    load()
  }, [leadId])

  if (loading) return <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8"><div className="skeleton h-8 w-40 rounded-md mb-6" /><div className="skeleton h-64 rounded-xl" /></div>
  if (error || !lead) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">
        <Link href="/sales/leads" className="inline-flex items-center gap-2 text-sm text-[#737373] hover:text-[#FAFAFA] mb-6">
          <ArrowLeft size={14} /> Все лиды
        </Link>
        <Card className="text-center py-12"><p className="text-[#737373] text-sm">{error || 'Не найдено'}</p></Card>
      </div>
    )
  }

  const rooms = (lead.form_data?.rooms as any[] | undefined) || []

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8 space-y-6">
      <Link href="/sales/leads" className="inline-flex items-center gap-2 text-sm text-[#737373] hover:text-[#FAFAFA]">
        <ArrowLeft size={14} /> Все лиды
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA] mb-1">{lead.hotel_name}</h1>
          <p className="text-sm text-[#737373]">Лид #{lead.id} · {new Date(lead.created_at).toLocaleString('ru')}</p>
        </div>
        <Badge variant={STATUS_VARIANTS[lead.status] || 'default'}>{STATUS_LABELS[lead.status] || lead.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 space-y-3 lg:col-span-1 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="text-xs uppercase tracking-widest text-[#737373] font-semibold mb-2">Контакт</div>
          <Row icon={UserIcon} label="Имя" value={lead.contact_name || '—'} />
          <Row icon={Phone} label="Телефон" value={lead.contact_phone || '—'} />
          <Row icon={Mail} label="Email" value={lead.contact_email || '—'} />
          <Row icon={Building2} label="Адрес" value={(lead.form_data?.address as string) || '—'} />
          <Row icon={Calendar} label="Создан" value={new Date(lead.created_at).toLocaleDateString('ru')} />
        </Card>

        <Card className="p-5 lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-xs uppercase tracking-widest text-[#737373] font-semibold mb-3">Номера и цены</div>
          {rooms.length === 0 ? (
            <p className="text-sm text-[#737373]">Нет информации о номерах</p>
          ) : (
            <div className="space-y-2">
              {rooms.map((r: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-md bg-[#1A1A1A] border border-[#262626]">
                  <div>
                    <div className="text-sm text-[#FAFAFA] font-medium">{r.name || `Номер ${i + 1}`}</div>
                    <div className="text-xs text-[#737373]">{r.capacity ? `до ${r.capacity} чел` : ''}{r.description ? ` · ${r.description}` : ''}</div>
                  </div>
                  <div className="text-sm text-[#3B82F6] font-medium">{r.price ? `${r.price} сом` : '—'}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {lead.generated_prompt && (
        <Card className="p-5 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#737373] font-semibold mb-3">
            <FileCode size={12} /> Сгенерированный промпт
          </div>
          <pre className="text-xs text-[#A3A3A3] whitespace-pre-wrap font-mono max-h-96 overflow-auto p-3 rounded-md bg-[#0A0A0A] border border-[#262626]">{lead.generated_prompt}</pre>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.push('/sales/leads')}>Назад к списку</Button>
      </div>
    </div>
  )
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon size={14} className="text-[#737373]" />
      <span className="text-[#737373] w-20 text-xs">{label}</span>
      <span className="text-[#FAFAFA] truncate">{value}</span>
    </div>
  )
}
