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

  const [telegramToken, setTelegramToken] = useState('')
  const [stagingPrompt, setStagingPrompt] = useState('')
  const [promptSaving, setPromptSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<null | 'promote' | 'rollback'>(null)
  const [promptMsg, setPromptMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [wappiApiKey, setWappiApiKey] = useState('')
  const [wappiProfileId, setWappiProfileId] = useState('')
  const [waProvider, setWaProvider] = useState('none')
  const [metaAccessToken, setMetaAccessToken] = useState('')
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState('')
  const [metaBusinessId, setMetaBusinessId] = useState('')
  const [managerTgId, setManagerTgId] = useState('')
  const [managerName, setManagerName] = useState('')
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
        setTelegramToken('')
        setWhatsappPhone(hotelRes.data.whatsapp_phone || '')
        setWappiApiKey(hotelRes.data.wappi_api_key || '')
        setWappiProfileId(hotelRes.data.wappi_profile_id || '')
        setWaProvider(hotelRes.data.whatsapp_provider || 'none')
        setMetaAccessToken(hotelRes.data.meta_access_token || '')
        setMetaPhoneNumberId(hotelRes.data.meta_phone_number_id || '')
        setMetaBusinessId(hotelRes.data.meta_business_id || '')
        setManagerTgId(hotelRes.data.manager_telegram_id || '')
        setManagerName(hotelRes.data.manager_name || '')
        setBudgetInput(String(budgetRes.data.monthly_budget))
        setStagingPrompt(hotelRes.data.staging_prompt || '')
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
        whatsapp_provider: waProvider,
        wappi_api_key: wappiApiKey || undefined,
        wappi_profile_id: wappiProfileId || undefined,
        meta_access_token: metaAccessToken || undefined,
        meta_phone_number_id: metaPhoneNumberId || undefined,
        meta_business_id: metaBusinessId || undefined,
        manager_telegram_id: managerTgId || undefined,
        manager_name: managerName || undefined,
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

  const handleSaveStaging = async () => {
    setPromptSaving(true)
    setPromptMsg(null)
    try {
      const res = await api.put(`/hotels/${params.id}/staging`, { staging_prompt: stagingPrompt })
      if (hotel) setHotel({ ...hotel, staging_prompt: res.data.staging_prompt })
      setPromptMsg({ kind: 'ok', text: 'Staging-промпт сохранён.' })
    } catch (err: any) {
      setPromptMsg({ kind: 'err', text: err.response?.data?.detail || 'Не удалось сохранить.' })
    } finally {
      setPromptSaving(false)
    }
  }

  const handlePromote = async () => {
    setConfirmAction(null)
    setPromptSaving(true)
    setPromptMsg(null)
    try {
      // Persist current draft as staging first, then promote — covers the case
      // where the operator typed and clicked Promote without an explicit save.
      await api.put(`/hotels/${params.id}/staging`, { staging_prompt: stagingPrompt })
      const res = await api.post(`/hotels/${params.id}/promote`)
      if (hotel) {
        setHotel({ ...hotel, system_prompt: res.data.system_prompt, staging_prompt: null })
      }
      setStagingPrompt('')
      setPromptMsg({ kind: 'ok', text: 'Staging-промпт применён в production.' })
    } catch (err: any) {
      setPromptMsg({ kind: 'err', text: err.response?.data?.detail || 'Не удалось применить.' })
    } finally {
      setPromptSaving(false)
    }
  }

  const handleRollback = async () => {
    setConfirmAction(null)
    setPromptSaving(true)
    setPromptMsg(null)
    try {
      const res = await api.post(`/hotels/${params.id}/rollback`)
      if (hotel) setHotel({ ...hotel, system_prompt: res.data.system_prompt })
      setPromptMsg({
        kind: 'ok',
        text: `Откат выполнен. Восстановлена версия от ${new Date(res.data.rolled_back_from).toLocaleString('ru-RU')}.`,
      })
    } catch (err: any) {
      setPromptMsg({ kind: 'err', text: err.response?.data?.detail || 'Не удалось откатить (возможно, нет истории).' })
    } finally {
      setPromptSaving(false)
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

  if (loading) return <div className="p-8 text-[#737373]">Загрузка...</div>
  if (!hotel || !budget) return null

  const budgetPercent = budget.monthly_budget > 0
    ? Math.min(100, (budget.budget_used / budget.monthly_budget) * 100)
    : 0
  const budgetColor = budgetPercent > 90 ? 'bg-red-500' : budgetPercent > 70 ? 'bg-yellow-500' : 'bg-emerald-500'

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">{hotel.name}</h1>
          <p className="text-[#737373] text-sm">/{hotel.slug}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={budget.status} />
          <Button variant="outline" size="sm" onClick={() => router.push(`/hotels/${hotel.id}/demo`)}>
            Демо
          </Button>
        </div>
      </div>

      {message && (
        <div className="mb-4 bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#3B82F6] px-4 py-3 rounded-xl text-sm">
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Budget */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-[#FAFAFA]">Бюджет</h2>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#A3A3A3]">Потрачено: <strong className="text-[#FAFAFA]">${budget.budget_used.toFixed(4)}</strong></span>
              <span className="text-[#A3A3A3]">Лимит: <strong className="text-[#FAFAFA]">${budget.monthly_budget}</strong>/мес</span>
            </div>
            <div className="h-3 bg-[#1A1A1A] rounded-full overflow-hidden">
              <div className={`h-full ${budgetColor} rounded-full transition-all`} style={{ width: `${budgetPercent}%` }} />
            </div>
            <div className="text-xs text-[#737373] mt-1">
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
          <h2 className="text-lg font-semibold mb-4 text-[#FAFAFA]">Статус</h2>
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

        {/* Manager */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-[#FAFAFA]">Менеджер отеля</h2>
          <p className="text-sm text-[#737373] mb-4">
            Менеджер получает уведомления в Telegram когда бот передаёт диалог.
          </p>
          <div className="space-y-4">
            <div>
              <Label>Имя менеджера</Label>
              <Input
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Айгуль"
              />
            </div>
            <div>
              <Label>Telegram ID менеджера</Label>
              <Input
                value={managerTgId}
                onChange={(e) => setManagerTgId(e.target.value)}
                placeholder="123456789 (узнать через @userinfobot)"
              />
            </div>
          </div>
        </Card>

        {/* Channels */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-[#FAFAFA]">Каналы</h2>
          <div className="space-y-4">
            <div>
              <Label>Telegram Bot Token</Label>
              <Input
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                placeholder="123456:ABC-DEF..."
              />
              <p className="text-xs text-[#737373] mt-1">
                Получить у @BotFather в Telegram
              </p>
            </div>
            <div>
              <Label>WhatsApp провайдер</Label>
              <div className="flex gap-2 mt-1">
                <Button size="sm" variant={waProvider === 'none' ? 'default' : 'outline'} onClick={() => setWaProvider('none')}>Нет</Button>
                <Button size="sm" variant={waProvider === 'wappi' ? 'default' : 'outline'} onClick={() => setWaProvider('wappi')}>Wappi.pro</Button>
                <Button size="sm" variant={waProvider === 'meta' ? 'default' : 'outline'} onClick={() => setWaProvider('meta')}>Meta API</Button>
              </div>
            </div>

            {waProvider === 'wappi' && (
              <>
                <div>
                  <Label>WhatsApp номер</Label>
                  <Input value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)} placeholder="+996700123456" />
                </div>
                <div>
                  <Label>Wappi.pro API Key</Label>
                  <Input value={wappiApiKey} onChange={(e) => setWappiApiKey(e.target.value)} placeholder="API key от wappi.pro" />
                </div>
                <div>
                  <Label>Wappi.pro Profile ID</Label>
                  <Input value={wappiProfileId} onChange={(e) => setWappiProfileId(e.target.value)} placeholder="Profile ID из wappi.pro" />
                </div>
              </>
            )}

            {waProvider === 'meta' && (
              <>
                <div>
                  <Label>Meta Access Token</Label>
                  <Input value={metaAccessToken} onChange={(e) => setMetaAccessToken(e.target.value)} placeholder="Постоянный токен из Meta Business" />
                </div>
                <div>
                  <Label>Phone Number ID</Label>
                  <Input value={metaPhoneNumberId} onChange={(e) => setMetaPhoneNumberId(e.target.value)} placeholder="ID из WhatsApp Business API" />
                </div>
                <div>
                  <Label>Business ID</Label>
                  <Input value={metaBusinessId} onChange={(e) => setMetaBusinessId(e.target.value)} placeholder="Meta Business ID" />
                </div>
                <p className="text-xs text-[#737373]">
                  Webhook URL для Meta: <code className="bg-[#1A1A1A] px-1.5 py-0.5 rounded border border-[#262626]">{`https://exmachina.kg/webhooks/whatsapp/meta/${hotel?.slug}`}</code>
                </p>
              </>
            )}
            <Button onClick={handleConfigureChannels} disabled={saving}>
              {saving ? 'Сохранение...' : 'Подключить каналы'}
            </Button>
          </div>
        </Card>

        {/* Promote / Rollback (#28) */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-lg font-semibold text-[#FAFAFA]">Системный промпт</h2>
            <span className="text-[11px] px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              Production
            </span>
          </div>
          <p className="text-sm text-[#737373] mb-4">
            Текущая prod-версия — справа в зелёной рамке. Правьте staging ниже,
            тестируйте через preview-chat и применяйте.
          </p>

          {promptMsg && (
            <div
              className={`mb-3 px-3 py-2 rounded-md text-xs border ${
                promptMsg.kind === 'ok'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {promptMsg.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label>Production system_prompt (read-only)</Label>
              <textarea
                value={hotel.system_prompt || ''}
                readOnly
                rows={4}
                className="mt-1 w-full bg-[#0F0F0F] border border-emerald-500/30 rounded-md px-3 py-2 text-xs text-[#D4D4D4] resize-y opacity-90"
              />
            </div>

            <div>
              <Label>Staging-промпт (черновик)</Label>
              <textarea
                value={stagingPrompt}
                onChange={(e) => setStagingPrompt(e.target.value)}
                placeholder="Напишите новую версию промпта…"
                rows={6}
                disabled={promptSaving}
                className="mt-1 w-full bg-[#0F0F0F] border border-[#262626] rounded-md px-3 py-2 text-sm text-[#FAFAFA] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/60 resize-y disabled:opacity-50"
              />
              <p className="text-xs text-[#737373] mt-1">
                Превью можно гонять через preview-chat (не пишет клиенту, не тратит лимит).
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSaveStaging} disabled={promptSaving} variant="outline" size="sm">
                {promptSaving ? 'Сохранение…' : 'Сохранить staging'}
              </Button>
              <Button
                onClick={() => setConfirmAction('promote')}
                disabled={promptSaving || !stagingPrompt.trim()}
                size="sm"
              >
                Применить в production
              </Button>
              <Button
                onClick={() => setConfirmAction('rollback')}
                disabled={promptSaving}
                variant="outline"
                size="sm"
              >
                Откатить к предыдущему
              </Button>
            </div>
          </div>
        </Card>

        {confirmAction && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onClick={() => setConfirmAction(null)}
          >
            <div
              className="w-full max-w-md rounded-xl border border-[#262626] bg-[#141414] p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-[#FAFAFA] mb-2">
                {confirmAction === 'promote' ? 'Применить staging в production?' : 'Откатить промпт?'}
              </h2>
              <p className="text-sm text-[#A3A3A3] mb-5">
                {confirmAction === 'promote'
                  ? 'Это заменит production-промпт. Текущая prod-версия будет сохранена в истории — позже можно откатиться.'
                  : 'Будет восстановлена предыдущая prod-версия из истории. Текущий staging останется без изменений.'}
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>
                  Отмена
                </Button>
                <Button
                  size="sm"
                  onClick={confirmAction === 'promote' ? handlePromote : handleRollback}
                  disabled={promptSaving}
                >
                  {promptSaving ? 'Выполнение…' : 'Подтвердить'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-[#FAFAFA]">Информация</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#737373]">AI модель:</span>
              <div className="font-medium text-[#FAFAFA]">{hotel.ai_model}</div>
            </div>
            <div>
              <span className="text-[#737373]">Стиль:</span>
              <div className="font-medium text-[#FAFAFA]">{hotel.communication_style}</div>
            </div>
            <div>
              <span className="text-[#737373]">Языки:</span>
              <div className="font-medium text-[#FAFAFA]">{hotel.languages?.join(', ')}</div>
            </div>
            <div>
              <span className="text-[#737373]">Создан:</span>
              <div className="font-medium text-[#FAFAFA]">{new Date(hotel.created_at).toLocaleDateString('ru')}</div>
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
