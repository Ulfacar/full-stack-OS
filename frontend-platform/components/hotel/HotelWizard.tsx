'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BotPreview } from './BotPreview'
import { Step1 } from './steps/Step1'
import { Step2 } from './steps/Step2'
import { Step3 } from './steps/Step3'
import api from '@/lib/api'
import { generatePrompt } from '@/lib/promptGenerator'
import type { HotelFormData } from '@/lib/types'

const TOTAL_STEPS = 3

export function HotelWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<Partial<HotelFormData>>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    rooms: [],
    rules: {
      checkin: '14:00',
      checkout: '12:00',
      cancellation: '',
      paymentCards: false,
      paymentQR: false,
      paymentCash: false,
      pets: '',
      smoking: '',
    },
    amenities: {
      wifi: false,
      parking: false,
      breakfast: false,
      pool: false,
      transfer: false,
      excursions: false,
      conference: false,
      other: '',
    },
    communicationStyle: 'friendly',
    languages: ['ru', 'en'],
    aiModel: 'anthropic/claude-3.5-haiku',
    systemPrompt: '',
  })

  const updateFormData = (data: Partial<HotelFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.phone) {
        setError('Заполните обязательные поля: Название и Телефон')
        return
      }
    }

    setError('')
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    setError('')
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      // Auto-generate system prompt from form data
      const systemPrompt = generatePrompt(formData as HotelFormData)

      const payload = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        description: formData.description,
        rooms: formData.rooms,
        rules: formData.rules,
        amenities: formData.amenities,
        ai_model: formData.aiModel || 'anthropic/claude-3.5-haiku',
        system_prompt: systemPrompt,
        communication_style: formData.communicationStyle || 'friendly',
        languages: formData.languages || ['ru', 'en'],
        // No telegram_bot_token — channels configured later by admin
      }

      const response = await api.post('/hotels', payload)
      const hotelId = response.data.id

      // Redirect to demo page — the wow moment
      router.push(`/hotels/${hotelId}/demo`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка создания бота')
    } finally {
      setLoading(false)
    }
  }

  const progress = (currentStep / TOTAL_STEPS) * 100

  const stepTitles = ['Об отеле', 'Номера и цены', 'Правила и услуги']

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Progress Bar */}
      <div className="bg-white border-b border-neutral-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-lg font-semibold tracking-tight">
              Ex-Machina — Создание AI-бота
            </h1>
            <div className="text-sm text-neutral-500">
              Шаг {currentStep} из {TOTAL_STEPS}: {stepTitles[currentStep - 1]}
            </div>
          </div>
          <Progress value={progress} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="bg-white rounded-2xl p-8 border border-neutral-200">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {currentStep === 1 && (
              <Step1 formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 2 && (
              <Step2 formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 3 && (
              <Step3 formData={formData} updateFormData={updateFormData} />
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-neutral-200">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                ← Назад
              </Button>

              {currentStep < TOTAL_STEPS ? (
                <Button onClick={nextStep}>Далее →</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Создание...' : 'Создать демо-бота'}
                </Button>
              )}
            </div>
          </div>

          {/* Right: Bot Preview */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden lg:sticky lg:top-6 h-[600px] lg:h-[calc(100vh-120px)]">
            <BotPreview formData={formData} />
          </div>
        </div>
      </div>
    </div>
  )
}
