<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-500">Loading exam...</p>
      </div>
    </div>

    <template v-else-if="questions.length">
      <!-- Header bar -->
      <div class="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div class="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="text-sm font-medium text-gray-600">
              {{ t.question }} <span class="text-primary-600 font-bold">{{ currentIndex + 1 }}</span> {{ t.of }} {{ questions.length }}
            </div>
          </div>

          <!-- Timer -->
          <div class="flex items-center gap-2 font-mono font-bold text-lg"
            :class="timeLeft <= 120 ? 'text-red-500 timer-warning' : 'text-gray-800'">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ formatTime(timeLeft) }}
          </div>

          <button @click="confirmFinish" class="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl font-medium hover:bg-red-100 transition-colors">
            {{ t.finish }}
          </button>
        </div>

        <!-- Progress bar -->
        <div class="h-1 bg-gray-100">
          <div class="h-full bg-primary-500 transition-all duration-300"
            :style="{ width: `${((currentIndex + 1) / questions.length) * 100}%` }"></div>
        </div>
      </div>

      <!-- Question -->
      <div class="max-w-2xl mx-auto px-4 py-6">
        <div class="card mb-4 animate-fade-in" :key="currentIndex">
          <!-- Question image -->
          <img v-if="currentQ.image_url" :src="currentQ.image_url" alt="Question image"
            class="w-full h-48 object-contain rounded-xl bg-gray-50 mb-4" />

          <div class="flex items-start gap-3 mb-6">
            <span class="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center text-sm font-bold">
              {{ currentIndex + 1 }}
            </span>
            <p class="text-gray-900 font-medium leading-relaxed text-base pt-1">{{ currentQ.question_text }}</p>
          </div>

          <!-- Options -->
          <div class="space-y-3">
            <button v-for="opt in currentQ.options" :key="opt.letter"
              @click="selectAnswer(opt.letter)"
              class="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150"
              :class="getOptionClass(opt.letter)">
              <span class="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold border-2 transition-colors"
                :class="getLetterClass(opt.letter)">
                {{ opt.letter }}
              </span>
              <span class="text-sm font-medium leading-relaxed">{{ opt.text }}</span>
            </button>
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex gap-3">
          <button @click="prev" :disabled="currentIndex === 0"
            class="btn-secondary flex-1" :class="{ 'opacity-40 cursor-not-allowed': currentIndex === 0 }">
            ← Prev
          </button>

          <button v-if="currentIndex < questions.length - 1" @click="next" class="btn-primary flex-1">
            {{ t.next }} →
          </button>
          <button v-else @click="confirmFinish" class="btn-primary flex-1 bg-green-600 hover:bg-green-700">
            {{ t.finish }} ✓
          </button>
        </div>

        <!-- Question dots navigator -->
        <div class="mt-5 flex flex-wrap gap-2 justify-center">
          <button v-for="(q, i) in questions" :key="i"
            @click="goTo(i)"
            class="w-8 h-8 rounded-lg text-xs font-bold border transition-all"
            :class="i === currentIndex
              ? 'bg-primary-600 text-white border-primary-600'
              : examStore.answers[q.exam_question_id]
                ? 'bg-primary-100 text-primary-700 border-primary-200'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'">
            {{ i + 1 }}
          </button>
        </div>

        <!-- Answer stats -->
        <div class="mt-4 flex justify-center gap-4 text-xs text-gray-500">
          <span class="flex items-center gap-1">
            <span class="w-3 h-3 rounded bg-primary-100 border border-primary-200 inline-block"></span>
            Answered: {{ answeredCount }}
          </span>
          <span class="flex items-center gap-1">
            <span class="w-3 h-3 rounded bg-white border border-gray-200 inline-block"></span>
            Remaining: {{ questions.length - answeredCount }}
          </span>
        </div>
      </div>
    </template>

    <!-- Confirm finish modal -->
    <div v-if="showConfirm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up">
        <h3 class="font-bold text-gray-900 text-lg mb-2">{{ t.confirmFinish }}</h3>
        <p v-if="unanswered > 0" class="text-amber-600 text-sm mb-4">
          ⚠️ You have <strong>{{ unanswered }}</strong> {{ t.unanswered }}.
        </p>
        <p v-else class="text-green-600 text-sm mb-4">✅ All questions answered!</p>
        <div class="flex gap-3">
          <button @click="showConfirm = false" class="btn-secondary flex-1">{{ t.cancel }}</button>
          <button @click="submitExam" class="btn-primary flex-1" :disabled="finishing">
            {{ finishing ? 'Submitting...' : t.finish }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExamStore } from '@/stores/exam'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const examStore = useExamStore()
const auth = useAuthStore()

const loading = ref(true)
const currentIndex = ref(0)
const showConfirm = ref(false)
const finishing = ref(false)
const timeLeft = ref(30 * 60) // 30 minutes
let timer = null
let questionStartTime = Date.now()

const questions = computed(() => examStore.questions)
const currentQ = computed(() => questions.value[currentIndex.value])
const answeredCount = computed(() => Object.keys(examStore.answers).length)
const unanswered = computed(() => questions.value.length - answeredCount.value)

const formatTime = (s) => {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

const getOptionClass = (letter) => {
  const selected = examStore.answers[currentQ.value?.exam_question_id] === letter
  return selected
    ? 'border-primary-500 bg-primary-50 text-primary-800'
    : 'border-gray-100 bg-gray-50 hover:border-primary-200 hover:bg-primary-50/30 text-gray-700'
}

const getLetterClass = (letter) => {
  const selected = examStore.answers[currentQ.value?.exam_question_id] === letter
  return selected
    ? 'border-primary-500 bg-primary-500 text-white'
    : 'border-gray-300 text-gray-500'
}

const selectAnswer = async (letter) => {
  const q = currentQ.value
  const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
  await examStore.submitAnswer(route.params.examId, q.exam_question_id, letter, timeSpent)
}

const next = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    questionStartTime = Date.now()
  }
}

const prev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    questionStartTime = Date.now()
  }
}

const goTo = (i) => {
  currentIndex.value = i
  questionStartTime = Date.now()
}

const confirmFinish = () => { showConfirm.value = true }

const submitExam = async () => {
  finishing.value = true
  clearInterval(timer)
  try {
    await examStore.finishExam(route.params.examId)
    router.push('/result')
  } catch (e) {
    finishing.value = false
  }
}

onMounted(async () => {
  try {
    await examStore.loadQuestions(route.params.examId, auth.language)
  } catch {
    router.push('/home')
    return
  } finally {
    loading.value = false
  }

  // Start countdown timer
  timer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearInterval(timer)
      submitExam()
    }
  }, 1000)
})

onUnmounted(() => clearInterval(timer))
</script>
