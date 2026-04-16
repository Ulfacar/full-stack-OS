'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { HotelFormData } from '@/lib/types'

interface BotPreviewProps {
  formData: Partial<HotelFormData>
  hotelId?: number
  fullscreen?: boolean
}

interface Message {
  role: 'user' | 'bot'
  content: string
}

const sampleQuestions = [
  'Сколько стоит номер?',
  'Какой адрес отеля?',
  'Какие услуги доступны?',
  'Время заезда?',
]

export function BotPreview({ formData, hotelId, fullscreen }: BotPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Здравствуйте! Чем могу помочь?' },
  ])
  const [input, setInput] = useState('')

  const generateBotResponse = (question: string): string => {
    const lowerQ = question.toLowerCase()

    // Цены
    if (lowerQ.includes('цен') || lowerQ.includes('стоим') || lowerQ.includes('price')) {
      if (formData.rooms && formData.rooms.length > 0) {
        const roomsList = formData.rooms
          .map((r) => `${r.name} (до ${r.capacity} гостей)`)
          .join(', ')
        return `Наши номера: ${roomsList}`
      }
      return 'Информация о ценах будет добавлена позже'
    }

    // Адрес
    if (lowerQ.includes('адрес') || lowerQ.includes('address') || lowerQ.includes('где')) {
      return formData.address || 'Адрес будет указан позже'
    }

    // Телефон
    if (lowerQ.includes('телефон') || lowerQ.includes('phone') || lowerQ.includes('контакт')) {
      return formData.phone || 'Телефон будет указан позже'
    }

    // Check-in/out
    if (lowerQ.includes('заезд') || lowerQ.includes('check-in') || lowerQ.includes('время')) {
      const checkin = formData.rules?.checkin || '14:00'
      const checkout = formData.rules?.checkout || '12:00'
      return `Заезд с ${checkin}, выезд до ${checkout}`
    }

    // Услуги
    if (lowerQ.includes('услуг') || lowerQ.includes('удобств') || lowerQ.includes('service')) {
      const amenities = formData.amenities
      if (amenities && Object.values(amenities).some((v) => v)) {
        const list = Object.entries(amenities)
          .filter(([_, v]) => v)
          .map(([key]) => {
            const names: Record<string, string> = {
              wifi: 'Wi-Fi',
              parking: 'Парковка',
              breakfast: 'Завтрак',
              pool: 'Бассейн',
              transfer: 'Трансфер',
              excursions: 'Экскурсии',
              conference: 'Конференц-зал',
            }
            return names[key] || key
          })
          .join(', ')
        return `Доступные услуги: ${list}`
      }
      return 'Информация об услугах будет добавлена'
    }

    // Название отеля
    if (lowerQ.includes('назва') || lowerQ.includes('name')) {
      return formData.name || 'Название отеля будет указано'
    }

    // Описание
    if (lowerQ.includes('расскаж') || lowerQ.includes('опис')) {
      return formData.description || 'Описание отеля будет добавлено позже'
    }

    // Дефолтный ответ
    const style = formData.communicationStyle || 'friendly'
    if (style === 'friendly') {
      return 'Извините, я пока не знаю ответа на этот вопрос. Спросите что-то ещё! 😊'
    } else if (style === 'formal') {
      return 'К сожалению, информация по этому вопросу пока недоступна.'
    } else {
      return 'Информация будет добавлена в ближайшее время.'
    }
  }

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    const botResponse: Message = {
      role: 'bot',
      content: generateBotResponse(input),
    }

    setMessages([...messages, userMessage, botResponse])
    setInput('')
  }

  const handleQuickQuestion = (question: string) => {
    const userMessage: Message = { role: 'user', content: question }
    const botResponse: Message = {
      role: 'bot',
      content: generateBotResponse(question),
    }

    setMessages([...messages, userMessage, botResponse])
  }

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      <div className="p-4 border-b border-[#262626] bg-[#141414]">
        <h3 className="font-medium text-[#FAFAFA] flex items-center gap-2">
          <span>📱</span> Предпросмотр бота
        </h3>
        <p className="text-xs text-[#A3A3A3] mt-1">
          Обновляется в реальном времени
        </p>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-[#1A1A1A] text-[#FAFAFA] border border-[#262626]'
                  : 'bg-[#3B82F6] text-white'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Quick questions */}
      <div className="px-4 py-2 border-t border-[#262626] bg-[#141414]">
        <div className="text-xs text-[#A3A3A3] mb-2">Быстрые вопросы:</div>
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleQuickQuestion(q)}
              className="text-xs px-3 py-1.5 rounded-full border border-[#262626] text-[#A3A3A3] hover:bg-[#1A1A1A] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#262626] bg-[#141414]">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Введите вопрос..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} size="sm">
            →
          </Button>
        </div>
      </div>
    </div>
  )
}
