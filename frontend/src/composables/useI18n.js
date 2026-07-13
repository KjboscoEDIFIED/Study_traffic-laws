import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { translations } from '@/locales/translations'

export function useI18n() {
  const auth = useAuthStore()
  const t = computed(() => translations[auth.language] || translations['en'])
  return { t }
}
