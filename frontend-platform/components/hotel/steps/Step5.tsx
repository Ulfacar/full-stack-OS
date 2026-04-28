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
        <h2 className="text-2xl font-semibold tracking-tight mb-2 text-[#FAFAFA]">
          Подключите каналы
        </h2>
        <p className="text-[#A3A3A3] text-sm">
          Настройте Telegram и WhatsApp для работы бота
        </p>
      </div>

      {/* Telegram */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[#FAFAFA] flex items-center gap-2">
          <span className="text-2xl">📱</span> Telegram
        </h3>

        <div className="space-y-3 p-4 bg-[#141414] rounded-lg border border-[#262626]">
          <div className="text-sm space-y-2">
            <p className="font-medium text-[#FAFAFA]">Инструкция:</p>
            <ol className="list-decimal list-inside space-y-1 text-[#A3A3A3]">
              <li>Откройте Telegram и найдите @BotFather</li>
              <li>Отправьте команду <code className="bg-[#1A1A1A] px-1 py-0.5 rounded text-[#FAFAFA]">/newbot</code></li>
              <li>Следуйте инструкциям и получите токен</li>
              <li>Скопируйте токен и вставьте ниже</li>
            </ol>
          </div>

          <a
            href="https://core.telegram.org/bots/tutorial#obtain-your-bot-token"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#3B82F6] hover:underline"
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
          <p className="text-xs text-[#A3A3A3]">
            Токен выглядит примерно так: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
          </p>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[#FAFAFA] flex items-center gap-2">
          <span className="text-2xl">💬</span> WhatsApp (опционально)
        </h3>

        <div className="space-y-3 p-4 bg-[#141414] rounded-lg border border-[#262626]">
          <div className="text-sm text-[#A3A3A3]">
            <p>
              Для WhatsApp нужен <span className="text-[#FAFAFA]">отдельный прогретый номер</span>{' '}
              (7-14 дней). Без прогрева риск бана.
            </p>
            <p className="mt-2">
              Оставьте номер телефона — мы свяжемся с вами для настройки.
            </p>
          </div>

          <a
            href="/guides/wa-onboarding"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#3B82F6] hover:underline inline-block"
          >
            📖 Гайд: подключение WhatsApp за 4 шага (отдельный SIM, прогрев, анти-бан)
          </a>
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
          <p className="text-xs text-[#A3A3A3]">
            Укажите номер, который будет использоваться для WhatsApp Business
          </p>
        </div>
      </div>

      {/* Final note */}
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div className="text-sm">
            <p className="font-medium text-emerald-400 mb-1">
              Всё готово к созданию!
            </p>
            <p className="text-emerald-400/80">
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
