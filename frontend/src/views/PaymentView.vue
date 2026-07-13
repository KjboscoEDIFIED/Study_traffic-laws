<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md animate-slide-up">
      <div class="text-center mb-6">
        <RouterLink to="/home" class="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">{{ t.paymentTitle }}</h1>
      </div>

      <!-- Step 1: Enter phone -->
      <div v-if="step === 'form'" class="card">
        <!-- MoMo logo area -->
        <div class="flex items-center justify-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div class="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center font-black text-yellow-900 text-xs">MTN</div>
          <div>
            <div class="font-bold text-gray-800">MTN Mobile Money</div>
            <div class="text-xs text-gray-500">Secure payment via MoMo</div>
          </div>
          <div class="ml-auto text-2xl font-black text-yellow-600">100 RWF</div>
        </div>

        <p class="text-sm text-gray-600 mb-5">{{ t.paymentDesc }}</p>

        <div class="mb-5">
          <label class="label">{{ t.paymentPhone }}</label>
          <input v-model="phone" type="tel" class="input" placeholder="07X XXX XXXX" />
          <p class="text-xs text-gray-400 mt-1">Enter your MTN number that will receive the payment prompt</p>
        </div>

        <p v-if="error" class="text-red-600 text-sm bg-red-50 p-3 rounded-xl mb-4">{{ error }}</p>

        <button @click="initiatePayment" class="btn-primary w-full" :disabled="!phone || loading">
          <svg v-if="loading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          {{ loading ? 'Sending...' : t.payNow }}
        </button>
      </div>

      <!-- Step 2: Waiting for payment -->
      <div v-else-if="step === 'waiting'" class="card text-center">
        <div class="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg class="w-10 h-10 text-yellow-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
        <h3 class="font-bold text-gray-900 text-lg mb-2">{{ t.waitingPayment }}</h3>
        <p class="text-gray-500 text-sm mb-2">Check your phone <strong>{{ phone }}</strong> for MoMo prompt</p>
        <p class="text-gray-400 text-xs mb-6">Approve the payment of <strong>100 RWF</strong> on your phone</p>

        <div class="bg-gray-50 rounded-xl p-4 mb-6">
          <div class="flex justify-between text-sm mb-2">
            <span class="text-gray-500">Checking status...</span>
            <span class="text-gray-700 font-mono">{{ pollCount }}/{{ maxPolls }}</span>
          </div>
          <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-full bg-primary-500 rounded-full transition-all duration-1000" :style="{ width: `${(pollCount / maxPolls) * 100}%` }"></div>
          </div>
        </div>

        <button @click="cancelPayment" class="btn-secondary w-full text-sm">Cancel</button>
      </div>

      <!-- Step 3: Success -->
      <div v-else-if="step === 'success'" class="card text-center">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="font-bold text-gray-900 text-xl mb-2">{{ t.paymentSuccess }}</h3>
        <p class="text-gray-500 text-sm mb-6">Payment of 100 RWF confirmed. Your exam is ready!</p>
        <button @click="startExam" class="btn-primary w-full text-base py-4" :disabled="starting">
          {{ starting ? 'Starting...' : t.startExam }}
        </button>
      </div>

      <!-- Step 4: Failed -->
      <div v-else-if="step === 'failed'" class="card text-center">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="font-bold text-gray-900 text-xl mb-2">{{ t.paymentFailed }}</h3>
        <p class="text-gray-500 text-sm mb-6">{{ failReason || 'Payment was not completed.' }}</p>
        <button @click="resetForm" class="btn-primary w-full">Try Again</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useExamStore } from '@/stores/exam'
import { useI18n } from '@/composables/useI18n'
import api from '@/services/api'

const { t } = useI18n()
const auth = useAuthStore()
const examStore = useExamStore()
const router = useRouter()

const phone = ref(auth.user?.phone || '')
const step = ref('form')
const loading = ref(false)
const starting = ref(false)
const error = ref('')
const paymentId = ref(null)
const pollCount = ref(0)
const maxPolls = ref(20) // poll for 60s (20 * 3s)
const failReason = ref('')
let pollInterval = null

const initiatePayment = async () => {
  if (!phone.value) return
  error.value = ''
  loading.value = true
  try {
    const { data } = await api.post('/payments/initiate', { phone: phone.value })
    paymentId.value = data.paymentId
    step.value = 'waiting'
    startPolling()
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to initiate payment'
  } finally {
    loading.value = false
  }
}

/*const initiatePayment = async () => {
  if (!phone.value) return
  loading.value = true
  try {
    // Create a fake payment record for testing
    const { data } = await api.post('/payments/initiate', { phone: phone.value })
    paymentId.value = data.paymentId
    // Skip MoMo polling — go straight to success for testing
    step.value = 'success'
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed'
  } finally {
    loading.value = false
  }
}*/

const startPolling = () => {
  pollCount.value = 0
  pollInterval = setInterval(async () => {
    pollCount.value++
    try {
      const { data } = await api.get(`/payments/${paymentId.value}/status`)
      const status = data.payment.status
      if (status === 'successful') {
        clearInterval(pollInterval)
        step.value = 'success'
      } else if (status === 'failed' || status === 'cancelled') {
        clearInterval(pollInterval)
        failReason.value = data.payment.failure_reason || ''
        step.value = 'failed'
      }
    } catch {}

    if (pollCount.value >= maxPolls.value) {
      clearInterval(pollInterval)
      if (step.value === 'waiting') {
        failReason.value = 'Payment timed out. Please check your phone and try again.'
        step.value = 'failed'
      }
    }
  }, 300000)
}

const cancelPayment = () => {
  clearInterval(pollInterval)
  resetForm()
}

const resetForm = () => {
  step.value = 'form'
  paymentId.value = null
  pollCount.value = 0
  failReason.value = ''
}

const startExam = async () => {
  starting.value = true
  try {
    const examId = await examStore.startExam(paymentId.value, auth.language)
    router.push(`/exam/${examId}`)
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to start exam'
    step.value = 'form'
  } finally {
    starting.value = false
  }
}
</script>
