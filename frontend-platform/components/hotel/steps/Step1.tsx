import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { HotelFormData } from '@/lib/types'

interface Step1Props {
  formData: Partial<HotelFormData>
  updateFormData: (data: Partial<HotelFormData>) => void
}

export function Step1({ formData, updateFormData }: Step1Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2 text-[#FAFAFA]">
          Основная информация
        </h2>
        <p className="text-[#A3A3A3] text-sm">
          Расскажите об отеле - эти данные бот будет использовать для ответов
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Название отеля <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Radisson Bishkek"
            value={formData.name || ''}
            onChange={(e) => updateFormData({ name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Адрес</Label>
          <Input
            id="address"
            placeholder="ул. Абдрахманова 191, Бишкек"
            value={formData.address || ''}
            onChange={(e) => updateFormData({ address: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">
            Телефон <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            placeholder="+996 312 123456"
            value={formData.phone || ''}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="info@radisson.kg"
            value={formData.email || ''}
            onChange={(e) => updateFormData({ email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Веб-сайт</Label>
          <Input
            id="website"
            placeholder="https://radisson.kg"
            value={formData.website || ''}
            onChange={(e) => updateFormData({ website: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Краткое описание</Label>
          <Textarea
            id="description"
            placeholder="4-звёздочный отель в центре Бишкека с современными номерами и отличным сервисом..."
            rows={4}
            value={formData.description || ''}
            onChange={(e) => updateFormData({ description: e.target.value })}
          />
          <p className="text-xs text-[#A3A3A3]">
            Опишите главные преимущества отеля
          </p>
        </div>
      </div>
    </div>
  )
}
