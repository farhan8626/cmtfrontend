// ============================================================
//  src/api/client.ts
//  Centralized Axios instance with JWT request + 401 response interceptors
// ============================================================
import axios from 'axios'
import toast from 'react-hot-toast'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach JWT Bearer token ──────────────
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('cmt_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor: handle 401 (token expired) ─────────
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cmt_token')
      localStorage.removeItem('cmt_user')
      toast.error('Session expired. Please log in again.')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
