import api from './api'
import type { Lead, SalesStats } from './types'

export async function getLeads(params?: { status?: string; limit?: number; offset?: number }): Promise<Lead[]> {
  const { data } = await api.get<Lead[]>('/sales/leads', { params })
  return data
}

export async function getLead(id: number): Promise<Lead> {
  const { data } = await api.get<Lead>(`/sales/leads/${id}`)
  return data
}

export async function getSalesStats(): Promise<SalesStats> {
  const { data } = await api.get<SalesStats>('/sales/stats')
  return data
}
