<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div class="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
        <RouterLink to="/home" class="text-gray-500 hover:text-gray-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </RouterLink>
        <h1 class="font-bold text-gray-900">{{ t.study }}</h1>
        <span class="text-xs text-gray-400 ml-auto">{{ total }} questions</span>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 py-6">
      <!-- Search & filter -->
      <div class="flex gap-3 mb-6">
        <input v-model="search" type="search" class="input flex-1" :placeholder="t.search" @input="loadQuestions" />
        <select v-model="categoryId" class="input w-40" @change="loadQuestions">
          <option value="">All Categories</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c['name_' + auth.language] || c.name_en }}</option>
        </select>
      </div>

      <!-- Questions list -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 5" :key="i" class="card animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div class="space-y-2">
            <div v-for="j in 4" :key="j" class="h-3 bg-gray-100 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div v-for="(q, i) in questions" :key="q.id" class="card">
          <div class="flex items-start gap-3 mb-4">
            <span class="flex-shrink-0 w-7 h-7 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-xs font-bold">
              {{ (page - 1) * limit + i + 1 }}
            </span>
            <p class="text-gray-900 font-medium text-sm leading-relaxed">{{ q.question }}</p>
          </div>

          <!-- Options — toggle reveal -->
          <div v-if="revealed[q.id]" class="space-y-2 ml-10">
            <div v-for="opt in q.options" :key="opt.letter"
              class="flex items-center gap-3 p-2.5 rounded-xl text-sm"
              :class="opt.is_correct ? 'bg-green-50 text-green-800 border border-green-200 font-medium' : 'bg-gray-50 text-gray-600'">
              <span class="w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                :class="opt.is_correct ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'">
                {{ opt.letter }}
              </span>
              {{ opt.text }}
            </div>
          </div>

          <button @click="toggleReveal(q.id)" class="ml-10 mt-3 text-xs font-semibold text-primary-600 hover:underline">
            {{ revealed[q.id] ? 'Hide Answer' : 'Show Answer' }}
          </button>

          <div class="flex items-center gap-2 mt-3 ml-10">
            <span v-if="q.category" class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{{ q.category }}</span>
            <span class="text-xs" :class="{
              'bg-green-50 text-green-600 px-2 py-0.5 rounded-full': q.difficulty === 'easy',
              'bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full': q.difficulty === 'medium',
              'bg-red-50 text-red-600 px-2 py-0.5 rounded-full': q.difficulty === 'hard'
            }">{{ q.difficulty }}</span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="total > limit" class="flex items-center justify-center gap-3 mt-8">
        <button @click="changePage(page - 1)" :disabled="page === 1" class="btn-secondary px-4 py-2 text-sm" :class="{ 'opacity-40': page === 1 }">← Prev</button>
        <span class="text-sm text-gray-600">Page {{ page }} of {{ Math.ceil(total / limit) }}</span>
        <button @click="changePage(page + 1)" :disabled="page >= Math.ceil(total / limit)" class="btn-secondary px-4 py-2 text-sm" :class="{ 'opacity-40': page >= Math.ceil(total / limit) }">Next →</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import api from '@/services/api'

const { t } = useI18n()
const auth = useAuthStore()

const questions = ref([])
const categories = ref([])
const revealed = ref({})
const loading = ref(true)
const search = ref('')
const categoryId = ref('')
const page = ref(1)
const limit = 15
const total = ref(0)

const loadQuestions = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/questions', {
      params: { lang: auth.language, category_id: categoryId.value || undefined, page: page.value, limit, search: search.value || undefined }
    })
    questions.value = data.questions
    total.value = data.total

    // Load options for each question
    await Promise.all(questions.value.map(async (q) => {
      if (!q.options) {
        const res = await api.get(`/questions/${q.id}`, { params: { lang: auth.language } })
        q.options = res.data.question.options
      }
    }))
  } catch {} finally {
    loading.value = false
  }
}

const toggleReveal = (id) => { revealed.value[id] = !revealed.value[id] }

const changePage = (p) => { page.value = p; loadQuestions() }

onMounted(async () => {
  const { data } = await api.get('/admin/categories').catch(() => ({ data: { categories: [] } }))
  categories.value = data.categories || []
  await loadQuestions()
})
</script>
