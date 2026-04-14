'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { BotPreview } from './BotPreview'
import api from '@/lib/api'
import { generatePrompt } from '@/lib/promptGenerator'
import type { HotelFormData } from '@/lib/types'

const TOTAL_STEPS = 8

const times = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)

export function FullWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [data, setData] = useState<Record<string, any>>({
    // Step 1: General info
    name: '', address: '', phone: '', email: '', website: '', description: '',
    howToGet: '', category: '', yearOpened: '', instagram: '',
    // Step 2: Rooms
    rooms: [],
    roomDetails: '', maxGuestsNote: '', accessibleRooms: '', familyRooms: '',
    // Step 3: Booking
    checkin: '14:00', checkout: '12:00',
    earlyCheckin: '', lateCheckout: '', documentsRequired: '',
    prepayment: '', paymentCards: false, paymentQR: false, paymentCash: false, paymentTransfer: false,
    cancellation: '', bookWithoutPrepay: '', deposit: '',
    foreignGuests: '',
    // Step 4: Services
    breakfast: '', restaurantMenu: '', roomService: '',
    parking: '', wifi: true, transfer: '', laundry: '',
    pool: '', gym: '', conferenceHall: '', playground: '',
    excursions: '', rental: '', additionalServices: '',
    // Step 5: Rules
    pets: '', smoking: '', quietHours: '', poolRules: '',
    ageRestrictions: '', thirdPartyPolicy: '', lostKeyPolicy: '',
    maxGuestsPerRoom: '',
    // Step 6: Location + Season
    nearbyPlaces: '', distanceToAirport: '', howToGetDetailed: '',
    nearbyShops: '', distanceToBeach: '',
    highSeason: '', lowSeason: '', seasonalPrices: '', yearRound: true,
    specialOffersLowSeason: '',
    // Step 7: Events + Safety
    weddings: '', specialPackages: '', giftCertificates: '',
    loyaltyProgram: '', travelAgencies: '',
    security: '', safes: '', emergencyProcedure: '', firstAid: '',
    // Step 8: Bot style + Sales
    addressForm: 'вы', communicationStyle: 'friendly', proactiveness: 'balanced',
    forbiddenWords: '', useEmojis: true, greeting: '', managerTriggers: '',
    notAvailable: '',
    upsellRooms: '', upsellServices: '',
    noAvailabilityAction: '', marketing: '',
    languages: ['ru', 'en'],
  })

  const update = (fields: Record<string, any>) => setData(prev => ({ ...prev, ...fields }))

  const next = () => { setError(''); if (step < TOTAL_STEPS) setStep(step + 1) }
  const prev = () => { setError(''); if (step > 1) setStep(step - 1) }

  const handleSubmit = async () => {
    if (!data.name) { setError('Укажите название отеля'); return }
    setLoading(true)
    setError('')

    try {
      const formData: Partial<HotelFormData> = {
        name: data.name, address: data.address, phone: data.phone,
        email: data.email, website: data.website, description: data.description,
        rooms: data.rooms || [],
        rules: {
          checkin: data.checkin, checkout: data.checkout,
          cancellation: data.cancellation, pets: data.pets, smoking: data.smoking,
          paymentCards: data.paymentCards, paymentQR: data.paymentQR,
          paymentCash: data.paymentCash,
        },
        amenities: {
          wifi: data.wifi, parking: !!data.parking, breakfast: !!data.breakfast,
          pool: !!data.pool, transfer: !!data.transfer, excursions: !!data.excursions,
          conference: !!data.conferenceHall, other: data.additionalServices,
        },
        communicationStyle: data.communicationStyle,
        proactiveness: data.proactiveness,
        notAvailable: data.notAvailable,
        restaurantMenu: data.restaurantMenu,
        nearbyPlaces: data.nearbyPlaces,
        languages: data.languages,
      }

      const systemPrompt = generatePrompt(formData)

      // Build extended prompt with full questionnaire data
      let extendedPrompt = systemPrompt

      // Append full-mode specific data
      if (data.howToGet) extendedPrompt += `\n\nКак добраться: ${data.howToGet}`
      if (data.transfer) extendedPrompt += `\n\nТрансфер: ${data.transfer}`
      if (data.earlyCheckin) extendedPrompt += `\n\nРанний заезд: ${data.earlyCheckin}`
      if (data.lateCheckout) extendedPrompt += `\n\nПоздний выезд: ${data.lateCheckout}`
      if (data.prepayment) extendedPrompt += `\n\nПредоплата: ${data.prepayment}`
      if (data.foreignGuests) extendedPrompt += `\n\nИностранные гости: ${data.foreignGuests}`
      if (data.quietHours) extendedPrompt += `\n\nТихий час: ${data.quietHours}`
      if (data.poolRules) extendedPrompt += `\n\nПравила бассейна: ${data.poolRules}`
      if (data.distanceToBeach) extendedPrompt += `\n\nДо пляжа: ${data.distanceToBeach}`
      if (data.distanceToAirport) extendedPrompt += `\n\nДо аэропорта: ${data.distanceToAirport}`
      if (data.weddings) extendedPrompt += `\n\nМероприятия: ${data.weddings}`
      if (data.emergencyProcedure) extendedPrompt += `\n\nЭкстренные ситуации: ${data.emergencyProcedure}`
      if (data.forbiddenWords) extendedPrompt += `\n\nЗапрещённые слова/фразы: ${data.forbiddenWords}`
      if (data.greeting) extendedPrompt += `\n\nФирменное приветствие: ${data.greeting}`
      if (data.upsellServices) extendedPrompt += `\n\nДоп. услуги для предложения: ${data.upsellServices}`
      if (data.noAvailabilityAction) extendedPrompt += `\n\nЕсли нет свободных номеров: ${data.noAvailabilityAction}`

      const payload = {
        name: data.name, address: data.address, phone: data.phone,
        email: data.email, website: data.website, description: data.description,
        rooms: data.rooms, rules: formData.rules, amenities: formData.amenities,
        ai_model: 'anthropic/claude-3.5-haiku',
        system_prompt: extendedPrompt,
        communication_style: data.communicationStyle,
        languages: data.languages,
      }

      const res = await api.post('/hotels', payload)
      router.push(`/hotels/${res.data.id}/demo`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка создания бота')
    } finally {
      setLoading(false)
    }
  }

  const progress = (step / TOTAL_STEPS) * 100
  const stepTitles = [
    'Об отеле', 'Номера', 'Бронирование', 'Услуги',
    'Правила', 'Расположение', 'Мероприятия', 'Стиль бота',
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-lg font-semibold">Ex-Machina — Полный опросник</h1>
            <div className="text-sm text-neutral-500">
              Шаг {step} из {TOTAL_STEPS}: {stepTitles[step - 1]}
            </div>
          </div>
          <Progress value={progress} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 border border-neutral-200">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Step 1: General Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div><h2 className="text-2xl font-semibold mb-1">Общая информация</h2><p className="text-neutral-500 text-sm">Основные данные об отеле</p></div>
                <div className="space-y-4">
                  <div><Label>Название отеля *</Label><Input value={data.name} onChange={e => update({ name: e.target.value })} placeholder="Ton Azure Boutique Hotel" /></div>
                  <div><Label>Адрес</Label><Input value={data.address} onChange={e => update({ address: e.target.value })} placeholder="с. Тон, ул. Мектеп-2, д. 7" /></div>
                  <div><Label>Описание отеля (2-3 предложения)</Label><Textarea rows={3} value={data.description} onChange={e => update({ description: e.target.value })} placeholder="Чем уникален, что отличает от других..." /></div>
                  <div><Label>Как добраться</Label><Textarea rows={2} value={data.howToGet} onChange={e => update({ howToGet: e.target.value })} placeholder="Описание маршрута, ближайшие ориентиры..." /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Телефон *</Label><Input value={data.phone} onChange={e => update({ phone: e.target.value })} placeholder="+996700588801" /></div>
                    <div><Label>Email</Label><Input value={data.email} onChange={e => update({ email: e.target.value })} placeholder="hotel@gmail.com" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Сайт</Label><Input value={data.website} onChange={e => update({ website: e.target.value })} placeholder="www.hotel.com" /></div>
                    <div><Label>Instagram</Label><Input value={data.instagram} onChange={e => update({ instagram: e.target.value })} placeholder="@hotel_name" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Категория/звёзды</Label><Input value={data.category} onChange={e => update({ category: e.target.value })} placeholder="3 звезды / бутик / без категории" /></div>
                    <div><Label>Год открытия</Label><Input value={data.yearOpened} onChange={e => update({ yearOpened: e.target.value })} placeholder="2026" /></div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Rooms */}
            {step === 2 && (
              <div className="space-y-6">
                <div><h2 className="text-2xl font-semibold mb-1">Номера и размещение</h2><p className="text-neutral-500 text-sm">Типы номеров, описание, вместимость</p></div>
                <div><Label>Опишите все типы номеров (названия, количество, площадь, что внутри)</Label><Textarea rows={6} value={data.roomDetails} onChange={e => update({ roomDetails: e.target.value })} placeholder="13 стандартных Twin/Double (25 кв.м, Wi-Fi, ТВ, холодильник)&#10;2 Triple (37-40 кв.м)&#10;2 Quadruple семейных (33-48 кв.м)..." /></div>
                <div><Label>Максимальное кол-во гостей (доп. кровати?)</Label><Textarea rows={2} value={data.maxGuestsNote} onChange={e => update({ maxGuestsNote: e.target.value })} placeholder="Возможна доп. раскладная кровать +1 гость..." /></div>
                <div><Label>Номера для людей с ограниченными возможностями</Label><Input value={data.accessibleRooms} onChange={e => update({ accessibleRooms: e.target.value })} placeholder="Да, на 1 этаже / Нет" /></div>
                <div><Label>Семейные номера / детская кроватка</Label><Input value={data.familyRooms} onChange={e => update({ familyRooms: e.target.value })} placeholder="По запросу бесплатно предоставим детскую кроватку" /></div>
              </div>
            )}

            {/* Step 3: Booking */}
            {step === 3 && (
              <div className="space-y-6">
                <div><h2 className="text-2xl font-semibold mb-1">Бронирование и заселение</h2><p className="text-neutral-500 text-sm">Правила заезда, оплаты, отмены</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Check-in</Label><Select value={data.checkin} onChange={e => update({ checkin: e.target.value })}>{times.map(t => <option key={t} value={t}>{t}</option>)}</Select></div>
                  <div><Label>Check-out</Label><Select value={data.checkout} onChange={e => update({ checkout: e.target.value })}>{times.map(t => <option key={t} value={t}>{t}</option>)}</Select></div>
                </div>
                <div><Label>Ранний заезд / поздний выезд</Label><Textarea rows={2} value={data.earlyCheckin} onChange={e => update({ earlyCheckin: e.target.value })} placeholder="Ранний заезд +50% тарифа, поздний выезд +30%..." /></div>
                <div><Label>Документы при заселении</Label><Input value={data.documentsRequired} onChange={e => update({ documentsRequired: e.target.value })} placeholder="Паспорт на кого оформлена бронь" /></div>
                <div><Label>Предоплата</Label><Textarea rows={2} value={data.prepayment} onChange={e => update({ prepayment: e.target.value })} placeholder="В высокий сезон 30% для гарантии брони..." /></div>
                <div><Label>Способы оплаты</Label>
                  <div className="space-y-2 mt-1">
                    <Checkbox label="Банковские карты" checked={data.paymentCards} onChange={(e: any) => update({ paymentCards: e.target.checked })} />
                    <Checkbox label="QR-коды" checked={data.paymentQR} onChange={(e: any) => update({ paymentQR: e.target.checked })} />
                    <Checkbox label="Наличные" checked={data.paymentCash} onChange={(e: any) => update({ paymentCash: e.target.checked })} />
                    <Checkbox label="Банковский перевод" checked={data.paymentTransfer} onChange={(e: any) => update({ paymentTransfer: e.target.checked })} />
                  </div>
                </div>
                <div><Label>Политика отмены</Label><Textarea rows={2} value={data.cancellation} onChange={e => update({ cancellation: e.target.value })} placeholder="Бесплатная отмена за 48ч, иначе предоплата не возвращается..." /></div>
                <div><Label>Иностранные гости (регистрация?)</Label><Input value={data.foreignGuests} onChange={e => update({ foreignGuests: e.target.value })} placeholder="Да, принимаем. Регистрацию делаем." /></div>
              </div>
            )}

            {/* Step 4: Services */}
            {step === 4 && (
              <div className="space-y-6">
                <div><h2 className="text-2xl font-semibold mb-1">Услуги отеля</h2><p className="text-neutral-500 text-sm">Всё что доступно гостям</p></div>
                <div><Label>Завтрак (включён? время? формат?)</Label><Textarea rows={2} value={data.breakfast} onChange={e => update({ breakfast: e.target.value })} placeholder="Включён в стоимость, шведский стол 8:00-10:00..." /></div>
                <div><Label>Ресторан / меню / цены</Label><Textarea rows={3} value={data.restaurantMenu} onChange={e => update({ restaurantMenu: e.target.value })} placeholder="Ресторан с национальной и европейской кухней. Обед ~500 сом..." /></div>
                <div><Label>Room service</Label><Input value={data.roomService} onChange={e => update({ roomService: e.target.value })} placeholder="Да / Нет" /></div>
                <div><Label>Парковка</Label><Input value={data.parking} onChange={e => update({ parking: e.target.value })} placeholder="Бесплатная парковка на территории" /></div>
                <div><Label>Трансфер (откуда, стоимость)</Label><Textarea rows={2} value={data.transfer} onChange={e => update({ transfer: e.target.value })} placeholder="Из Бишкека — 10 000 сом. Из аэропорта Тамчы — уточняется..." /></div>
                <div><Label>Бассейн / сауна / спа</Label><Input value={data.pool} onChange={e => update({ pool: e.target.value })} placeholder="Открытый бассейн с подогревом, сауна планируется..." /></div>
                <div><Label>Конференц-зал</Label><Input value={data.conferenceHall} onChange={e => update({ conferenceHall: e.target.value })} placeholder="30 человек, проектор, онлайн-конференции" /></div>
                <div><Label>Экскурсии / развлечения</Label><Textarea rows={2} value={data.excursions} onChange={e => update({ excursions: e.target.value })} placeholder="Конные прогулки, мастер-классы, морские прогулки..." /></div>
                <div><Label>Другие услуги</Label><Textarea rows={2} value={data.additionalServices} onChange={e => update({ additionalServices: e.target.value })} placeholder="Прачечная, прокат велосипедов, ланч-боксы для походов..." /></div>
              </div>
            )}

            {/* Step 5: Rules */}
            {step === 5 && (
              <div className="space-y-6">
                <div><h2 className="text-2xl font-semibold mb-1">Правила отеля</h2><p className="text-neutral-500 text-sm">Ограничения и политики</p></div>
                <div><Label>Животные</Label><Textarea rows={2} value={data.pets} onChange={e => update({ pets: e.target.value })} placeholder="Запрещено / Разрешено с условиями..." /></div>
                <div><Label>Курение</Label><Textarea rows={2} value={data.smoking} onChange={e => update({ smoking: e.target.value })} placeholder="Запрещено внутри, есть зона для курения. Штраф 10 000 сом..." /></div>
                <div><Label>Тихий час</Label><Input value={data.quietHours} onChange={e => update({ quietHours: e.target.value })} placeholder="22:00 - 08:00, штраф за нарушение" /></div>
                <div><Label>Правила бассейна</Label><Textarea rows={2} value={data.poolRules} onChange={e => update({ poolRules: e.target.value })} placeholder="Душ перед входом, не прыгать, не есть в воде..." /></div>
                <div><Label>Потеря ключа</Label><Input value={data.lostKeyPolicy} onChange={e => update({ lostKeyPolicy: e.target.value })} placeholder="Обратиться на ресепшн, штраф 200 сом" /></div>
                <div><Label>Чего НЕТ в отеле (бот не будет выдумывать)</Label><Textarea rows={2} value={data.notAvailable} onChange={e => update({ notAvailable: e.target.value })} placeholder="Нет кондиционеров, лифта, сейфов в номерах..." /></div>
              </div>
            )}

            {/* Step 6: Location + Season */}
            {step === 6 && (
              <div className="space-y-6">
                <div><h2 className="text-2xl font-semibold mb-1">Расположение и сезоны</h2><p className="text-neutral-500 text-sm">Окрестности, достопримечательности, сезонность</p></div>
                <div><Label>Что рядом с отелем</Label><Textarea rows={3} value={data.nearbyPlaces} onChange={e => update({ nearbyPlaces: e.target.value })} placeholder="Банкомат — 7 км (Боконбаево), аптека — там же, пляж — 1.5 км..." /></div>
                <div><Label>Расстояние до аэропорта</Label><Input value={data.distanceToAirport} onChange={e => update({ distanceToAirport: e.target.value })} placeholder="Манас — 295 км (4.5ч), Тамчы — 146 км (2.5ч)" /></div>
                <div><Label>Расстояние до пляжа</Label><Input value={data.distanceToBeach} onChange={e => update({ distanceToBeach: e.target.value })} placeholder="150м до пляжа Кекилик, 5 км до Уч Чункур" /></div>
                <div><Label>Высокий сезон</Label><Input value={data.highSeason} onChange={e => update({ highSeason: e.target.value })} placeholder="1 июня — 15 сентября" /></div>
                <div><Label>Низкий сезон</Label><Input value={data.lowSeason} onChange={e => update({ lowSeason: e.target.value })} placeholder="1 ноября — 31 марта" /></div>
                <div><Label>Спец. предложения в низкий сезон</Label><Input value={data.specialOffersLowSeason} onChange={e => update({ specialOffersLowSeason: e.target.value })} placeholder="Цены существенно ниже, скидки от 20%..." /></div>
                <Checkbox label="Отель работает круглый год" checked={data.yearRound} onChange={(e: any) => update({ yearRound: e.target.checked })} />
              </div>
            )}

            {/* Step 7: Events + Safety */}
            {step === 7 && (
              <div className="space-y-6">
                <div><h2 className="text-2xl font-semibold mb-1">Мероприятия и безопасность</h2><p className="text-neutral-500 text-sm">Свадьбы, корпоративы, безопасность</p></div>
                <div><Label>Свадьбы / банкеты / корпоративы</Label><Textarea rows={2} value={data.weddings} onChange={e => update({ weddings: e.target.value })} placeholder="Да, условия зависят от кол-ва гостей и меню..." /></div>
                <div><Label>Спец. пакеты (романтический, семейный)</Label><Input value={data.specialPackages} onChange={e => update({ specialPackages: e.target.value })} placeholder="Можем разработать / Нет" /></div>
                <div><Label>Программа лояльности / скидки постоянным</Label><Input value={data.loyaltyProgram} onChange={e => update({ loyaltyProgram: e.target.value })} placeholder="Разрабатывается, информация в Instagram..." /></div>
                <div><Label>Работа с турагентствами</Label><Input value={data.travelAgencies} onChange={e => update({ travelAgencies: e.target.value })} placeholder="Да, сотрудничаем с КАТО, скидки партнёрам..." /></div>
                <div><Label>Охрана / видеонаблюдение</Label><Input value={data.security} onChange={e => update({ security: e.target.value })} placeholder="Видеонаблюдение + круглосуточная охрана" /></div>
                <div><Label>Что делать в экстренной ситуации</Label><Textarea rows={2} value={data.emergencyProcedure} onChange={e => update({ emergencyProcedure: e.target.value })} placeholder="Обратиться на ресепшн, есть сотрудники с навыками первой помощи..." /></div>
              </div>
            )}

            {/* Step 8: Bot Style + Sales */}
            {step === 8 && (
              <div className="space-y-6">
                <div><h2 className="text-2xl font-semibold mb-1">Стиль бота и продажи</h2><p className="text-neutral-500 text-sm">Как бот общается и продаёт</p></div>
                <div><Label>Обращение к гостям</Label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2"><input type="radio" checked={data.addressForm === 'вы'} onChange={() => update({ addressForm: 'вы' })} /> На "вы"</label>
                    <label className="flex items-center gap-2"><input type="radio" checked={data.addressForm === 'ты'} onChange={() => update({ addressForm: 'ты' })} /> На "ты"</label>
                  </div>
                </div>
                <div><Label>Стиль общения</Label>
                  <div className="space-y-2 mt-1">
                    {[
                      { v: 'friendly', l: 'Дружелюбный', d: 'Как заботливый консьерж' },
                      { v: 'formal', l: 'Деловой', d: 'Профессионально и кратко' },
                      { v: 'premium', l: 'Премиальный', d: 'Изысканно и элегантно' },
                    ].map(s => (
                      <label key={s.v} className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer hover:bg-neutral-50 has-[:checked]:border-neutral-900">
                        <input type="radio" checked={data.communicationStyle === s.v} onChange={() => update({ communicationStyle: s.v })} className="mt-1" />
                        <div><div className="font-medium">{s.l}</div><div className="text-sm text-neutral-500">{s.d}</div></div>
                      </label>
                    ))}
                  </div>
                </div>
                <div><Label>Активность бота</Label>
                  <div className="space-y-2 mt-1">
                    {[
                      { v: 'active', l: 'Активный продавец', d: 'Предлагает апгрейд, экскурсии, трансфер' },
                      { v: 'balanced', l: 'Сбалансированный', d: 'Иногда предлагает, не навязывает' },
                      { v: 'reserved', l: 'Сдержанный', d: 'Только отвечает на вопросы' },
                    ].map(s => (
                      <label key={s.v} className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer hover:bg-neutral-50 has-[:checked]:border-neutral-900">
                        <input type="radio" checked={data.proactiveness === s.v} onChange={() => update({ proactiveness: s.v })} className="mt-1" />
                        <div><div className="font-medium">{s.l}</div><div className="text-sm text-neutral-500">{s.d}</div></div>
                      </label>
                    ))}
                  </div>
                </div>
                <div><Label>Слова/фразы которые бот НЕ должен использовать</Label><Textarea rows={2} value={data.forbiddenWords} onChange={e => update({ forbiddenWords: e.target.value })} placeholder='Не использовать "Нет" без объяснения...' /></div>
                <Checkbox label="Использовать эмодзи" checked={data.useEmojis} onChange={(e: any) => update({ useEmojis: e.target.checked })} />
                <div><Label>Фирменное приветствие (опционально)</Label><Input value={data.greeting} onChange={e => update({ greeting: e.target.value })} placeholder="Благодарим за обращение в наш отель!" /></div>
                <div><Label>Что всегда передавать менеджеру</Label><Textarea rows={2} value={data.managerTriggers} onChange={e => update({ managerTriggers: e.target.value })} placeholder="Корпоративы, жалобы, сложные брони, вопросы без ответа..." /></div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-neutral-200">
              <Button variant="outline" onClick={prev} disabled={step === 1}>← Назад</Button>
              {step < TOTAL_STEPS ? (
                <Button onClick={next}>Далее →</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Создание...' : 'Создать бота'}
                </Button>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden lg:sticky lg:top-6 h-[600px] lg:h-[calc(100vh-120px)]">
            <BotPreview formData={{
              name: data.name, description: data.description, address: data.address,
              phone: data.phone, email: data.email, website: data.website,
              rooms: data.rooms, communicationStyle: data.communicationStyle,
              amenities: { wifi: data.wifi, parking: !!data.parking, breakfast: !!data.breakfast, pool: !!data.pool },
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}
