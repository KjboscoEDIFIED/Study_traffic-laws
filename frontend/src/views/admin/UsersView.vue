<template>
  <div class="p-6 max-w-6xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Users</h1>

    <div class="mb-4">
      <input v-model="search" type="search" class="input max-w-sm" placeholder="Search by name, phone, email..." @input="load" />
    </div>

    <div class="card overflow-hidden p-0">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Phone</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Role</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Exams</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Joined</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-3 px-4 font-medium text-gray-900">{{ u.full_name }}</td>
              <td class="py-3 px-4 text-gray-500">{{ u.phone }}</td>
              <td class="py-3 px-4">
                <span class="text-xs px-2 py-0.5 rounded-full" :class="u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'">
                  {{ u.role }}
                </span>
              </td>
              <td class="py-3 px-4 text-gray-600">{{ u.total_exams || 0 }} ({{ u.passed_exams || 0 }} passed)</td>
              <td class="py-3 px-4">
                <span :class="u.is_active ? 'badge-pass' : 'badge-fail'">{{ u.is_active ? 'Active' : 'Inactive' }}</span>
              </td>
              <td class="py-3 px-4 text-gray-400">{{ new Date(u.created_at).toLocaleDateString() }}</td>
              <td class="py-3 px-4">
                <div class="flex gap-2">
                  <button @click="toggleActive(u)" class="text-xs" :class="u.is_active ? 'text-red-500 hover:underline' : 'text-green-600 hover:underline'">
                    {{ u.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button v-if="u.role !== 'admin'" @click="makeAdmin(u)" class="text-xs text-purple-600 hover:underline">Make Admin</button>
                </div>
              </td>
            </tr>
            <tr v-if="!users.length">
              <td colspan="7" class="py-10 text-center text-gray-400">No users found</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4 border-t text-sm text-gray-500">{{ total }} total users</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

const toast = useToast()
const users = ref([])
const search = ref('')
const total = ref(0)

const load = async () => {
  const { data } = await api.get('/admin/users', { params: { search: search.value, limit: 50 } })
  users.value = data.users
  total.value = data.total
}

const toggleActive = async (u) => {
  await api.put(`/admin/users/${u.id}`, { is_active: !u.is_active })
  u.is_active = !u.is_active
  toast.success('User updated')
}

const makeAdmin = async (u) => {
  if (confirm(`Make ${u.full_name} an admin?`)) {
    await api.put(`/admin/users/${u.id}`, { role: 'admin' })
    u.role = 'admin'
    toast.success('User promoted to admin')
  }
}

onMounted(load)
</script>
