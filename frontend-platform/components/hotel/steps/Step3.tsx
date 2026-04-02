import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { HotelFormData } from '@/lib/types'

interface Step3Props {
  formData: Partial<HotelFormData>
  updateFormData: (data: Partial<HotelFormData>) => void
}

const times = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return `${hour}:00`
})

export function Step3({ formData, updateFormData }: Step3Props) {
  const rules = formData.rules || {}
  const amenities = formData.amenities || {}

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Правила и услуги
        </h2>
        <p className="text-neutral-500 text-sm">
          Укажите правила отеля и доступные удобства
        </p>
      </div>

      {/* Правила отеля */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Правила отеля</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Check-in</Label>
            <Select
              value={rules.checkin || '14:00'}
              onChange={(e) =>
                updateFormData({
                  rules: { ...rules, checkin: e.target.value },
                })
              }
            >
              {times.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Check-out</Label>
            <Select
              value={rules.checkout || '12:00'}
              onChange={(e) =>
                updateFormData({
                  rules: { ...rules, checkout: e.target.value },
                })
              }
            >
              {times.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Условия отмены</Label>
          <Textarea
            placeholder="Бесплатная отмена за 24 часа до заезда..."
            rows={2}
            value={rules.cancellation || ''}
            onChange={(e) =>
              updateFormData({
                rules: { ...rules, cancellation: e.target.value },
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Способы оплаты</Label>
          <div className="space-y-2">
            <Checkbox
              label="Банковские карты"
              checked={rules.paymentCards || false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData({
                  rules: { ...rules, paymentCards: e.target.checked },
                })
              }
            />
            <Checkbox
              label="QR-коды (ELSOM, O! денги)"
              checked={rules.paymentQR || false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData({
                  rules: { ...rules, paymentQR: e.target.checked },
                })
              }
            />
            <Checkbox
              label="Наличные"
              checked={rules.paymentCash || false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData({
                  rules: { ...rules, paymentCash: e.target.checked },
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Правила про животных</Label>
          <Textarea
            placeholder="Размещение с животными не разрешено..."
            rows={2}
            value={rules.pets || ''}
            onChange={(e) =>
              updateFormData({
                rules: { ...rules, pets: e.target.value },
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Курение</Label>
          <Textarea
            placeholder="Курение запрещено во всех помещениях отеля..."
            rows={2}
            value={rules.smoking || ''}
            onChange={(e) =>
              updateFormData({
                rules: { ...rules, smoking: e.target.value },
              })
            }
          />
        </div>
      </div>

      {/* Удобства */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Удобства</h3>

        <div className="space-y-2">
          <Checkbox
            label="Wi-Fi бесплатно"
            checked={amenities.wifi || false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateFormData({
                amenities: { ...amenities, wifi: e.target.checked },
              })
            }
          />
          <Checkbox
            label="Парковка"
            checked={amenities.parking || false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateFormData({
                amenities: { ...amenities, parking: e.target.checked },
              })
            }
          />
          <Checkbox
            label="Завтрак включён"
            checked={amenities.breakfast || false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateFormData({
                amenities: { ...amenities, breakfast: e.target.checked },
              })
            }
          />
          <Checkbox
            label="Бассейн"
            checked={amenities.pool || false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateFormData({
                amenities: { ...amenities, pool: e.target.checked },
              })
            }
          />
          <Checkbox
            label="Трансфер"
            checked={amenities.transfer || false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateFormData({
                amenities: { ...amenities, transfer: e.target.checked },
              })
            }
          />
          <Checkbox
            label="Экскурсии"
            checked={amenities.excursions || false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateFormData({
                amenities: { ...amenities, excursions: e.target.checked },
              })
            }
          />
          <Checkbox
            label="Конференц-зал"
            checked={amenities.conference || false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateFormData({
                amenities: { ...amenities, conference: e.target.checked },
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Другие услуги</Label>
          <Textarea
            placeholder="Прачечная, room service, сейф..."
            rows={2}
            value={amenities.other || ''}
            onChange={(e) =>
              updateFormData({
                amenities: { ...amenities, other: e.target.value },
              })
            }
          />
        </div>
      </div>
    </div>
  )
}
