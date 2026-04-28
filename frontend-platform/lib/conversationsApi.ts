import api from './api'
import type {
  ConfirmedBooking,
  ConversationListItem,
  ConversationDetail,
  ConversationStats,
  ConversationCategory,
  ConversationStatus,
  Message,
} from './types'

export interface ListConversationsParams {
  hotel_id: number
  category?: ConversationCategory
  status?: ConversationStatus
  limit?: number
  offset?: number
}

export async function getConversations(params: ListConversationsParams): Promise<ConversationListItem[]> {
  const { data } = await api.get<ConversationListItem[]>('/api/conversations/', { params })
  return data
}

export async function getConversation(id: number): Promise<ConversationDetail> {
  const { data } = await api.get<ConversationDetail>(`/api/conversations/${id}`)
  return data
}

export async function getConversationStats(hotel_id: number): Promise<ConversationStats> {
  const { data } = await api.get<ConversationStats>('/api/conversations/stats', { params: { hotel_id } })
  return data
}

export async function getConversationMessages(
  id: number,
  params?: { limit?: number; offset?: number },
): Promise<Message[]> {
  const { data } = await api.get<Message[]>(`/api/conversations/${id}/messages`, { params })
  return data
}

export async function sendOperatorReply(
  conversationId: number,
  text: string,
): Promise<Message> {
  const { data } = await api.post<Message>(
    `/api/conversations/${conversationId}/operator-reply`,
    { text },
  )
  return data
}

export interface ConfirmBookingPayload {
  amount_usd: number
  nights: number
  notes?: string
}

export async function confirmBooking(
  conversationId: number,
  payload: ConfirmBookingPayload,
): Promise<ConfirmedBooking> {
  const { data } = await api.post<ConfirmedBooking>(
    `/api/conversations/${conversationId}/confirm-booking`,
    payload,
  )
  return data
}
