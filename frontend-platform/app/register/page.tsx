'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import api from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!agreed) { setError('Необходимо согласиться с условиями'); return }
    setLoading(true)
    try {
      const payloadName = inviteCode.trim() ? `${name.trim()}|${inviteCode.trim()}` : name.trim()
      await api.post('/auth/register', { name: payloadName, email, password })
      const loginResponse = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', loginResponse.data.access_token)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-[#3B82F6]/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 text-lg font-medium tracking-tighter mb-2 text-[#FAFAFA]">
            <div className="w-8 h-8 bg-[#FAFAFA] rounded-lg flex items-center justify-center text-[#0A0A0A] text-xs font-semibold tracking-tighter">
              EM
            </div>
            Ex<span className="text-[#3B82F6]">-Machina</span>
          </div>
          <p className="text-[#737373] text-sm">AI-боты для отелей</p>
        </div>

        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>Создайте аккаунт</CardTitle>
            <CardDescription>Начните автоматизацию за 5 минут</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2.5 rounded-md text-sm animate-scale-in">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input id="name" type="text" placeholder="Ваше имя" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                <p className="text-xs text-[#737373]">Минимум 6 символов</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite code</Label>
                <Input id="inviteCode" type="text" placeholder="XXXXXXXXXXXXXXXX" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
                <p className="text-xs text-[#737373]">Выдаётся администратором. Оставьте пустым только для первой регистрации.</p>
              </div>
              <Checkbox label="Согласен с условиями использования" checked={agreed} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgreed(e.target.checked)} />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Создание...' : 'Зарегистрироваться'}
              </Button>
              <div className="text-center text-sm text-[#737373]">
                Уже есть аккаунт?{' '}
                <Link href="/login" className="text-[#3B82F6] font-medium hover:underline">Войти</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
