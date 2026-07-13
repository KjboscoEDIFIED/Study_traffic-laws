<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md animate-slide-up">
      <!-- Header -->
      <div class="text-center mb-8">
        <RouterLink to="/" class="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 hover:bg-primary-700 transition-colors">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">{{ t.login }}</h1>
        <p class="text-gray-500 text-sm mt-1">{{ t.appName }}</p>
      </div>

      <div class="card">
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="label">{{ t.phone }}</label>
            <input v-model="form.phone" type="tel" class="input" placeholder="07X XXX XXXX" required autocomplete="tel" />
          </div>
          <div>
            <label class="label">{{ t.password }}</label>
            <div class="relative">
              <input v-model="form.password" :type="showPw ? 'text' : 'password'" class="input pr-12" required autocomplete="current-password" />
              <button type="button" @click="showPw = !showPw" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="!showPw" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <p v-if="error" class="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{{ error }}</p>

          <button type="submit" class="btn-primary w-full" :disabled="loading">
            <svg v-if="loading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ loading ? '...' : t.login }}
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-gray-500">
          {{ t.noAccount }}
          <RouterLink to="/register" class="font-semibold text-primary-600 hover:underline ml-1">{{ t.register }}</RouterLink>
        </div>
      </div>

      <!-- Language switcher -->
      <div class="flex justify-center gap-3 mt-4">
        <button v-for="l in langs" :key="l.code" @click="auth.setLanguage(l.code)"
          class="text-xs px-3 py-1 rounded-full transition-colors"
          :class="auth.language === l.code ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'">
          {{ l.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import { useToast } from 'vue-toastification'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const form = ref({ phone: '', password: '' })
const error = ref('')
const loading = ref(false)
const showPw = ref(false)
const langs = [{ code: 'en', label: 'EN' }, { code: 'rw', label: 'RW' }, { code: 'fr', label: 'FR' }]

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  try {
    const user = await auth.login(form.value.phone, form.value.password)
    toast.success(`${t.value.welcomeBack}, ${user.full_name}!`)
    router.push(user.role === 'admin' ? '/admin/dashboard' : '/home')
  } catch (e) {
    error.value = e.response?.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
