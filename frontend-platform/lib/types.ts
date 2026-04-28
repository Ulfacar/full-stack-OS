export interface RoomCategory {
  name: string
  count: number
  capacity: number
  description?: string
  price?: number
  maxGuests?: number
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
  breakfast?: boolean
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
  excursions?: boolean
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
  // Bot personality
  proactiveness: 'active' | 'balanced' | 'reserved'
  notAvailable: string
  restaurantMenu: string  // меню/цены ресторана
  nearbyPlaces: string  // что рядом с отелем
  // PMS (#21) — drives prompt branching
  pmsKind: 'none' | 'exely' | 'altegio' | 'shelter' | 'custom'
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
  price?: number
  maxGuests?: number
  rooms?: RoomCategory[]
  rules?: HotelRules
  amenities?: HotelAmenities
  telegram_bot_token?: string
  has_telegram_bot: boolean
  ai_model: string
  system_prompt?: string
  staging_prompt?: string | null
  pms_kind?: 'none' | 'exely' | 'altegio' | 'shelter' | 'custom'
  communication_style: string
  languages: string[]
  is_active: boolean
  monthly_budget: number
  status: 'demo' | 'active' | 'suspended'
  activated_at?: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  name: string
  email: string
  is_active: boolean
}

export type UserRole = 'admin' | 'sales'

export interface CurrentUser {
  id: number
  name: string
  email: string
  role: UserRole
  is_active: boolean
}

export interface Lead {
  id: number
  status: 'pending' | 'configuring' | 'active' | 'rejected'
  hotel_name: string
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  form_data: Record<string, any> | null
  generated_prompt: string | null
  hotel_id: number | null
  created_by_user_id: number | null
  created_at: string
  updated_at: string | null
}

export interface SalesStats {
  total: number
  pending: number
  configuring: number
  active: number
  rejected: number
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

// Conversations admin (#27)
export type ConversationStatus = 'active' | 'needs_operator' | 'operator_active' | 'completed'
export type ConversationCategory = 'booking' | 'hotel' | 'service' | 'general'
export type MessageSender = 'client' | 'bot' | 'operator'

export interface ClientPreview {
  id: number
  name: string | null
  telegram_username: string | null
  whatsapp_phone: string | null
  language: string | null
}

export interface ConversationListItem {
  id: number
  status: ConversationStatus
  channel: 'telegram' | 'whatsapp' | null
  category: ConversationCategory | null
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  assigned_user_id: number | null
  created_at: string
  updated_at: string | null
  client: ClientPreview
}

export interface ConversationDetail extends ConversationListItem {
  operator_telegram_id: string | null
  total_messages: number
}

export interface Message {
  id: number
  sender: MessageSender | null
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export interface ConversationStats {
  total: number
  unread_total: number
  by_category: Partial<Record<ConversationCategory | 'uncategorized', number>>
  by_status: Partial<Record<ConversationStatus, number>>
}

export interface ConfirmedBooking {
  id: number
  conversation_id: number
  hotel_id: number
  amount_usd: number
  nights: number
  notes: string | null
  confirmed_by_user_id: number
  confirmed_at: string
}

// Hotel with extended stats for admin dashboard
export interface HotelWithStats extends Hotel {
  budget_used: number
  budget_remaining: number
  conversations_month: number
  active_conversations: number
  ai_cost_month: number
  last_activity: string | null
  requests_handled: number
}
