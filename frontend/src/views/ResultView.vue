<template>
  <div class="min-h-screen bg-gray-50 px-4 py-10">
    <div class="max-w-2xl mx-auto">
      <div v-if="!result" class="flex items-center justify-center min-h-64">
        <p class="text-gray-400">No result found.</p>
      </div>

      <template v-else>
        <!-- Result card -->
        <div class="card text-center mb-6 animate-slide-up"
          :class="result.passed ? 'border-2 border-green-200' : 'border-2 border-red-200'">

          <!-- Icon -->
          <div class="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
            :class="result.passed ? 'bg-green-100' : 'bg-red-100'">
            <svg v-if="result.passed" class="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div class="text-4xl font-black mb-1" :class="result.passed ? 'text-green-600' : 'text-red-600'">
            {{ result.passed ? t.passed : t.failed }}
          </div>

          <!-- Score circle -->
          <div class="my-6">
            <div class="inline-flex items-center justify-center w-36 h-36 rounded-full border-8 relative"
              :class="result.passed ? 'border-green-200' : 'border-red-200'">
              <div class="text-center">
                <div class="text-4xl font-black" :class="result.passed ? 'text-green-600' : 'text-red-600'">
                  {{ result.score.toFixed(0) }}%
                </div>
                <div class="text-xs text-gray-500">{{ t.score }}</div>
              </div>
            </div>
          </div>

          <p class="text-gray-600 mb-6 text-sm">
            {{ result.passed ? t.passMessage : t.failMessage }}
          </p>

          <!-- Stats row -->
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-gray-50 rounded-xl p-3">
              <div class="text-2xl font-bold text-gray-900">{{ result.correct_answers }}</div>
              <div class="text-xs text-gray-500">{{ t.correct }}</div>
            </div>
            <div class="bg-gray-50 rounded-xl p-3">
              <div class="text-2xl font-bold text-gray-900">{{ result.total_questions - result.correct_answers }}</div>
              <div class="text-xs text-gray-500">{{ t.incorrect }}</div>
            </div>
            <div class="bg-gray-50 rounded-xl p-3">
              <div class="text-2xl font-bold text-gray-900">{{ result.pass_mark }}%</div>
              <div class="text-xs text-gray-500">{{ t.passMark }}</div>
            </div>
          </div>

          <div class="flex gap-3">
            <RouterLink to="/home" class="btn-secondary flex-1">{{ t.home }}</RouterLink>
            <RouterLink to="/payment" class="btn-primary flex-1">{{ t.tryAgain }}</RouterLink>
          </div>
        </div>

        <!-- Question review -->
        <div class="card">
          <h3 class="font-bold text-gray-900 mb-4">Review Answers</h3>
          <div class="space-y-4">
            <div v-for="(item, i) in result.details" :key="i"
              class="p-4 rounded-xl border"
              :class="item.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'">
              <div class="flex items-start gap-2 mb-2">
                <span class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  :class="item.is_correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'">
                  {{ item.is_correct ? '✓' : '✗' }}
                </span>
                <p class="text-sm font-medium text-gray-800">{{ item['question_' + auth.language] || item.question_en }}</p>
              </div>
              <div class="ml-8 text-xs space-y-1">
                <div v-if="item.selected_option" class="text-gray-600">
                  Your answer: <span class="font-semibold" :class="item.is_correct ? 'text-green-700' : 'text-red-700'">
                    {{ item.selected_option }}
                  </span>
                </div>
                <div v-else class="text-amber-600 font-medium">Not answered</div>
                <div v-if="!item.is_correct" class="text-green-700">
                  Correct: <span class="font-semibold">{{ item.correct_option }} — {{ item['correct_' + auth.language] || item.correct_en }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useExamStore } from '@/stores/exam'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
const examStore = useExamStore()
const auth = useAuthStore()
const result = computed(() => examStore.result)
</script>
