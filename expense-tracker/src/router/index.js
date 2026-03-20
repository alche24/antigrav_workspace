import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/expenses',
      name: 'expenses',
      component: () => import('../views/Expenses.vue')
    },
    {
      path: '/budgets',
      name: 'budgets',
      component: () => import('../views/Budgets.vue')
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('../views/Categories.vue')
    }
  ]
})

export default router
