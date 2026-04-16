'use client'

import { useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import type { HotelFormData } from '@/lib/types'
import { generatePrompt } from '@/lib/promptGenerator'

interface Step4Props {
  formData: Partial<HotelFormData>
  updateFormData: (data: Partial<HotelFormData>) => void
}

const aiModels = [
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat',
    price: '$0.14/1M',
    recommended: true,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    price: '$5/1M',
    recommended: false,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    price: '$3/1M',
    recommended: false,
  },
]

const languages = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'ky', name: 'Кыргызча' },
]

export function Step4({ formData, updateFormData }: Step4Props) {
  const communicationStyle = formData.communicationStyle || 'friendly'
  const selectedLanguages = formData.languages || ['ru', 'en']
  const aiModel = formData.aiModel || 'deepseek/deepseek-chat'
  const systemPrompt = formData.systemPrompt || ''

  // Автоматически генерировать промпт при изменении данных
  useEffect(() => {
    const generatedPrompt = generatePrompt(formData as HotelFormData)
    updateFormData({ systemPrompt: generatedPrompt })
  }, [
    formData.name,
    formData.address,
    formData.phone,
    formData.rooms,
    formData.rules,
    formData.communicationStyle,
    formData.languages,
  ])

  const toggleLanguage = (code: string) => {
    if (selectedLanguages.includes(code)) {
      updateFormData({
        languages: selectedLanguages.filter((l) => l !== code),
      })
    } else {
      updateFormData({
        languages: [...selectedLanguages, code],
      })
    }
  }

  const estimateTokens = (text: string) => {
    // Примерная оценка: 1 токен ≈ 4 символа
    return Math.ceil(text.length / 4)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2 text-[#FAFAFA]">
          Настройка AI-ассистента
        </h2>
        <p className="text-[#A3A3A3] text-sm">
          Выберите стиль общения, модель AI и языки
        </p>
      </div>

      {/* Стиль общения */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[#FAFAFA]">Стиль общения</h3>
        <div className="space-y-2">
          <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-[#262626] cursor-pointer transition-colors hover:bg-[#1A1A1A] has-[:checked]:border-[#3B82F6] has-[:checked]:bg-[#1A1A1A]">
            <input
              type="radio"
              name="style"
              value="formal"
              checked={communicationStyle === 'formal'}
              onChange={() =>
                updateFormData({ communicationStyle: 'formal' })
              }
              className="mt-1"
            />
            <div>
              <div className="font-medium text-[#FAFAFA]">Формальный</div>
              <div className="text-sm text-[#A3A3A3]">
                Здравствуйте, рады приветствовать вас...
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-[#262626] cursor-pointer transition-colors hover:bg-[#1A1A1A] has-[:checked]:border-[#3B82F6] has-[:checked]:bg-[#1A1A1A]">
            <input
              type="radio"
              name="style"
              value="friendly"
              checked={communicationStyle === 'friendly'}
              onChange={() =>
                updateFormData({ communicationStyle: 'friendly' })
              }
              className="mt-1"
            />
            <div>
              <div className="font-medium text-[#FAFAFA]">Дружелюбный (рекомендуем)</div>
              <div className="text-sm text-[#A3A3A3]">
                Привет! Чем могу помочь? 😊
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-[#262626] cursor-pointer transition-colors hover:bg-[#1A1A1A] has-[:checked]:border-[#3B82F6] has-[:checked]:bg-[#1A1A1A]">
            <input
              type="radio"
              name="style"
              value="professional"
              checked={communicationStyle === 'professional'}
              onChange={() =>
                updateFormData({ communicationStyle: 'professional' })
              }
              className="mt-1"
            />
            <div>
              <div className="font-medium text-[#FAFAFA]">Профессиональный</div>
              <div className="text-sm text-[#A3A3A3]">
                Добрый день. Отвечу на ваши вопросы.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Языки */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[#FAFAFA]">Языки</h3>
        <div className="space-y-2">
          {languages.map((lang) => (
            <Checkbox
              key={lang.code}
              label={lang.name}
              checked={selectedLanguages.includes(lang.code)}
              onChange={() => toggleLanguage(lang.code)}
            />
          ))}
        </div>
        <p className="text-xs text-[#A3A3A3]">
          AI автоматически определит язык вопроса и ответит на нём
        </p>
      </div>

      {/* AI модель */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[#FAFAFA]">AI модель</h3>
        <div className="space-y-2">
          {aiModels.map((model) => (
            <label
              key={model.id}
              className="flex items-start gap-3 p-4 rounded-lg border-2 border-[#262626] cursor-pointer transition-colors hover:bg-[#1A1A1A] has-[:checked]:border-[#3B82F6] has-[:checked]:bg-[#1A1A1A]"
            >
              <input
                type="radio"
                name="aiModel"
                value={model.id}
                checked={aiModel === model.id}
                onChange={() => updateFormData({ aiModel: model.id })}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-[#FAFAFA]">{model.name}</div>
                  {model.recommended && (
                    <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">
                      рекомендуем
                    </span>
                  )}
                </div>
                <div className="text-sm text-[#A3A3A3]">{model.price}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Промпт */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-lg">
          <span className="text-xl">⚡</span>
          <div className="text-sm text-[#60A5FA]">
            Промпт генерируется автоматически на основе введённых данных!
          </div>
        </div>

        <div className="space-y-2">
          <Label>System Prompt:</Label>
          <Textarea
            rows={15}
            className="font-mono text-xs"
            value={systemPrompt}
            onChange={(e) => updateFormData({ systemPrompt: e.target.value })}
          />
          <div className="flex justify-between text-xs text-[#A3A3A3]">
            <span>
              💡 Промпт обновляется автоматически. Можете отредактировать
              вручную.
            </span>
            <span>~{estimateTokens(systemPrompt)} токенов</span>
          </div>
        </div>
      </div>
    </div>
  )
}
