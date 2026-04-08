import type { HotelFormData } from './types'

export function generatePrompt(data: Partial<HotelFormData>): string {
  const parts: string[] = []

  // Роль
  parts.push(
    `Ты — AI-ассистент отеля «${data.name || ''}». ` +
    `Расположение: ${data.address || ''}. ` +
    `${data.description || ''}`
  )

  // Стиль
  const styleMap: Record<string, string> = {
    friendly: 'Общайся дружелюбно, с эмодзи, как заботливый консьерж.',
    formal: 'Общайся по-деловому, кратко и профессионально.',
    neutral: 'Общайся нейтрально, информативно.',
  }
  parts.push(styleMap[data.communicationStyle || 'friendly'] || styleMap.friendly)

  // Контакты
  const contacts: string[] = []
  if (data.phone) contacts.push(`тел: ${data.phone}`)
  if (data.email) contacts.push(`email: ${data.email}`)
  if (data.website) contacts.push(`сайт: ${data.website}`)
  if (contacts.length) parts.push(`\nКонтакты: ${contacts.join(', ')}`)

  // Номера
  if (data.rooms?.length) {
    parts.push('\n## Номерной фонд:')
    for (const room of data.rooms) {
      parts.push(
        `- ${room.name}: до ${room.maxGuests} гостей. ${room.description || ''}`
      )
    }
  }

  // Сезоны и цены
  if (data.seasons?.length && data.prices?.length) {
    parts.push('\n## Цены (за сутки):')
    for (const season of data.seasons) {
      parts.push(`\n### ${season.name}: ${season.startDate} — ${season.endDate}`)
      for (const price of data.prices) {
        if (price.season === season.name) {
          parts.push(`  - ${price.room}: ${price.price} сом`)
        }
      }
    }
  }

  // Правила
  if (data.rules) {
    parts.push('\n## Правила:')
    if (data.rules.checkin) parts.push(`- Заезд: ${data.rules.checkin}`)
    if (data.rules.checkout) parts.push(`- Выезд: ${data.rules.checkout}`)
    if (data.rules.pets) parts.push(`- Животные: ${data.rules.pets}`)
    if (data.rules.smoking) parts.push(`- Курение: ${data.rules.smoking}`)
  }

  // Удобства
  if (data.amenities) {
    const list: string[] = []
    if (data.amenities.wifi) list.push('Wi-Fi')
    if (data.amenities.parking) list.push('парковка')
    if (data.amenities.pool) list.push('бассейн')
    if (data.amenities.restaurant) list.push('ресторан')
    if (data.amenities.sauna) list.push('сауна')
    if (data.amenities.beach) list.push('пляж')
    if (data.amenities.playground) list.push('детская площадка')
    if (data.amenities.transfer) list.push('трансфер')
    if (data.amenities.conference) list.push('конференц-зал')
    if (list.length) parts.push(`\n## Удобства: ${list.join(', ')}`)
  }

  // Антигаллюцинация
  parts.push(`
## ВАЖНЫЕ ПРАВИЛА:
- НЕ выдумывай информацию. Если не знаешь — скажи что уточнишь у менеджера.
- Для бронирования собери: даты, кол-во гостей, ФИО, телефон.
- Когда все данные собраны — напиши [НУЖЕН_МЕНЕДЖЕР].
- Всегда спрашивай номер телефона.
- Отвечай КОРОТКО, 1-3 предложения.`)

  return parts.join('\n')
}
