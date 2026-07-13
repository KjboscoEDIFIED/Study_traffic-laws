<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex flex-col items-center justify-center px-4 relative overflow-hidden">
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-primary-600 rounded-full opacity-20 blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-500 rounded-full opacity-20 blur-3xl"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white rounded-full opacity-5 blur-3xl"></div>
    </div>

    <div class="relative z-10 w-full max-w-md animate-fade-in">
      <!-- Logo -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-5">
          <svg class="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Rwanda Traffic Law</h1>
        <p class="text-primary-200 text-sm">Provisional Driving Licence Exam System</p>
      </div>

      <!-- Language Selection Card -->
      <div class="bg-white rounded-3xl shadow-2xl p-8">
        <h2 class="text-xl font-bold text-gray-800 text-center mb-6">
          {{ selectedLang === 'en' ? 'Select Your Language' : selectedLang === 'rw' ? 'Hitamo Ururimi Rwawe' : 'Choisissez Votre Langue' }}
        </h2>

        <div class="space-y-3 mb-8">
          <button
            v-for="lang in languages"
            :key="lang.code"
            @click="selectedLang = lang.code"
            class="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200"
            :class="selectedLang === lang.code
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-100 bg-gray-50 hover:border-gray-200 text-gray-700'"
          >
            <span class="text-3xl">{{ lang.flag }}</span>
            <div class="text-left">
              <div class="font-semibold">{{ lang.label }}</div>
              <div class="text-xs text-gray-500">{{ lang.native }}</div>
            </div>
            <div class="ml-auto">
              <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                :class="selectedLang === lang.code ? 'border-primary-500 bg-primary-500' : 'border-gray-300'">
                <div v-if="selectedLang === lang.code" class="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </button>
        </div>

        <button @click="proceed" class="btn-primary w-full text-base py-4 rounded-2xl">
          <span>{{ selectedLang === 'en' ? 'Continue' : selectedLang === 'rw' ? 'Komeza' : 'Continuer' }}</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>

      <!-- Footer -->
      <p class="text-center text-primary-300 text-xs mt-6">
        © {{ new Date().getFullYear() }} Rwanda Traffic Authority
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const selectedLang = ref(auth.language || 'en')

const languages = [
  { code: 'en', label: 'English', native: 'Select this language', flag: '🇬🇧' },
  { code: 'rw', label: 'Kinyarwanda', native: 'Hitamo ururimi rwawe', flag: '🇷🇼' },
  { code: 'fr', label: 'Français', native: 'Choisissez cette langue', flag: '🇫🇷' },
]

const proceed = () => {
  auth.setLanguage(selectedLang.value)
  if (auth.isLoggedIn) {
    router.push(auth.isAdmin ? '/admin/dashboard' : '/home')
  } else {
    router.push('/login')
  }
}
</script>
