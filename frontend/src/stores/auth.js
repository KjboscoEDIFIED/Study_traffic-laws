import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || null)
  const language = ref(localStorage.getItem('lang') || 'en')

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const setAuth = (u, t) => {
    user.value = u
    token.value = t
    localStorage.setItem('user', JSON.stringify(u))
    localStorage.setItem('token', t)
    if (u.preferred_language) {
      language.value = u.preferred_language
      localStorage.setItem('lang', u.preferred_language)
    }
  }

  const setLanguage = (lang) => {
    language.value = lang
    localStorage.setItem('lang', lang)
    if (user.value) {
      api.put('/auth/language', { language: lang }).catch(() => {})
    }
  }

  const login = async (phone, password) => {
    const { data } = await api.post('/auth/login', { phone, password })
    setAuth(data.user, data.token)
    return data.user
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    setAuth(data.user, data.token)
    return data.user
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me')
      user.value = data.user
      localStorage.setItem('user', JSON.stringify(data.user))
    } catch {}
  }

  return { user, token, language, isLoggedIn, isAdmin, login, register, logout, setLanguage, refreshUser }
})
