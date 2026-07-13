<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-900 text-white flex-shrink-0 hidden lg:flex flex-col min-h-screen">
      <div class="p-5 border-b border-gray-800">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <div class="font-bold text-sm">Traffic Exam</div>
            <div class="text-xs text-gray-400">Admin Panel</div>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-4 space-y-1">
        <RouterLink v-for="item in navItems" :key="item.path" :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          :class="isActive(item.path) ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'">
          <span class="text-lg">{{ item.icon }}</span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="p-4 border-t border-gray-800">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center text-sm font-bold">
            {{ auth.user?.full_name?.charAt(0) }}
          </div>
          <div class="text-xs">
            <div class="font-medium text-white">{{ auth.user?.full_name }}</div>
            <div class="text-gray-400">Administrator</div>
          </div>
        </div>
        <button @click="logout" class="w-full text-xs text-gray-400 hover:text-red-400 text-left transition-colors">
          → Logout
        </button>
      </div>
    </aside>

    <!-- Mobile top nav -->
    <div class="lg:hidden fixed top-0 left-0 right-0 bg-gray-900 text-white z-40 px-4 py-3 flex items-center justify-between">
      <span class="font-bold text-sm">Admin Panel</span>
      <button @click="mobileOpen = !mobileOpen" class="text-gray-400">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>

    <!-- Mobile sidebar overlay -->
    <div v-if="mobileOpen" @click="mobileOpen = false" class="fixed inset-0 bg-black/50 z-30 lg:hidden"></div>
    <div v-if="mobileOpen" class="fixed left-0 top-0 bottom-0 w-64 bg-gray-900 text-white z-40 lg:hidden flex flex-col">
      <div class="p-5 border-b border-gray-800 flex justify-between items-center">
        <span class="font-bold">Admin Menu</span>
        <button @click="mobileOpen = false" class="text-gray-400">✕</button>
      </div>
      <nav class="flex-1 p-4 space-y-1">
        <RouterLink v-for="item in navItems" :key="item.path" :to="item.path" @click="mobileOpen = false"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          :class="isActive(item.path) ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'">
          <span>{{ item.icon }}</span>{{ item.label }}
        </RouterLink>
      </nav>
    </div>

    <!-- Main content -->
    <main class="flex-1 overflow-auto lg:ml-0 pt-14 lg:pt-0">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const mobileOpen = ref(false)

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/admin/questions', label: 'Questions', icon: '❓' },
  { path: '/admin/import', label: 'Import (Word)', icon: '📄' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/exams', label: 'Exams', icon: '📝' },
  { path: '/admin/payments', label: 'Payments', icon: '💳' },
  { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

const isActive = (path) => route.path === path || route.path.startsWith(path + '/')
const logout = () => { auth.logout(); router.push('/') }
</script>
