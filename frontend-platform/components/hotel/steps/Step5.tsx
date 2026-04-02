import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { HotelFormData } from '@/lib/types'

interface Step5Props {
  formData: Partial<HotelFormData>
  updateFormData: (data: Partial<HotelFormData>) => void
}

export function Step5({ formData, updateFormData }: Step5Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Подключите каналы
        </h2>
        <p className="text-neutral-500 text-sm">
          Настройте Telegram и WhatsApp для работы бота
        </p>
      </div>

      {/* Telegram */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <span className="text-2xl">📱</span> Telegram
        </h3>

        <div className="space-y-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="text-sm space-y-2">
            <p className="font-medium">Инструкция:</p>
            <ol className="list-decimal list-inside space-y-1 text-neutral-600">
              <li>Откройте Telegram и найдите @BotFather</li>
              <li>Отправьте команду <code className="bg-white px-1 py-0.5 rounded">/newbot</code></li>
              <li>Следуйте инструкциям и получите токен</li>
              <li>Скопируйте токен и вставьте ниже</li>
            </ol>
          </div>

          <a
            href="https://core.telegram.org/bots/tutorial#obtain-your-bot-token"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            📖 Подробная инструкция как создать бота
          </a>
        </div>

        <div className="space-y-2">
          <Label htmlFor="telegram_token">
            Токен Telegram <span className="text-red-500">*</span>
          </Label>
          <Input
            id="telegram_token"
            placeholder="1234567890:ABCdefGhIJKlmNoPQRstuVWXyz"
            value={formData.telegramBotToken || ''}
            onChange={(e) =>
              updateFormData({ telegramBotToken: e.target.value })
            }
            required
          />
          <p className="text-xs text-neutral-500">
            Токен выглядит примерно так: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
          </p>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <span className="text-2xl">💬</span> WhatsApp (опционально)
        </h3>

        <div className="space-y-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="text-sm text-neutral-600">
            <p>
              Подключение WhatsApp Business API требует верификации и займёт
              1-2 дня.
            </p>
            <p className="mt-2">
              Оставьте номер телефона — мы свяжемся с вами для настройки.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">Номер телефона WhatsApp</Label>
          <Input
            id="whatsapp"
            placeholder="+996 555 123 456"
            value={formData.whatsappPhone || ''}
            onChange={(e) =>
              updateFormData({ whatsappPhone: e.target.value })
            }
          />
          <p className="text-xs text-neutral-500">
            Укажите номер, который будет использоваться для WhatsApp Business
          </p>
        </div>
      </div>

      {/* Final note */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div className="text-sm">
            <p className="font-medium text-green-900 mb-1">
              Всё готово к созданию!
            </p>
            <p className="text-green-700">
              После нажатия кнопки "Создать бота" мы автоматически настроим
              AI-ассистента и подключим его к Telegram. Вы сможете сразу начать
              тестирование.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
