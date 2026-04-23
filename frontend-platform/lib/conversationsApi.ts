import api from './api'
import type {
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
