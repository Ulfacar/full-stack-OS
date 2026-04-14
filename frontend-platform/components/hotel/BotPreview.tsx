'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import api from '@/lib/api'
import type { HotelFormData } from '@/lib/types'

interface BotPreviewProps {
  formData: Partial<HotelFormData>
  hotelId?: number // If set, bot is already created
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
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const sendMessage = async (question: string) => {
    if (!question.trim() || isTyping) return

    const userMsg: Message = { role: 'user', content: question }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      // Build history for API
      const history = messages
        .filter((m) => m.role !== 'bot' || messages.indexOf(m) > 0)
        .map((m) => ({
          role: m.role === 'bot' ? 'assistant' : 'user',
          content: m.content,
        }))

      // Build hotel_data from formData
      const hotelData = {
        name: formData.name || '',
        description: formData.description || '',
        address: formData.address || '',
        phone: formData.phone || '',
        email: formData.email || '',
        website: formData.website || '',
        rooms: formData.rooms || [],
        rules: formData.rules || {},
        amenities: formData.amenities || {},
        communication_style: formData.communicationStyle || 'friendly',
        ai_model: formData.aiModel || 'anthropic/claude-3.5-haiku',
      }

      const response = await api.post('/preview-chat', {
        message: question,
        hotel_data: hotelData,
        history,
      })

      const botMsg: Message = {
        role: 'bot',
        content: response.data.reply,
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      const errorMsg: Message = {
        role: 'bot',
        content: 'Ошибка подключения к AI. Попробуйте ещё раз.',
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSend = () => sendMessage(input)
  const handleQuickQuestion = (q: string) => sendMessage(q)

  return (
    <div className={`h-full flex flex-col bg-neutral-50 ${fullscreen ? 'max-w-lg mx-auto' : ''}`}>
      <div className="p-4 border-b border-neutral-200 bg-white">
        <h3 className="font-medium text-neutral-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {formData.name || 'AI-ассистент отеля'}
        </h3>
        <p className="text-xs text-neutral-500 mt-1">
          {fullscreen ? 'Демо-режим — попробуйте задать вопрос' : 'Предпросмотр бота (реальный AI)'}
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
                  ? 'bg-white text-neutral-900 border border-neutral-200'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-blue-500 text-white px-4 py-2.5 rounded-2xl text-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-neutral-200 bg-white">
          <div className="text-xs text-neutral-500 mb-2">Быстрые вопросы:</div>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleQuickQuestion(q)}
                disabled={isTyping}
                className="text-xs px-3 py-1.5 rounded-full border border-neutral-200 hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-neutral-200 bg-white">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Введите вопрос..."
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
          />
          <Button onClick={handleSend} size="sm" disabled={isTyping || !input.trim()}>
            →
          </Button>
        </div>
      </div>
    </div>
  )
}
