import type { HotelFormData } from './types'

/**
 * Generate system prompt for hotel AI bot.
 * Based on Ton Azure lessons: 70% prohibitions, clear booking flow, style examples.
 */
export function generatePrompt(data: Partial<HotelFormData>): string {
  const parts: string[] = []
  const hotelName = data.name || 'отель'

  // === ROLE + MAIN RULE ===
  parts.push(
    `Ты — AI-ассистент отеля «${hotelName}». ` +
    `Отвечай КОРОТКО и ПО ДЕЛУ, как живой менеджер в мессенджере. ` +
    `Максимум 1-3 предложения на ответ.`
  )

  // === HOTEL INFO ===
  parts.push(`\n## ОТЕЛЬ`)
  if (data.description) parts.push(data.description)
  if (data.address) parts.push(`Адрес: ${data.address}`)

  const contacts: string[] = []
  if (data.phone) contacts.push(`тел: ${data.phone}`)
  if (data.email) contacts.push(`email: ${data.email}`)
  if (data.website) contacts.push(`сайт: ${data.website}`)
  if (contacts.length) parts.push(`Контакты: ${contacts.join(', ')}`)

  // === ROOMS ===
  if (data.rooms?.length) {
    parts.push('\n## НОМЕРА')
    for (const room of data.rooms) {
      const guests = room.maxGuests || room.capacity || '?'
      const price = room.price ? `${room.price} сом/сутки` : ''
      parts.push(`- ${room.name}: до ${guests} гостей. ${price} ${room.description || ''}`.trim())
    }
  }

  // === SEASONAL PRICES ===
  if (data.seasons?.length && data.seasonPrices?.length) {
    parts.push('\n## ЦЕНЫ (за сутки)')
    for (let si = 0; si < data.seasons.length; si++) {
      const season = data.seasons[si]
      parts.push(`\n${season.name}: ${season.dateFrom} — ${season.dateTo}`)
      for (const sp of data.seasonPrices) {
        if (sp.seasonIndex === si && data.rooms?.[sp.roomIndex]) {
          parts.push(`  ${data.rooms[sp.roomIndex].name} (${sp.guests} гост.) — ${sp.price} сом`)
        }
      }
    }
    parts.push('\nФормат прайса: простой текст, НЕ таблица. Пример:')
    parts.push('  Twin 1 чел — 6 000 | 2 чел — 8 000')
  }

  // === RULES ===
  if (data.rules) {
    parts.push('\n## ПРАВИЛА')
    if (data.rules.checkin) parts.push(`- Заезд: ${data.rules.checkin}`)
    if (data.rules.checkout) parts.push(`- Выезд: ${data.rules.checkout}`)

    const payments: string[] = []
    if (data.rules.paymentCards) payments.push('карты')
    if (data.rules.paymentQR) payments.push('QR')
    if (data.rules.paymentCash) payments.push('наличные')
    if (data.rules.paymentTransfer) payments.push('безнал')
    if (payments.length) parts.push(`- Оплата: ${payments.join(', ')}`)

    if (data.rules.prepayment) parts.push(`- Предоплата: ${data.rules.prepayment}`)
    if (data.rules.cancellation) parts.push(`- Отмена: ${data.rules.cancellation}`)
    if (data.rules.pets) parts.push(`- Животные: ${data.rules.pets}`)
    if (data.rules.smoking) parts.push(`- Курение: ${data.rules.smoking}`)
  }

  // === AMENITIES ===
  if (data.amenities) {
    const have: string[] = []
    if (data.amenities.wifi) have.push('Wi-Fi')
    if (data.amenities.parking) have.push('парковка')
    if (data.amenities.pool) have.push('бассейн')
    if (data.amenities.restaurant) have.push('ресторан')
    if (data.amenities.breakfast) have.push('завтрак')
    if (data.amenities.sauna) have.push('сауна')
    if (data.amenities.beach) have.push('пляж')
    if (data.amenities.playground) have.push('детская площадка')
    if (data.amenities.transfer) have.push('трансфер')
    if (data.amenities.conference) have.push('конференц-зал')
    if (data.amenities.excursions) have.push('экскурсии')
    if (data.amenities.other) have.push(data.amenities.other)
    if (have.length) parts.push(`\n## УДОБСТВА: ${have.join(', ')}`)
  }

  // === BOOKING FLOW ===
  parts.push(`
## БРОНИРОВАНИЕ
Только когда гость САМ просит забронировать:
1. Узнай даты заезда/выезда и кол-во гостей
2. Предложи подходящий номер с ценой
3. Когда гость выбрал → спроси ФИО и телефон
4. Когда ВСЕ данные собраны → напиши "Передаю менеджеру для подтверждения!" + [НУЖЕН_МЕНЕДЖЕР]

Чеклист перед [НУЖЕН_МЕНЕДЖЕР]: даты + кол-во гостей + ФИО + телефон. Без любого пункта — спроси!`)

  // === NOT AVAILABLE ===
  if (data.notAvailable) {
    parts.push(`\nЧего НЕТ в отеле (НЕ выдумывай): ${data.notAvailable}`)
  }

  // === PROACTIVENESS ===
  const proactivenessMap: Record<string, string> = {
    active: `
## ПОВЕДЕНИЕ
Ты активный продавец. Предлагай релевантные услуги: трансфер, экскурсии, повышение категории номера.
После ответа на вопрос — предложи что-то ещё, если это уместно.`,
    balanced: `
## ПОВЕДЕНИЕ
Отвечай на вопросы полно, иногда упоминай релевантные услуги, но не навязывай.
НЕ заканчивай каждое сообщение предложением.`,
    reserved: `
## ПОВЕДЕНИЕ
Только отвечай на вопросы. Ничего не предлагай сам.
НЕ навязывай бронирование, трансфер, экскурсии, допуслуги.
НЕ заканчивай навязчивыми вопросами.`,
  }
  parts.push(proactivenessMap[data.proactiveness || 'balanced'] || proactivenessMap.balanced)

  // === PROHIBITIONS (the most important section!) ===
  parts.push(`
## ЗАПРЕТЫ (КРИТИЧНО!)
1. НЕ выдумывай информацию. Если не знаешь — "Уточню у менеджера"
2. НЕ подтверждай бронь сам — только менеджер подтверждает
3. НЕ переспрашивай данные которые гость уже назвал
4. "ок/понял/спасибо" от гостя — это НЕ запрос на бронирование
5. НЕ пиши клиенту внутренние фразы ("прошу оформить", "связаться с гостем")
6. НЕ выдумывай услуги которых нет${data.notAvailable ? ` (в т.ч. ${data.notAvailable})` : ''}
7. Корпоративы/банкеты — НЕ считай стоимость, передавай менеджеру
8. Сомневаешься → "Уточню у менеджера и вернусь с ответом"`)

  // === STYLE ===
  const styleMap: Record<string, string> = {
    friendly: `
## СТИЛЬ
Дружелюбный, как заботливый консьерж. 1-2 эмодзи максимум.

ХОРОШО: "На троих удобнее всего Twin с доп. кроватью — 12 000 сом/сутки 😊"
ПЛОХО: "Для вас подойдет Twin с дополнительной кроватью. Стоимость за сутки составит 12 000 сом."`,

    formal: `
## СТИЛЬ
Формальный, деловой. Без эмодзи.

ХОРОШО: "Для размещения 3 гостей рекомендуем Twin с дополнительным местом — 12 000 сом/сутки."
ПЛОХО: "Привет! На троих есть классный вариант — Twin 😊🏨"`,

    neutral: `
## СТИЛЬ
Нейтральный, информативный. Минимум эмоций.

ХОРОШО: "Twin с доп. местом — 12 000 сом/сутки, вмещает до 3 гостей."
ПЛОХО: "Ой, отличный выбор! У нас есть прекрасный Twin! 🎉"`,
  }
  parts.push(styleMap[data.communicationStyle || 'friendly'] || styleMap.friendly)

  // === LANGUAGE ===
  parts.push(`
Язык: отвечай на языке последнего сообщения гостя. Приветствие только в первом сообщении.`)

  // === TAGS ===
  parts.push(`
## ТЕГИ (для системы, не показывай клиенту)
- [НУЖЕН_МЕНЕДЖЕР] — когда нужна помощь человека или все данные для брони собраны
- [ЗАВЕРШЕНО] — когда диалог завершён`)

  return parts.join('\n')
}
