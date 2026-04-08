export interface RoomCategory {
  name: string
  count: number
  capacity: number
  description?: string
}

export interface Season {
  name: string
  dateFrom: string
  dateTo: string
}

export interface SeasonPrice {
  seasonIndex: number
  roomIndex: number
  guests: number
  price: number
}

export interface HotelRules {
  checkin?: string
  checkout?: string
  cancellation?: string
  prepayment?: string
  paymentCards?: boolean
  paymentQR?: boolean
  paymentCash?: boolean
  paymentTransfer?: boolean
  transferDetails?: string
  pets?: string
  smoking?: string
}

export interface HotelAmenities {
  wifi?: boolean
  parking?: boolean
  pool?: boolean
  restaurant?: boolean
  restaurantCapacity?: string
  conference?: boolean
  conferenceCapacity?: string
  conferencePrice?: string
  sauna?: boolean
  playground?: boolean
  beach?: boolean
  transfer?: boolean
  transferCost?: string
  other?: string
}

export interface HotelFormData {
  // Шаг 1: Об отеле
  name: string
  location: string
  description: string
  managerName: string
  phone: string
  email: string
  googleMapsLink: string
  website: string
  // Шаг 2: Номера и цены
  rooms: RoomCategory[]
  seasons: Season[]
  seasonPrices: SeasonPrice[]
  breakfastIncluded: boolean
  mealCost: string
  childrenFreeAge: string
  // Шаг 3: Правила
  rules: HotelRules
  // Шаг 4: Удобства и настройки бота
  amenities: HotelAmenities
  howToGet: string
  communicationStyle: string
  languages: string[]
  botRestrictions: string
  specialOffers: string
  // Технические (не для клиента)
  aiModel: string
  systemPrompt: string
  telegramBotToken: string
  whatsappPhone: string
  // Legacy compat
  address?: string
}

export interface Hotel {
  id: number
  name: string
  slug: string
  address?: string
  phone?: string
  email?: string
  website?: string
  description?: string
  rooms?: RoomCategory[]
  rules?: HotelRules
  amenities?: HotelAmenities
  telegram_bot_token?: string
  ai_model: string
  system_prompt?: string
  communication_style: string
  languages: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  name: string
  email: string
  is_active: boolean
}

// AI Usage tracking
export interface AIUsageStats {
  hotel_id: number
  hotel_name: string
  total_conversations: number
  active_conversations: number
  ai_cost_month: number
  last_activity: string | null
}

export interface AdminStats {
  total_hotels: number
  active_hotels: number
  total_conversations_month: number
  total_ai_cost_month: number
  openrouter_balance: number
}

export interface AIUsageDetail {
  date: string
  conversations: number
  prompt_tokens: number
  completion_tokens: number
  cost: number
}

// Billing
export interface BillingRecord {
  id: number
  hotel_id: number
  hotel_name: string
  month: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  paid_at: string | null
  created_at: string
}

// Hotel with extended stats for admin dashboard
export interface HotelWithStats extends Hotel {
  conversations_month: number
  active_conversations: number
  ai_cost_month: number
  last_activity: string | null
  requests_handled: number
}
