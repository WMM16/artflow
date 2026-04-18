import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = useAuthStore.getState().refreshToken

      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh', null, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          })

          const { access_token, refresh_token } = response.data
          useAuthStore.getState().setAuth(
            access_token,
            refresh_token,
            useAuthStore.getState().user
          )

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        } catch (refreshError) {
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (email, password, nickname) =>
    api.post('/auth/register', { email, password, nickname }),

  logout: () =>
    api.post('/auth/logout')
}

// User API
export const userApi = {
  getMe: () =>
    api.get('/users/me'),

  updateMe: (data) =>
    api.put('/users/me', data),

  changePassword: (oldPassword, newPassword) =>
    api.put('/users/password', { old_password: oldPassword, new_password: newPassword }),

  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  listUsers: (skip = 0, limit = 100) =>
    api.get(`/users?skip=${skip}&limit=${limit}`),

  updateUser: (userId, data) =>
    api.put(`/users/${userId}`, data)
}

// Generate API
export const generateApi = {
  generateFromText: (data) =>
    api.post('/generate/text', data),

  generateFromImage: (formData) =>
    api.post('/generate/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  generateText2Text: (data) =>
    api.post('/generate/text2text', data),

  getText2TextHistory: () =>
    api.get('/generate/text2text/history'),

  getTaskStatus: (taskId) =>
    api.get(`/generate/status/${taskId}`),

  reversePrompt: (formData) =>
    api.post('/generate/reverse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
}

// History API
export const historyApi = {
  getHistory: (params = {}) => {
    // 过滤掉 undefined 和 null 的参数
    const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value
      }
      return acc
    }, {})
    const query = new URLSearchParams(filteredParams).toString()
    return api.get(`/history?${query}`)
  },

  getStats: () =>
    api.get('/history/stats'),

  deleteHistory: (id) =>
    api.delete(`/history/${id}`),

  deleteBatch: (ids) =>
    api.delete('/history', { data: ids })
}

// Upgrade API
export const upgradeApi = {
  getPackages: () =>
    api.get('/upgrade/packages'),

  purchase: (packageId) =>
    api.post('/upgrade/purchase', { package_id: packageId })
}

// SubAccount API
export const subAccountApi = {
  getList: () =>
    api.get('/subaccounts'),

  getStats: () =>
    api.get('/subaccounts/stats/overview'),

  create: (data) =>
    api.post('/subaccounts', data),

  update: (id, data) =>
    api.put(`/subaccounts/${id}`, data),

  delete: (id) =>
    api.delete(`/subaccounts/${id}`)
}

export default api
