import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import { currentUser } from '../lib/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresAuth: true }
    },
    {
      path: '/expenses',
      name: 'expenses',
      component: () => import('../views/Expenses.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/budgets',
      name: 'budgets',
      component: () => import('../views/Budgets.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('../views/Categories.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = !!currentUser.value

  if (requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
