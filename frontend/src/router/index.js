import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  // Public
  { path: '/', name: 'landing', component: () => import('@/views/LandingView.vue') },
  { path: '/login', name: 'login', component: () => import('@/views/auth/LoginView.vue') },
  { path: '/register', name: 'register', component: () => import('@/views/auth/RegisterView.vue') },

  // Student
  { path: '/home', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { requiresAuth: true } },
  { path: '/study', name: 'study', component: () => import('@/views/StudyView.vue'), meta: { requiresAuth: true } },
  { path: '/payment', name: 'payment', component: () => import('@/views/PaymentView.vue'), meta: { requiresAuth: true } },
  { path: '/exam/:examId', name: 'exam', component: () => import('@/views/ExamView.vue'), meta: { requiresAuth: true } },
  { path: '/result', name: 'result', component: () => import('@/views/ResultView.vue'), meta: { requiresAuth: true } },
  { path: '/my-exams', name: 'my-exams', component: () => import('@/views/MyExamsView.vue'), meta: { requiresAuth: true } },

  // Admin
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/views/admin/DashboardView.vue') },
      { path: 'questions', name: 'admin-questions', component: () => import('@/views/admin/QuestionsView.vue') },
      { path: 'users', name: 'admin-users', component: () => import('@/views/admin/UsersView.vue') },
      { path: 'exams', name: 'admin-exams', component: () => import('@/views/admin/ExamsView.vue') },
      { path: 'payments', name: 'admin-payments', component: () => import('@/views/admin/PaymentsView.vue') },
      { path: 'settings', name: 'admin-settings', component: () => import('@/views/admin/SettingsView.vue') },
      { path: 'import', name: 'admin-import', component: () => import('@/views/admin/ImportView.vue') },
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return { name: 'login' }
  if (to.meta.requiresAdmin && !auth.isAdmin) return { name: 'home' }
  if ((to.name === 'login' || to.name === 'register') && auth.isLoggedIn) {
    return auth.isAdmin ? { path: '/admin/dashboard' } : { name: 'home' }
  }
})

export default router
