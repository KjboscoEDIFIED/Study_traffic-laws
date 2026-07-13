<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md animate-slide-up">
      <div class="text-center mb-8">
        <RouterLink to="/" class="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 hover:bg-primary-700 transition-colors">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">{{ t.register }}</h1>
        <p class="text-gray-500 text-sm mt-1">{{ t.appName }}</p>
      </div>

      <div class="card">
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="label">{{ t.fullName }}</label>
            <input v-model="form.full_name" type="text" class="input" required />
          </div>
          <div>
            <label class="label">{{ t.phone }}</label>
            <input v-model="form.phone" type="tel" class="input" placeholder="07X XXX XXXX" required />
          </div>
          <div>
            <label class="label">{{ t.email }}</label>
            <input v-model="form.email" type="email" class="input" />
          </div>
          <div>
            <label class="label">{{ t.password }}</label>
            <input v-model="form.password" type="password" class="input" required minlength="6" />
          </div>

          <p v-if="error" class="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{{ error }}</p>

          <button type="submit" class="btn-primary w-full" :disabled="loading">
            {{ loading ? '...' : t.register }}
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-gray-500">
          {{ t.hasAccount }}
          <RouterLink to="/login" class="font-semibold text-primary-600 hover:underline ml-1">{{ t.login }}</RouterLink>
        </div>
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

const form = ref({ full_name: '', phone: '', email: '', password: '' })
const error = ref('')
const loading = ref(false)

const handleRegister = async () => {
  error.value = ''
  loading.value = true
  try {
    await auth.register({ ...form.value, preferred_language: auth.language })
    toast.success('Account created! Welcome.')
    router.push('/home')
  } catch (e) {
    error.value = e.response?.data?.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>
