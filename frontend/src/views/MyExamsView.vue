<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div class="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
        <RouterLink to="/home" class="text-gray-500 hover:text-gray-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </RouterLink>
        <h1 class="font-bold text-gray-900">{{ t.myExams }}</h1>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 py-6">
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 5" :key="i" class="card animate-pulse h-20"></div>
      </div>

      <div v-else-if="!exams.length" class="text-center py-20">
        <svg class="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p class="text-gray-500">No exams taken yet.</p>
        <RouterLink to="/payment" class="btn-primary mt-4 inline-flex">Start your first exam</RouterLink>
      </div>

      <div v-else class="space-y-4">
        <div v-for="exam in exams" :key="exam.id" class="card">
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span :class="exam.passed ? 'badge-pass' : 'badge-fail'">
                  {{ exam.passed ? t.passed : t.failed }}
                </span>
                <span class="text-xs text-gray-400">{{ exam.language?.toUpperCase() }}</span>
              </div>
              <div class="text-2xl font-black" :class="exam.passed ? 'text-green-600' : 'text-red-600'">
                {{ exam.score?.toFixed(0) }}%
              </div>
              <div class="text-sm text-gray-500 mt-1">
                {{ exam.correct_answers }} / {{ exam.total_questions }} correct
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-400">{{ formatDate(exam.completed_at || exam.started_at) }}</div>
              <div class="text-xs text-gray-300 mt-1">Exam #{{ exam.id }}</div>
              <div class="mt-2">
                <span v-if="exam.status === 'in_progress'" class="badge-pending">In Progress</span>
              </div>
            </div>
          </div>

          <!-- Score bar -->
          <div class="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all" :style="{ width: `${exam.score}%` }"
              :class="exam.passed ? 'bg-green-400' : 'bg-red-400'"></div>
          </div>
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>Pass: {{ exam.pass_mark }}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from '@/composables/useI18n'
import api from '@/services/api'

const { t } = useI18n()
const exams = ref([])
const loading = ref(true)

const formatDate = (dt) => dt ? new Date(dt).toLocaleString() : '—'

onMounted(async () => {
  try {
    const { data } = await api.get('/exams/my-exams')
    exams.value = data.exams
  } catch {} finally {
    loading.value = false
  }
})
</script>
