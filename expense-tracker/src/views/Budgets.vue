<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { Loader2, Save, AlertCircle } from 'lucide-vue-next'

const categories = ref([])
const budgets = ref([])
const loading = ref(true)
const saving = ref(false)

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1 // 1-12

// Filter state
const selectedMonth = ref(currentMonth)
const selectedYear = ref(currentYear)

// Years dropdown (Current year - 1 to Current year + 5)
const years = computed(() => {
  const arr = []
  for (let y = currentYear - 1; y <= currentYear + 5; y++) {
    arr.push(y)
  }
  return arr
})

const months = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, 
  { value: 3, label: 'March' }, { value: 4, label: 'April' }, 
  { value: 5, label: 'May' }, { value: 6, label: 'June' }, 
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, 
  { value: 9, label: 'September' }, { value: 10, label: 'October' }, 
  { value: 11, label: 'November' }, { value: 12, label: 'December' }
]

// Working state for budget inputs
const budgetInputs = ref({})

async function fetchData() {
  loading.value = true
  try {
    // Fetch categories
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
    if (catError) throw catError
    categories.value = catData || []

    // Fetch budgets for selected month/year
    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', selectedMonth.value)
      .eq('year', selectedYear.value)
    if (budgetError) throw budgetError
    budgets.value = budgetData || []

    // Map existing budgets to inputs
    const inputs = {}
    categories.value.forEach(cat => {
      const existing = budgets.value.find(b => b.category_id === cat.id)
      inputs[cat.id] = existing ? parseFloat(existing.amount) : 0
    })
    budgetInputs.value = inputs

  } catch (err) {
    console.error('Error fetching budgets/categories:', err)
  } finally {
    loading.value = false
  }
}

async function saveBudgets() {
  saving.value = true
  try {
    const upserts = categories.value.map(cat => {
      const amount = parseFloat(budgetInputs.value[cat.id]) || 0
      const existing = budgets.value.find(b => b.category_id === cat.id)
      
      const payload = {
        category_id: cat.id,
        month: selectedMonth.value,
        year: selectedYear.value,
        amount: amount
      }
      
      if (existing) {
        payload.id = existing.id
      }
      
      return payload
    })

    const { error } = await supabase
      .from('budgets')
      .upsert(upserts, { onConflict: 'category_id, month, year' })
      
    if (error) throw error
    
    // Refresh to get concrete IDs
    await fetchData()
    
    // Optional success toast here
    alert("Budgets saved successfully!")
  } catch (err) {
    console.error('Error saving budgets:', err)
  } finally {
    saving.value = false
  }
}

watch([selectedMonth, selectedYear], () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})

const totalBudget = computed(() => {
  return Object.values(budgetInputs.value).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
})
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <div>
        <h1>Monthly Budgets</h1>
        <p class="subtitle">Set and plan your budgets for the month</p>
      </div>
    </header>

    <div class="glass-card tools-panel animate-fade-in" style="animation-delay: 0.1s">
      <div class="filters">
        <div class="form-group mb-0">
          <label class="form-label">Month</label>
          <select v-model="selectedMonth" class="form-control">
            <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
        </div>
        
        <div class="form-group mb-0">
          <label class="form-label">Year</label>
          <select v-model="selectedYear" class="form-control">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
      </div>
      
      <div class="summary-box">
        <span class="summary-label">Total Planned Budget</span>
        <span class="summary-val">${{ totalBudget.toFixed(2) }}</span>
      </div>
    </div>

    <div class="glass-card budget-panel animate-fade-in" style="animation-delay: 0.2s">
      <div v-if="loading" class="loading-state">
        <Loader2 class="spin-icon text-accent" size="40" />
        <p>Loading budget planner...</p>
      </div>
      
      <div v-else-if="categories.length === 0" class="empty-state">
        <AlertCircle size="48" class="text-warning mb-4" />
        <h3>No Categories Found</h3>
        <p>You need to create categories before you can set budgets.</p>
        <RouterLink to="/categories" class="btn btn-primary mt-4">Go to Categories</RouterLink>
      </div>
      
      <div v-else>
        <div class="budget-list">
          <!-- Header -->
          <div class="budget-row header">
            <div class="col-category">Category</div>
            <div class="col-amount">Budget Amount (Rp)</div>
          </div>
          
          <!-- Rows -->
          <div 
            v-for="cat in categories" 
            :key="cat.id" 
            class="budget-row"
          >
            <div class="col-category">
              <div class="cat-color-dot" :style="{ backgroundColor: cat.color }"></div>
              <span>{{ cat.name }}</span>
            </div>
            <div class="col-amount input-wrapper">
              <span class="currency-prefix">$</span>
              <input 
                type="number" 
                v-model.number="budgetInputs[cat.id]" 
                class="form-control budget-input" 
                min="0" 
                step="0.01" 
              />
            </div>
          </div>
        </div>

        <div class="actions-panel">
          <button @click="saveBudgets" class="btn btn-primary btn-lg" :disabled="saving">
            <Loader2 v-if="saving" class="spin-icon" size="20" />
            <Save v-else size="20" />
            {{ saving ? 'Saving Budgets...' : 'Save All Budgets' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.05rem;
}

.tools-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  justify-content: space-between;
  align-items: flex-start;
}

@media (min-width: 768px) {
  .tools-panel {
    flex-direction: row;
    align-items: center;
  }
}

.filters {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.mb-0 {
  margin-bottom: 0 !important;
}

.summary-box {
  background: linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
  border: 1px solid rgba(139, 92, 246, 0.2);
  padding: 1rem 1.5rem;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 200px;
}

.summary-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.summary-val {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
}

.budget-list {
  display: flex;
  flex-direction: column;
}

.budget-row {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--glass-border);
}

.budget-row:last-child {
  border-bottom: none;
}

.budget-row.header {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  border-bottom: none;
}

.col-category {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  font-size: 1.05rem;
}

.cat-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.col-amount {
  width: 200px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-prefix {
  position: absolute;
  left: 1rem;
  color: var(--text-secondary);
}

.budget-input {
  padding-left: 2rem;
  font-size: 1.1rem;
  font-weight: 500;
  background: rgba(0,0,0,0.3);
}

.budget-input:focus {
  background: rgba(0,0,0,0.5);
}

.actions-panel {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--glass-border);
  padding-top: 1.5rem;
}

.btn-lg {
  padding: 0.875rem 2rem;
  font-size: 1.05rem;
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

.text-warning {
  color: var(--warning);
}
.mb-4 { margin-bottom: 1rem; }
.mt-4 { margin-top: 1rem; }
.text-accent { color: var(--accent-primary); }

.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
