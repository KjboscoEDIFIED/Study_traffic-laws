<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Questions</h1>
      <button @click="openAdd" class="btn-primary text-sm">+ Add Question</button>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 mb-6">
      <input v-model="search" type="search" class="input flex-1 max-w-xs" placeholder="Search..." @input="load" />
      <select v-model="catFilter" class="input w-44" @change="load">
        <option value="">All Categories</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name_en }}</option>
      </select>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden p-0">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">#</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Question (EN)</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Category</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Difficulty</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading">
              <tr v-for="i in 8" :key="i" class="border-b border-gray-50">
                <td colspan="6" class="py-4 px-4"><div class="h-4 bg-gray-100 rounded animate-pulse"></div></td>
              </tr>
            </template>
            <tr v-for="(q, i) in questions" :key="q.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="py-3 px-4 text-gray-400 font-mono text-xs">{{ q.id }}</td>
              <td class="py-3 px-4 text-gray-800 max-w-sm">
                <div class="truncate max-w-xs">{{ q.question }}</div>
              </td>
              <td class="py-3 px-4">
                <span class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{{ q.category || '—' }}</span>
              </td>
              <td class="py-3 px-4">
                <span class="text-xs px-2 py-0.5 rounded-full capitalize"
                  :class="{
                    'bg-green-50 text-green-600': q.difficulty === 'easy',
                    'bg-yellow-50 text-yellow-600': q.difficulty === 'medium',
                    'bg-red-50 text-red-600': q.difficulty === 'hard',
                  }">{{ q.difficulty }}</span>
              </td>
              <td class="py-3 px-4">
                <span :class="q.is_active ? 'badge-pass' : 'badge-fail'">{{ q.is_active ? 'Active' : 'Inactive' }}</span>
              </td>
              <td class="py-3 px-4">
                <div class="flex gap-2">
                  <button @click="openEdit(q)" class="text-xs text-blue-600 hover:underline">Edit</button>
                  <button @click="toggleActive(q)" class="text-xs" :class="q.is_active ? 'text-red-500 hover:underline' : 'text-green-600 hover:underline'">
                    {{ q.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && !questions.length">
              <td colspan="6" class="py-10 text-center text-gray-400">No questions found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
        <span>{{ total }} total questions</span>
        <div class="flex gap-2">
          <button @click="changePage(page - 1)" :disabled="page === 1" class="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40">←</button>
          <span class="px-3 py-1">{{ page }}</span>
          <button @click="changePage(page + 1)" :disabled="page * limit >= total" class="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40">→</button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6 overflow-auto">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <h3 class="font-bold text-gray-900">{{ editing ? 'Edit Question' : 'Add Question' }}</h3>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="label">Question (English) *</label>
            <textarea v-model="form.question_en" class="input" rows="2"></textarea>
          </div>
          <div>
            <label class="label">Question (Kinyarwanda) *</label>
            <textarea v-model="form.question_rw" class="input" rows="2"></textarea>
          </div>
          <div>
            <label class="label">Question (Français) *</label>
            <textarea v-model="form.question_fr" class="input" rows="2"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Category</label>
              <select v-model="form.category_id" class="input">
                <option value="">None</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name_en }}</option>
              </select>
            </div>
            <div>
              <label class="label">Difficulty</label>
              <select v-model="form.difficulty" class="input">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <!-- Options -->
          <div>
            <label class="label mb-3">Answer Options *</label>
            <div class="space-y-3">
              <div v-for="opt in form.options" :key="opt.letter" class="border rounded-xl p-3">
                <div class="flex items-center gap-2 mb-2">
                  <span class="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-bold">{{ opt.letter }}</span>
                  <label class="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" :name="'correct_' + (editing?.id || 'new')" v-model="correctLetter" :value="opt.letter" />
                    Correct Answer
                  </label>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <input v-model="opt.en" placeholder="English" class="input text-xs py-2" />
                  <input v-model="opt.rw" placeholder="Kinyarwanda" class="input text-xs py-2" />
                  <input v-model="opt.fr" placeholder="Français" class="input text-xs py-2" />
                </div>
              </div>
            </div>
          </div>

          <p v-if="formError" class="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{{ formError }}</p>

          <div class="flex gap-3 pt-2">
            <button @click="showModal = false" class="btn-secondary flex-1">Cancel</button>
            <button @click="saveQuestion" class="btn-primary flex-1" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Question' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

const toast = useToast()
const questions = ref([])
const categories = ref([])
const loading = ref(true)
const search = ref('')
const catFilter = ref('')
const page = ref(1)
const limit = 20
const total = ref(0)
const showModal = ref(false)
const editing = ref(null)
const saving = ref(false)
const formError = ref('')
const correctLetter = ref('A')

const defaultOptions = () => [
  { letter: 'A', en: '', rw: '', fr: '' },
  { letter: 'B', en: '', rw: '', fr: '' },
  { letter: 'C', en: '', rw: '', fr: '' },
  { letter: 'D', en: '', rw: '', fr: '' },
]

const form = ref({ question_en: '', question_rw: '', question_fr: '', category_id: '', difficulty: 'medium', options: defaultOptions() })

const load = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/admin/questions', {
      params: { lang: 'en', page: page.value, limit, search: search.value || undefined, category_id: catFilter.value || undefined }
    })
    questions.value = data.questions
    total.value = data.total
  } finally { loading.value = false }
}

const changePage = (p) => { page.value = p; load() }

const openAdd = () => {
  editing.value = null
  form.value = { question_en: '', question_rw: '', question_fr: '', category_id: '', difficulty: 'medium', options: defaultOptions() }
  correctLetter.value = 'A'
  formError.value = ''
  showModal.value = true
}

const openEdit = (q) => {
  editing.value = q
  form.value = { question_en: q.question_en || q.question, question_rw: q.question_rw || '', question_fr: q.question_fr || '', category_id: q.category_id || '', difficulty: q.difficulty || 'medium', options: defaultOptions() }
  correctLetter.value = 'A'
  formError.value = ''
  showModal.value = true
}

const saveQuestion = async () => {
  formError.value = ''
  if (!form.value.question_en || !form.value.question_rw || !form.value.question_fr) {
    formError.value = 'All 3 language questions required'
    return
  }
  const opts = form.value.options.map((o) => ({ ...o, is_correct: o.letter === correctLetter.value }))

  saving.value = true
  try {
    if (editing.value) {
      await api.put(`/admin/questions/${editing.value.id}`, { ...form.value, options: opts })
    } else {
      await api.post('/admin/questions', { ...form.value, options: opts })
    }
    showModal.value = false
    toast.success('Question saved!')
    load()
  } catch (e) {
    formError.value = e.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}

const toggleActive = async (q) => {
  await api.put(`/admin/questions/${q.id}`, { is_active: !q.is_active })
  q.is_active = !q.is_active
}

onMounted(async () => {
  const { data } = await api.get('/admin/categories')
  categories.value = data.categories
  load()
})
</script>
