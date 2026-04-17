import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,

      setAuth: (token, refreshToken, user) => {
        set({ token, refreshToken, user })
      },

      setUser: (user) => {
        set({ user })
      },

      updateQuota: (used, daily) => {
        const { user } = get()
        if (user) {
          set({
            user: {
              ...user,
              quota_used: used,
              quota_daily: daily
            }
          })
        }
      },

      logout: () => {
        set({ token: null, refreshToken: null, user: null })
      },

      isAdmin: () => {
        const { user } = get()
        return user?.is_admin || false
      }
    }),
    {
      name: 'artflow-auth'
    }
  )
)
