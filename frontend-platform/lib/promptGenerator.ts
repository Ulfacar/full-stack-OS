import type { HotelFormData } from './types'

export function generatePrompt(data: Partial<HotelFormData>): string {
  const parts: string[] = []

  parts.push(
    `Ты — AI-ассистент отеля «${data.name || ''}». ` +
    `Расположение: ${data.address || ''}. ` +
    `${data.description || ''}`
  )

  const styleMap: Record<string, string> = {
    friendly: 'Общайся дружелюбно, с эмодзи, как заботливый консьерж.',
    formal: 'Общайся по-деловому, кратко и профессионально.',
    neutral: 'Общайся нейтрально, информативно.',
  }
  parts.push(styleMap[data.communicationStyle || 'friendly'] || styleMap.friendly)

  const contacts: string[] = []
  if (data.phone) contacts.push(`тел: ${data.phone}`)
  if (data.email) contacts.push(`email: ${data.email}`)
  if (data.website) contacts.push(`сайт: ${data.website}`)
  if (contacts.length) parts.push(`\nКонтакты: ${contacts.join(', ')}`)

  if (data.rooms?.length) {
    parts.push('\n## Номерной фонд:')
    for (const room of data.rooms) {
      const guests = room.maxGuests || room.capacity || '?'
      parts.push(`- ${room.name}: до ${guests} гостей. ${room.description || ''}`)
    }
  }

  if (data.seasons?.length && data.seasonPrices?.length) {
    parts.push('\n## Цены (за сутки):')
    for (let si = 0; si < data.seasons.length; si++) {
      const season = data.seasons[si]
      parts.push(`\n### ${season.name}: ${season.dateFrom} — ${season.dateTo}`)
      for (const sp of data.seasonPrices) {
        if (sp.seasonIndex === si && data.rooms?.[sp.roomIndex]) {
          parts.push(`  - ${data.rooms[sp.roomIndex].name} (${sp.guests} гост.): ${sp.price} сом`)
        }
      }
    }
  }

  if (data.rules) {
    parts.push('\n## Правила:')
    if (data.rules.checkin) parts.push(`- Заезд: ${data.rules.checkin}`)
    if (data.rules.checkout) parts.push(`- Выезд: ${data.rules.checkout}`)
    if (data.rules.prepayment) parts.push(`- Предоплата: ${data.rules.prepayment}`)
    if (data.rules.cancellation) parts.push(`- Отмена: ${data.rules.cancellation}`)
    if (data.rules.pets) parts.push(`- Животные: ${data.rules.pets}`)
    if (data.rules.smoking) parts.push(`- Курение: ${data.rules.smoking}`)
  }

  if (data.amenities) {
    const list: string[] = []
    if (data.amenities.wifi) list.push('Wi-Fi')
    if (data.amenities.parking) list.push('парковка')
    if (data.amenities.pool) list.push('бассейн')
    if (data.amenities.restaurant) list.push('ресторан')
    if (data.amenities.breakfast) list.push('завтрак')
    if (data.amenities.sauna) list.push('сауна')
    if (data.amenities.beach) list.push('пляж')
    if (data.amenities.playground) list.push('детская площадка')
    if (data.amenities.transfer) list.push('трансфер')
    if (data.amenities.conference) list.push('конференц-зал')
    if (data.amenities.excursions) list.push('экскурсии')
    if (list.length) parts.push(`\n## Удобства: ${list.join(', ')}`)
  }

  parts.push(`
## ВАЖНЫЕ ПРАВИЛА:
- НЕ выдумывай информацию. Если не знаешь — скажи что уточнишь у менеджера.
- Для бронирования собери: даты, кол-во гостей, ФИО, телефон.
- Когда все данные собраны — напиши [НУЖЕН_МЕНЕДЖЕР].
- Всегда спрашивай номер телефона.
- Отвечай КОРОТКО, 1-3 предложения.`)

  return parts.join('\n')
}
