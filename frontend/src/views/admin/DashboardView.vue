<template>
  <div class="p-6 max-w-6xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

    <!-- Stats cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div v-for="stat in statCards" :key="stat.label" class="card">
        <div class="flex items-center justify-between mb-2">
          <span class="text-2xl">{{ stat.icon }}</span>
          <span class="text-xs px-2 py-0.5 rounded-full" :class="stat.badgeClass">{{ stat.badge }}</span>
        </div>
        <div class="text-2xl font-black text-gray-900">{{ stat.value }}</div>
        <div class="text-xs text-gray-500 mt-1">{{ stat.label }}</div>
      </div>
    </div>

    <!-- Charts row -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- Daily exams -->
      <div class="card">
        <h3 class="font-bold text-gray-900 mb-4">Exams (Last 7 Days)</h3>
        <div v-if="!stats" class="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
        <div v-else class="space-y-2">
          <div v-for="d in dailyStats" :key="d.date" class="flex items-center gap-3">
            <div class="text-xs text-gray-500 w-20">{{ formatDate(d.date) }}</div>
            <div class="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
              <div class="h-full bg-primary-400 rounded-lg transition-all" :style="{ width: `${(d.exams / maxExams) * 100}%` }"></div>
            </div>
            <div class="text-xs font-bold text-gray-700 w-8 text-right">{{ d.exams }}</div>
          </div>
          <div v-if="!dailyStats.length" class="text-center text-gray-400 text-sm py-4">No data yet</div>
        </div>
      </div>

      <!-- Pass/Fail ratio -->
      <div class="card">
        <h3 class="font-bold text-gray-900 mb-4">Overall Performance</h3>
        <div v-if="stats">
          <div class="flex items-center gap-4 mb-4">
            <div class="flex-1">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-green-600 font-medium">Passed</span>
                <span class="font-bold">{{ stats.exams.passed }}</span>
              </div>
              <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-green-400 rounded-full" :style="{ width: passRate + '%' }"></div>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-red-500 font-medium">Failed</span>
                <span class="font-bold">{{ stats.exams.completed - stats.exams.passed }}</span>
              </div>
              <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-red-400 rounded-full" :style="{ width: (100 - passRate) + '%' }"></div>
              </div>
            </div>
          </div>
          <div class="mt-4 text-center">
            <span class="text-3xl font-black text-gray-900">{{ passRate }}%</span>
            <div class="text-xs text-gray-500">Pass Rate</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent exams table -->
    <div class="card">
      <h3 class="font-bold text-gray-900 mb-4">Recent Exams</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left py-2 px-3 text-gray-500 font-medium">Student</th>
              <th class="text-left py-2 px-3 text-gray-500 font-medium">Phone</th>
              <th class="text-left py-2 px-3 text-gray-500 font-medium">Score</th>
              <th class="text-left py-2 px-3 text-gray-500 font-medium">Result</th>
              <th class="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in recentExams" :key="e.id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-3 px-3 font-medium text-gray-900">{{ e.full_name }}</td>
              <td class="py-3 px-3 text-gray-500">{{ e.phone }}</td>
              <td class="py-3 px-3 font-mono">{{ e.score ? e.score.toFixed(0) + '%' : '—' }}</td>
              <td class="py-3 px-3">
                <span :class="e.passed ? 'badge-pass' : e.status === 'in_progress' ? 'badge-pending' : 'badge-fail'">
                  {{ e.passed ? 'PASSED' : e.status === 'in_progress' ? 'IN PROGRESS' : 'FAILED' }}
                </span>
              </td>
              <td class="py-3 px-3 text-gray-400">{{ e.completed_at ? new Date(e.completed_at).toLocaleDateString() : '—' }}</td>
            </tr>
            <tr v-if="!recentExams.length">
              <td colspan="5" class="py-6 text-center text-gray-400">No exams yet</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const stats = ref(null)
const recentExams = ref([])
const dailyStats = ref([])

const passRate = computed(() => {
  if (!stats.value || !stats.value.exams.completed) return 0
  return Math.round((stats.value.exams.passed / stats.value.exams.completed) * 100)
})

const maxExams = computed(() => Math.max(...dailyStats.value.map((d) => d.exams), 1))

const statCards = computed(() => {
  if (!stats.value) return []
  return [
    { label: 'Total Students', value: stats.value.users.students || 0, icon: '👥', badge: 'Active', badgeClass: 'bg-blue-50 text-blue-600' },
    { label: 'Total Questions', value: stats.value.questions.total || 0, icon: '❓', badge: 'Bank', badgeClass: 'bg-purple-50 text-purple-600' },
    { label: 'Exams Taken', value: stats.value.exams.total || 0, icon: '📝', badge: 'All time', badgeClass: 'bg-gray-50 text-gray-600' },
    { label: 'Revenue (RWF)', value: (stats.value.revenue.total_revenue || 0).toLocaleString(), icon: '💰', badge: 'Collected', badgeClass: 'bg-green-50 text-green-600' },
  ]
})

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-RW', { month: 'short', day: 'numeric' }) : ''

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/dashboard')
    stats.value = data.stats
    recentExams.value = data.recentExams
    dailyStats.value = data.dailyStats
  } catch (e) {
    console.error(e)
  }
})
</script>
