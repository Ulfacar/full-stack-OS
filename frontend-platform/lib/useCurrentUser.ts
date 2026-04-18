'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import api from './api'
import type { CurrentUser } from './types'

interface CurrentUserState {
  user: CurrentUser | null
  loading: boolean
  fetched: boolean
  fetch: () => Promise<void>
  clear: () => void
}

const useStore = create<CurrentUserState>((set, get) => ({
  user: null,
  loading: false,
  fetched: false,
  fetch: async () => {
    if (get().loading) return
    set({ loading: true })
    try {
      const { data } = await api.get<CurrentUser>('/auth/me')
      set({ user: data, loading: false, fetched: true })
    } catch {
      set({ user: null, loading: false, fetched: true })
    }
  },
  clear: () => set({ user: null, fetched: false }),
}))

export function useCurrentUser() {
  const { user, loading, fetched, fetch } = useStore()

  useEffect(() => {
    if (!fetched && !loading && typeof window !== 'undefined' && localStorage.getItem('token')) {
      fetch()
    }
  }, [fetched, loading, fetch])

  return {
    user,
    loading: loading || !fetched,
    isAdmin: user?.role === 'admin',
    isSales: user?.role === 'sales',
    refresh: fetch,
  }
}

export function clearCurrentUser() {
  useStore.getState().clear()
}
