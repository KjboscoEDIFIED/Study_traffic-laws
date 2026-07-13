<template>
  <div class="p-6 max-w-6xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Payments</h1>

    <div class="flex gap-3 mb-5">
      <select v-model="statusFilter" class="input w-44" @change="load">
        <option value="">All Status</option>
        <option value="successful">Successful</option>
        <option value="pending">Pending</option>
        <option value="failed">Failed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <div class="card overflow-hidden p-0">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">ID</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Student</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Phone</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Amount</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">MoMo Txn</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in payments" :key="p.id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-3 px-4 font-mono text-xs text-gray-400">#{{ p.id }}</td>
              <td class="py-3 px-4 font-medium text-gray-900">{{ p.full_name }}</td>
              <td class="py-3 px-4 text-gray-500">{{ p.phone_number }}</td>
              <td class="py-3 px-4 font-bold text-gray-900">{{ p.amount }} {{ p.currency }}</td>
              <td class="py-3 px-4">
                <span :class="{
                  'badge-pass': p.status === 'successful',
                  'badge-fail': p.status === 'failed' || p.status === 'cancelled',
                  'badge-pending': p.status === 'pending',
                }">{{ p.status }}</span>
              </td>
              <td class="py-3 px-4 font-mono text-xs text-gray-400">{{ p.momo_transaction_id || '—' }}</td>
              <td class="py-3 px-4 text-gray-400 text-xs">{{ new Date(p.initiated_at).toLocaleString() }}</td>
            </tr>
            <tr v-if="!payments.length">
              <td colspan="7" class="py-10 text-center text-gray-400">No payments found</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4 border-t text-sm text-gray-500">{{ total }} total payments</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const payments = ref([])
const total = ref(0)
const statusFilter = ref('')

const load = async () => {
  const { data } = await api.get('/admin/payments', { params: { status: statusFilter.value || undefined, limit: 50 } })
  payments.value = data.payments
  total.value = data.total
}

onMounted(load)
</script>
