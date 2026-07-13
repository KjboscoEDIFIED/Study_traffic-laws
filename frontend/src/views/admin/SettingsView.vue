<template>
  <div class="p-6 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">System Settings</h1>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 6" :key="i" class="card animate-pulse h-16"></div>
    </div>

    <form v-else @submit.prevent="save" class="space-y-6">
      <!-- Exam settings -->
      <div class="card">
        <h2 class="font-bold text-gray-900 mb-4">Exam Configuration</h2>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="label">Exam Price (RWF)</label>
            <input v-model="form.exam_price" type="number" class="input" min="0" />
          </div>
          <div>
            <label class="label">Questions per Exam</label>
            <input v-model="form.exam_questions_count" type="number" class="input" min="5" max="50" />
          </div>
          <div>
            <label class="label">Pass Mark (%)</label>
            <input v-model="form.pass_mark" type="number" class="input" min="0" max="100" />
          </div>
        </div>
      </div>

      <!-- MoMo settings -->
      <div class="card">
        <h2 class="font-bold text-gray-900 mb-4">MTN MoMo API Settings</h2>
        <div class="space-y-3">
          <div>
            <label class="label">Environment</label>
            <select v-model="form.momo_environment" class="input">
              <option value="sandbox">Sandbox (Testing)</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div>
            <label class="label">Collection Subscription Key</label>
            <input v-model="form.momo_collection_subscription_key" type="text" class="input font-mono text-xs" />
          </div>
          <div>
            <label class="label">API User ID</label>
            <input v-model="form.momo_api_user_id" type="text" class="input font-mono text-xs" />
          </div>
          <div>
            <label class="label">API Key</label>
            <input v-model="form.momo_api_key" type="password" class="input font-mono text-xs" />
          </div>
        </div>
      </div>

      <!-- App Name settings -->
      <div class="card">
        <h2 class="font-bold text-gray-900 mb-4">App Name (Multilingual)</h2>
        <div class="space-y-3">
          <div>
            <label class="label">English</label>
            <input v-model="form.app_name_en" type="text" class="input" />
          </div>
          <div>
            <label class="label">Kinyarwanda</label>
            <input v-model="form.app_name_rw" type="text" class="input" />
          </div>
          <div>
            <label class="label">Français</label>
            <input v-model="form.app_name_fr" type="text" class="input" />
          </div>
        </div>
      </div>

      <p v-if="success" class="text-green-600 text-sm bg-green-50 p-3 rounded-xl">✅ Settings saved successfully!</p>
      <p v-if="error" class="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{{ error }}</p>

      <button type="submit" class="btn-primary" :disabled="saving">
        {{ saving ? 'Saving...' : 'Save Settings' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const loading = ref(true)
const saving = ref(false)
const success = ref(false)
const error = ref('')
const form = ref({})

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/settings')
    const s = data.settings
    form.value = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v.value]))
  } finally {
    loading.value = false
  }
})

const save = async () => {
  saving.value = true
  success.value = false
  error.value = ''
  try {
    await api.put('/admin/settings', { settings: form.value })
    success.value = true
    setTimeout(() => success.value = false, 3000)
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>
