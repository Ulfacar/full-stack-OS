'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import type { Hotel } from '@/lib/types'

interface BudgetInfo {
  hotel_id: number
  monthly_budget: number
  budget_used: number
  budget_remaining: number
  status: string
}

export default function AdminHotelPage() {
  const params = useParams()
  const router = useRouter()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [budget, setBudget] = useState<BudgetInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Channel config form
  const [telegramToken, setTelegramToken] = useState('')
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [wappiApiKey, setWappiApiKey] = useState('')
  const [wappiProfileId, setWappiProfileId] = useState('')
  const [budgetInput, setBudgetInput] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [hotelRes, budgetRes] = await Promise.all([
          api.get(`/hotels/${params.id}`),
          api.get(`/admin/hotels/${params.id}/budget`),
        ])
        setHotel(hotelRes.data)
        setBudget(budgetRes.data)
        setTelegramToken(hotelRes.data.telegram_bot_token || '')
        setWhatsappPhone(hotelRes.data.whatsapp_phone || '')
        setWappiApiKey(hotelRes.data.wappi_api_key || '')
        setWappiProfileId(hotelRes.data.wappi_profile_id || '')
        setBudgetInput(String(budgetRes.data.monthly_budget))
      } catch {
        router.push('/dashboard/hotels')
      } finally {
        setLoading(false)
      }
    }
    if (params.id) load()
  }, [params.id, router])

  const handleConfigureChannels = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await api.post(`/hotels/${params.id}/configure-channels`, {
        telegram_bot_token: telegramToken || undefined,
        whatsapp_phone: whatsappPhone || undefined,
        wappi_api_key: wappiApiKey || undefined,
        wappi_profile_id: wappiProfileId || undefined,
      })
      setHotel(res.data)
      setMessage('Каналы настроены!')
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Ошибка настройки')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateBudget = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await api.put(`/admin/hotels/${params.id}/budget`, {
        monthly_budget: parseFloat(budgetInput),
      })
      setBudget(res.data)
      setMessage('Бюджет обновлён!')
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  const handleChangeStatus = async (newStatus: string) => {
    setSaving(true)
    try {
      const res = await api.put(`/admin/hotels/${params.id}/budget`, {
        status: newStatus,
      })
      setBudget(res.data)
      if (hotel) setHotel({ ...hotel, status: newStatus as any })
    } catch {}
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-neutral-400">Загрузка...</div>
  if (!hotel || !budget) return null

  const budgetPercent = budget.monthly_budget > 0
    ? Math.min(100, (budget.budget_used / budget.monthly_budget) * 100)
    : 0
  const budgetColor = budgetPercent > 90 ? 'bg-red-500' : budgetPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{hotel.name}</h1>
          <p className="text-neutral-500 text-sm">/{hotel.slug}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={budget.status} />
          <Button variant="outline" size="sm" onClick={() => router.push(`/hotels/${hotel.id}/demo`)}>
            Демо
          </Button>
        </div>
      </div>

      {message && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Budget */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Бюджет</h2>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Потрачено: <strong>${budget.budget_used.toFixed(4)}</strong></span>
              <span>Лимит: <strong>${budget.monthly_budget}</strong>/мес</span>
            </div>
            <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
              <div className={`h-full ${budgetColor} rounded-full transition-all`} style={{ width: `${budgetPercent}%` }} />
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Осталось: ${budget.budget_remaining.toFixed(4)}
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label>Месячный лимит ($)</Label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
              />
            </div>
            <Button onClick={handleUpdateBudget} disabled={saving}>
              Обновить
            </Button>
          </div>
        </Card>

        {/* Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Статус</h2>
          <div className="flex gap-2">
            <Button
              variant={budget.status === 'demo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChangeStatus('demo')}
              disabled={saving}
            >
              Демо
            </Button>
            <Button
              variant={budget.status === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChangeStatus('active')}
              disabled={saving}
            >
              Активен
            </Button>
            <Button
              variant={budget.status === 'suspended' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChangeStatus('suspended')}
              disabled={saving}
            >
              Приостановлен
            </Button>
          </div>
        </Card>

        {/* Channels */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Каналы</h2>
          <div className="space-y-4">
            <div>
              <Label>Telegram Bot Token</Label>
              <Input
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                placeholder="123456:ABC-DEF..."
              />
              <p className="text-xs text-neutral-500 mt-1">
                Получить у @BotFather в Telegram
              </p>
            </div>
            <div>
              <Label>WhatsApp номер</Label>
              <Input
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+996700123456"
              />
            </div>
            <div>
              <Label>Wappi.pro API Key</Label>
              <Input
                value={wappiApiKey}
                onChange={(e) => setWappiApiKey(e.target.value)}
                placeholder="API key от wappi.pro"
              />
            </div>
            <div>
              <Label>Wappi.pro Profile ID</Label>
              <Input
                value={wappiProfileId}
                onChange={(e) => setWappiProfileId(e.target.value)}
                placeholder="Profile ID из wappi.pro"
              />
            </div>
            <Button onClick={handleConfigureChannels} disabled={saving}>
              {saving ? 'Сохранение...' : 'Подключить каналы'}
            </Button>
          </div>
        </Card>

        {/* Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Информация</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-500">AI модель:</span>
              <div className="font-medium">{hotel.ai_model}</div>
            </div>
            <div>
              <span className="text-neutral-500">Стиль:</span>
              <div className="font-medium">{hotel.communication_style}</div>
            </div>
            <div>
              <span className="text-neutral-500">Языки:</span>
              <div className="font-medium">{hotel.languages?.join(', ')}</div>
            </div>
            <div>
              <span className="text-neutral-500">Создан:</span>
              <div className="font-medium">{new Date(hotel.created_at).toLocaleDateString('ru')}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge variant="success">Активен</Badge>
    case 'demo':
      return <Badge variant="warning">Демо</Badge>
    case 'suspended':
      return <Badge variant="error">Приостановлен</Badge>
    default:
      return <Badge variant="default">{status}</Badge>
  }
}
