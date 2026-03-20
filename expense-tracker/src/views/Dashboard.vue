<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { Loader2, TrendingUp, TrendingDown, DollarSign } from 'lucide-vue-next'

const loading = ref(true)
const categories = ref([])
const expenses = ref([])
const budgets = ref([])

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1 // 1-12

const selectedMonth = ref(currentMonth)
const selectedYear = ref(currentYear)

const months = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, 
  { value: 3, label: 'March' }, { value: 4, label: 'April' }, 
  { value: 5, label: 'May' }, { value: 6, label: 'June' }, 
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, 
  { value: 9, label: 'September' }, { value: 10, label: 'October' }, 
  { value: 11, label: 'November' }, { value: 12, label: 'December' }
]

const years = computed(() => {
  const arr = []
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    arr.push(y)
  }
  return arr
})

async function fetchDashboardData() {
  loading.value = true
  try {
    // 1. Fetch Categories
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
    if (catError) throw catError
    categories.value = catData || []

    // 2. Fetch Budgets for selected month/year
    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', selectedMonth.value)
      .eq('year', selectedYear.value)
    if (budgetError) throw budgetError
    budgets.value = budgetData || []

    // 3. Fetch Expenses for selected month/year
    // Construct date string bounds
    const startDate = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-01`
    const nextMonth = selectedMonth.value === 12 ? 1 : selectedMonth.value + 1
    const nextYear = selectedMonth.value === 12 ? selectedYear.value + 1 : selectedYear.value
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
    
    // Using simple date logic
    const { data: expData, error: expError } = await supabase
      .from('expenses')
      .select('*')
      .gte('expense_date', startDate)
      .lt('expense_date', endDate)
    if (expError) throw expError
    expenses.value = expData || []

  } catch (err) {
    console.error('Error fetching dashboard data:', err)
  } finally {
    loading.value = false
  }
}

watch([selectedMonth, selectedYear], () => {
  fetchDashboardData()
})

onMounted(() => {
  fetchDashboardData()
})

// Calculate aggregated data per category
const categoryStats = computed(() => {
  return categories.value.map(cat => {
    // Find budget
    const b = budgets.value.find(bdg => bdg.category_id === cat.id)
    const budgetAmount = b ? parseFloat(b.amount) : 0
    
    // Sum expenses
    const catExpenses = expenses.value.filter(e => e.category_id === cat.id)
    const spentAmount = catExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
    
    const remaining = budgetAmount - spentAmount
    const percentage = budgetAmount > 0 ? Math.min(100, (spentAmount / budgetAmount) * 100) : (spentAmount > 0 ? 100 : 0)
    
    return {
      ...cat,
      budget: budgetAmount,
      spent: spentAmount,
      remaining: remaining,
      percentage: percentage,
      isOver: spentAmount > budgetAmount && budgetAmount > 0
    }
  }).sort((a, b) => b.spent - a.spent) // Sort by highest spending
})

// Overall Totals
const totalBudget = computed(() => budgets.value.reduce((sum, b) => sum + parseFloat(b.amount), 0))
const totalSpent = computed(() => expenses.value.reduce((sum, e) => sum + parseFloat(e.amount), 0))
const totalRemaining = computed(() => totalBudget.value - totalSpent.value)
const overallPercentage = computed(() => totalBudget.value > 0 ? Math.min(100, (totalSpent.value / totalBudget.value) * 100) : 0)

</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p class="subtitle">Overview of your spending vs budget</p>
      </div>
      
      <div class="header-filters">
        <select v-model="selectedMonth" class="form-control filter-select">
          <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <select v-model="selectedYear" class="form-control filter-select">
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <Loader2 class="spin-icon text-accent" size="40" />
      <p>Crunching numbers...</p>
    </div>

    <div v-else class="dashboard-content animate-fade-in">
      <!-- Top Overview Cards -->
      <div class="overview-cards">
        <div class="glass-card stat-card primary-gradient">
          <div class="stat-icon-wrapper">
            <DollarSign size="24" />
          </div>
          <div class="stat-details">
            <span class="stat-label">Total Spent</span>
            <span class="stat-value">${{ totalSpent.toFixed(2) }}</span>
          </div>
        </div>
        
        <div class="glass-card stat-card">
          <div class="stat-icon-wrapper text-emerald">
            <TrendingUp size="24" />
          </div>
          <div class="stat-details">
            <span class="stat-label">Total Budget</span>
            <span class="stat-value">${{ totalBudget.toFixed(2) }}</span>
          </div>
        </div>

        <div class="glass-card stat-card">
          <div class="stat-icon-wrapper" :class="totalRemaining >= 0 ? 'text-emerald' : 'text-danger'">
            <TrendingDown v-if="totalRemaining >= 0" size="24" />
            <TrendingUp v-else size="24" />
          </div>
          <div class="stat-details">
            <span class="stat-label">{{ totalRemaining >= 0 ? 'Remaining' : 'Over Budget' }}</span>
            <span class="stat-value" :class="{ 'text-danger': totalRemaining < 0 }">
              ${{ Math.abs(totalRemaining).toFixed(2) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Overall Progress Bar -->
      <div class="glass-card main-progress-card mt-lg">
        <div class="progress-header">
          <h3>Overall Budget Utilization</h3>
          <span class="pct-badge" :class="totalRemaining < 0 ? 'bg-danger' : 'bg-primary'">
            {{ overallPercentage.toFixed(0) }}%
          </span>
        </div>
        <div class="progress-bar-bg main-bar">
          <div 
            class="progress-bar-fill" 
            :class="totalRemaining < 0 ? 'fill-danger' : 'fill-primary'"
            :style="{ width: `${overallPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Categories Breakdown -->
      <h2 class="section-title mt-xl">Category Breakdown</h2>
      
      <div v-if="categoryStats.length === 0" class="empty-state glass-card">
        <p>No categories found. Create categories and set budgets first.</p>
      </div>
      
      <div v-else class="categories-grid">
        <div 
          v-for="stat in categoryStats" 
          :key="stat.id" 
          class="glass-card cat-card"
        >
          <div class="cat-header">
            <div class="cat-title">
              <div class="cat-color-dot" :style="{ backgroundColor: stat.color }"></div>
              <span>{{ stat.name }}</span>
            </div>
            <div class="cat-amounts">
              <span class="spent font-bold">${{ stat.spent.toFixed(2) }}</span>
              <span class="separator">/</span>
              <span class="budget text-muted">${{ stat.budget.toFixed(2) }}</span>
            </div>
          </div>
          
          <div class="progress-bar-bg">
            <div 
              class="progress-bar-fill"
              :style="{ 
                width: `${stat.percentage}%`, 
                backgroundColor: stat.isOver ? '#ef4444' : stat.color 
              }"
            ></div>
          </div>
          
          <div class="cat-footer">
            <span v-if="stat.isOver" class="text-danger over-tag">
              ${{ Math.abs(stat.remaining).toFixed(2) }} Over Budget
            </span>
            <span v-else class="text-emerald over-tag">
              ${{ stat.remaining.toFixed(2) }} Remaining
            </span>
            
            <span class="pct-text">{{ stat.percentage.toFixed(0) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.header-filters {
  display: flex;
  gap: 1rem;
}

.filter-select {
  width: 140px;
  background-color: var(--glass-bg);
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
}

.primary-gradient {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.4));
  border-color: rgba(59, 130, 246, 0.3);
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.primary-gradient .stat-icon-wrapper {
  color: white;
}

.text-emerald { color: var(--success); }
.text-danger { color: var(--danger); }
.text-muted { color: var(--text-secondary); }

.stat-details {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.primary-gradient .stat-label {
  color: rgba(255,255,255,0.8);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}

.mt-lg { margin-top: 1.5rem; }
.mt-xl { margin-top: 2.5rem; }

.main-progress-card {
  padding: 2rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.pct-badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: 0.9rem;
  color: white;
}

.bg-primary { background-color: var(--accent-primary); }
.bg-danger { background-color: var(--danger); }

.progress-bar-bg {
  width: 100%;
  background: rgba(0,0,0,0.3);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.main-bar {
  height: 16px;
}

.progress-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.fill-primary {
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
}

.fill-danger {
  background: var(--danger);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.cat-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cat-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  font-size: 1.05rem;
}

.cat-color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.cat-amounts {
  font-size: 1rem;
}

.font-bold { font-weight: 700; }
.separator { 
  margin: 0 0.25rem;
  color: var(--text-secondary);
}

.cat-card .progress-bar-bg {
  height: 8px;
}

.cat-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.over-tag {
  font-weight: 600;
}

.pct-text {
  color: var(--text-secondary);
  font-weight: 600;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-secondary);
}
.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
