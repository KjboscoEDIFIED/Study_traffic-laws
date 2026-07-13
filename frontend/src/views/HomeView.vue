<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top navbar -->
    <nav class="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span class="font-bold text-gray-900 text-sm hidden sm:block">{{ t.appName }}</span>
        </div>

        <div class="flex items-center gap-2">
          <!-- Language switcher -->
          <div class="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button v-for="l in langs" :key="l.code" @click="auth.setLanguage(l.code)"
              class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all"
              :class="auth.language === l.code ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
              {{ l.code.toUpperCase() }}
            </button>
          </div>

          <div class="w-8 h-8 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center font-bold text-sm">
            {{ auth.user?.full_name?.charAt(0) }}
          </div>

          <button @click="handleLogout" class="text-gray-500 hover:text-red-500 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </nav>

    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Welcome banner -->
      <div class="bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl p-6 text-white mb-8 relative overflow-hidden">
        <div class="absolute right-0 top-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
        <h2 class="text-xl font-bold mb-1">{{ t.welcomeBack }}, {{ auth.user?.full_name?.split(' ')[0] }}! 👋</h2>
        <p class="text-primary-100 text-sm">{{ t.tagline }}</p>
      </div>

      <!-- Main actions -->
      <div class="grid sm:grid-cols-2 gap-4 mb-8">
        <RouterLink to="/payment"
          class="card hover:shadow-md transition-shadow cursor-pointer group border-2 border-transparent hover:border-primary-200">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors flex-shrink-0">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-gray-900">{{ t.startExam }}</h3>
              <p class="text-sm text-gray-500">{{ t.examPrice }} • 20 questions • 30 min</p>
            </div>
          </div>
        </RouterLink>

        <RouterLink to="/study"
          class="card hover:shadow-md transition-shadow cursor-pointer group border-2 border-transparent hover:border-blue-200">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-gray-900">{{ t.study }}</h3>
              <p class="text-sm text-gray-500">Free • Browse all questions</p>
            </div>
          </div>
        </RouterLink>
      </div>

      <!-- Recent Exams -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-gray-900">{{ t.myExams }}</h3>
          <RouterLink to="/my-exams" class="text-sm text-primary-600 hover:underline">View all</RouterLink>
        </div>

        <div v-if="loading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
        </div>

        <div v-else-if="exams.length === 0" class="text-center py-8 text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p class="text-sm">No exams yet. Start your first exam!</p>
        </div>

        <div v-else class="space-y-3">
          <div v-for="exam in exams.slice(0, 5)" :key="exam.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <div class="text-sm font-medium text-gray-900">
                {{ exam.score?.toFixed(0) }}% — {{ exam.correct_answers }}/{{ exam.total_questions }} correct
              </div>
              <div class="text-xs text-gray-500">{{ formatDate(exam.completed_at || exam.started_at) }}</div>
            </div>
            <span :class="exam.passed ? 'badge-pass' : 'badge-fail'">
              {{ exam.passed ? t.passed : t.failed }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import api from '@/services/api'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const exams = ref([])
const loading = ref(true)
const langs = [{ code: 'en' }, { code: 'rw' }, { code: 'fr' }]

const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString() : '—'

const handleLogout = () => {
  auth.logout()
  router.push('/')
}

onMounted(async () => {
  try {
    const { data } = await api.get('/exams/my-exams')
    exams.value = data.exams
  } catch {} finally {
    loading.value = false
  }
})
</script>
