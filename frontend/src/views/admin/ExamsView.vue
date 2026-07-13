<template>
  <div class="p-6 max-w-6xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Exams</h1>

    <div class="flex gap-3 mb-5">
      <select v-model="statusFilter" class="input w-40" @change="load">
        <option value="">All Status</option>
        <option value="completed">Completed</option>
        <option value="in_progress">In Progress</option>
        <option value="abandoned">Abandoned</option>
      </select>
      <select v-model="passedFilter" class="input w-36" @change="load">
        <option value="">Pass/Fail</option>
        <option value="true">Passed</option>
        <option value="false">Failed</option>
      </select>
    </div>

    <div class="card overflow-hidden p-0">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">ID</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Student</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Score</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Result</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Lang</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in exams" :key="e.id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-3 px-4 font-mono text-xs text-gray-400">#{{ e.id }}</td>
              <td class="py-3 px-4">
                <div class="font-medium text-gray-900">{{ e.full_name }}</div>
                <div class="text-xs text-gray-400">{{ e.phone }}</div>
              </td>
              <td class="py-3 px-4">
                <div class="font-bold" :class="e.passed ? 'text-green-600' : 'text-red-500'">{{ e.score ? e.score.toFixed(0) + '%' : '—' }}</div>
                <div class="text-xs text-gray-400">{{ e.correct_answers }}/{{ e.total_questions }}</div>
              </td>
              <td class="py-3 px-4">
                <span :class="e.passed ? 'badge-pass' : e.status === 'in_progress' ? 'badge-pending' : 'badge-fail'">
                  {{ e.passed ? 'PASSED' : e.status === 'in_progress' ? 'IN PROGRESS' : 'FAILED' }}
                </span>
              </td>
              <td class="py-3 px-4 text-xs font-mono uppercase text-gray-500">{{ e.language }}</td>
              <td class="py-3 px-4 text-gray-400 text-xs">{{ e.completed_at ? new Date(e.completed_at).toLocaleString() : '—' }}</td>
            </tr>
            <tr v-if="!exams.length">
              <td colspan="6" class="py-10 text-center text-gray-400">No exams found</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4 border-t text-sm text-gray-500">{{ total }} total exams</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const exams = ref([])
const total = ref(0)
const statusFilter = ref('')
const passedFilter = ref('')

const load = async () => {
  const { data } = await api.get('/admin/exams', {
    params: { status: statusFilter.value || undefined, passed: passedFilter.value || undefined, limit: 50 }
  })
  exams.value = data.exams
  total.value = data.total
}

onMounted(load)
</script>
