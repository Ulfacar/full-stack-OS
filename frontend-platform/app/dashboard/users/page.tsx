'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'

interface UserItem {
  id: number
  name: string
  email: string
  role: string
  is_active: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')

  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users/')
      setUsers(res.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreateSales = async () => {
    if (!newName || !newEmail || !newPassword) {
      setMessage('Заполните все поля')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      await api.post('/admin/users/create-sales', {
        name: newName,
        email: newEmail,
        password: newPassword,
      })
      setMessage('Продажник создан!')
      setNewName('')
      setNewEmail('')
      setNewPassword('')
      setShowForm(false)
      loadUsers()
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-[#737373]">Загрузка...</div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">Пользователи</h1>
          <p className="text-[#737373] text-sm">Управление аккаунтами</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отмена' : '+ Продажник'}
        </Button>
      </div>

      {message && (
        <div className="mb-4 bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#3B82F6] px-4 py-3 rounded-xl text-sm">
          {message}
        </div>
      )}

      {showForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-[#FAFAFA]">Новый продажник</h2>
          <div className="space-y-4">
            <div>
              <Label>Имя</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Айгуль" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="sales@exmachina.kg" />
            </div>
            <div>
              <Label>Пароль</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Минимум 6 символов" />
            </div>
            <Button onClick={handleCreateSales} disabled={saving}>
              {saving ? 'Создание...' : 'Создать аккаунт'}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#FAFAFA]">{user.name}</div>
                <div className="text-sm text-[#737373]">{user.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={user.role === 'admin' ? 'success' : 'warning'}>
                  {user.role === 'admin' ? 'Админ' : 'Продажник'}
                </Badge>
              </div>
            </div>
          </Card>
        ))}

        {users.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-[#737373]">Нет пользователей</p>
          </Card>
        )}
      </div>
    </div>
  )
}
