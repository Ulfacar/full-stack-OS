'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Zap } from 'lucide-react'
import api from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', response.data.access_token)
      const me = await api.get('/auth/me').catch(() => null)
      router.push(me?.data?.role === 'sales' ? '/sales' : '/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа')
    } finally { setLoading(false) }
  }

  const handleQuickLogin = async () => {
    setEmail('demo@asystem.com')
    setPassword('demo123')
    setError('')
    setLoading(true)
    try {
      const response = await api.post('/auth/login', { email: 'demo@asystem.com', password: 'demo123' })
      localStorage.setItem('token', response.data.access_token)
      const me = await api.get('/auth/me').catch(() => null)
      router.push(me?.data?.role === 'sales' ? '/sales' : '/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-[#3B82F6]/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
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
            <CardTitle>Вход</CardTitle>
            <CardDescription>Введите email и пароль</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2.5 rounded-md text-sm animate-scale-in">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Вход...' : 'Войти'}
              </Button>

              <Button type="button" variant="outline" className="w-full" onClick={handleQuickLogin} disabled={loading}>
                <Zap size={14} /> Быстрый вход (demo)
              </Button>

              <div className="text-center text-sm text-[#737373]">
                Нет аккаунта?{' '}
                <Link href="/register" className="text-[#3B82F6] font-medium hover:underline">Регистрация</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
