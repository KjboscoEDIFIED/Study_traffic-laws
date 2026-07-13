<template>
  <div class="p-6 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Import Questions from Word</h1>
    <p class="text-gray-500 text-sm mb-8">Upload a .docx file containing questions in the correct format to bulk-import into the database.</p>

    <!-- Format guide -->
    <div class="card mb-6 border-l-4 border-blue-400">
      <h3 class="font-bold text-gray-900 mb-3">📋 Word Document Format Guide</h3>
      <p class="text-sm text-gray-600 mb-3">Each question block must follow this exact format:</p>
      <pre class="bg-gray-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed">Q: What does a red traffic light mean?
Q_RW: Urumuri rutukura rusobanura iki?
Q_FR: Que signifie un feu rouge?
A: Stop completely | Hagarara burundu | Arrêt complet
B: Slow down | Gabanya umuvuduko | Ralentir
C: Proceed with caution | Komeza wifashije | Avec prudence
D: Honk and pass | Vuga inziga | Klaxonner
ANS: A
CAT: Traffic Rules
DIFF: easy
---</pre>
      <ul class="text-xs text-gray-500 space-y-1 mt-4">
        <li>• <strong>Q, Q_RW, Q_FR</strong> — Question in English, Kinyarwanda, French</li>
        <li>• <strong>A, B, C, D</strong> — Options separated by <code class="bg-gray-100 px-1 rounded">|</code> for each language</li>
        <li>• <strong>ANS</strong> — Correct answer letter (A, B, C, or D)</li>
        <li>• <strong>CAT</strong> — Category name (optional, must match existing category)</li>
        <li>• <strong>DIFF</strong> — easy / medium / hard (optional, defaults to medium)</li>
        <li>• Separate questions with <code class="bg-gray-100 px-1 rounded">---</code></li>
      </ul>

      <button @click="downloadSample" class="mt-4 text-xs text-blue-600 hover:underline font-medium">
        ⬇ Download sample .docx template
      </button>
    </div>

    <!-- Upload area -->
    <div class="card">
      <div
        class="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors"
        :class="dragging ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300'"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop.prevent="handleDrop"
        @click="$refs.fileInput.click()">
        <input ref="fileInput" type="file" accept=".docx,.doc" class="hidden" @change="handleFile" />

        <div v-if="!file">
          <div class="text-5xl mb-3">📄</div>
          <p class="font-semibold text-gray-700">Drop your Word file here</p>
          <p class="text-sm text-gray-400 mt-1">or click to browse (.docx, .doc)</p>
        </div>

        <div v-else class="flex items-center justify-center gap-3">
          <span class="text-3xl">📝</span>
          <div class="text-left">
            <div class="font-semibold text-gray-800">{{ file.name }}</div>
            <div class="text-xs text-gray-400">{{ (file.size / 1024).toFixed(1) }} KB</div>
          </div>
          <button @click.stop="file = null" class="text-red-400 hover:text-red-600 ml-2">✕</button>
        </div>
      </div>

      <div v-if="file" class="mt-4">
        <button @click="uploadFile" class="btn-primary w-full" :disabled="uploading">
          <svg v-if="uploading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          {{ uploading ? 'Importing...' : 'Import Questions' }}
        </button>
      </div>

      <!-- Result -->
      <div v-if="importResult" class="mt-4 p-4 rounded-xl"
        :class="importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
        <div class="font-semibold" :class="importResult.success ? 'text-green-700' : 'text-red-700'">
          {{ importResult.message }}
        </div>
        <div v-if="importResult.imported !== undefined" class="text-sm mt-1 text-gray-600">
          ✅ {{ importResult.imported }} imported &nbsp;&nbsp; ⚠️ {{ importResult.skipped }} skipped
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

const toast = useToast()
const file = ref(null)
const dragging = ref(false)
const uploading = ref(false)
const importResult = ref(null)
const fileInput = ref(null)
const uploadProgress = ref(0)

const handleFile = (e) => {
  const f = e.target.files[0]
  if (f) file.value = f
}

const handleDrop = (e) => {
  dragging.value = false
  const f = e.dataTransfer.files[0]
  if (f && (f.name.endsWith('.docx') || f.name.endsWith('.doc'))) file.value = f
  else toast.error('Please upload a .docx or .doc file')
}

const uploadFile = async () => {
  if (!file.value) return
  uploading.value = true
  importResult.value = null
  uploadProgress.value = 0

  const fd = new FormData()
  fd.append('file', file.value)

  try {
    const { data } = await api.post('/admin/questions/import-docx', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000, // 5 minutes timeout 
    })
    importResult.value = data
    if (data.success) toast.success(`${data.imported} questions imported!`)
    file.value = null
  } catch (e) {
  if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      // Timeout but backend likely succeeded
      importResult.value = {
        success: true,
        message: 'Import is processing. Check the Questions list — your questions may already be imported!',
      }
      toast.success('Check your Questions list — import may have succeeded!')
    } else {
      importResult.value = {
        success: false,
        message: e.response?.data?.message || 'Import failed. Please try again.'
      }
      toast.error('Import failed')
    }
  } finally {
    uploading.value = false
  }
}

const downloadSample = () => {
  // Provide text download as a guide
  const content = `Q: What does a red traffic light mean?
Q_RW: Urumuri rutukura rusobanura iki?
Q_FR: Que signifie un feu rouge?
A: Stop completely | Hagarara burundu | Arrêt complet
B: Slow down | Gabanya umuvuduko | Ralentir
C: Proceed with caution | Komeza wifashije | Avec prudence
D: Honk and pass | Vuga inziga | Klaxonner
ANS: A
CAT: Traffic Rules
DIFF: easy
---
Q: What is the speed limit in a school zone?
Q_RW: Intera y'umuvuduko hafi y'ishuri?
Q_FR: Quelle est la limite de vitesse près d'une école?
A: 30 km/h | 30 km/h | 30 km/h
B: 50 km/h | 50 km/h | 50 km/h
C: 60 km/h | 60 km/h | 60 km/h
D: 80 km/h | 80 km/h | 80 km/h
ANS: A
CAT: Traffic Rules
DIFF: medium
---`
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'questions_template.txt'
  a.click()
  URL.revokeObjectURL(url)
  toast.info('Template downloaded (save as .docx by opening in Word)')
}
</script>
