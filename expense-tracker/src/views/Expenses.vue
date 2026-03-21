<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, Loader2, Calendar } from 'lucide-vue-next'
import { formatCurrency } from '../lib/utils'
import { currentUser } from '../lib/auth'

const expenses = ref([])
const categories = ref([])
const loading = ref(true)
const isSubmitting = ref(false)

const today = new Date().toISOString().split('T')[0]

// Form state
const formData = ref({
  amount: '',
  category_id: '',
  expense_date: today,
  description: ''
})

async function fetchData() {
  loading.value = true
  try {
    // Fetch categories for the dropdown
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
    if (catError) throw catError
    categories.value = catData || []

    // Fetch recent expenses
    const { data: expData, error: expError } = await supabase
      .from('expenses')
      .select(`
        *,
        categories (
          name,
          color
        )
      `)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)
      
    if (expError) throw expError
    expenses.value = expData || []

    if (categories.value.length > 0 && !formData.value.category_id) {
      formData.value.category_id = categories.value[0].id
    }
  } catch (err) {
    console.error('Error fetching data:', err)
  } finally {
    loading.value = false
  }
}

async function saveExpense() {
  if (!formData.value.amount || !formData.value.category_id) return
  isSubmitting.value = true
  
  try {
    const { error } = await supabase
      .from('expenses')
      .insert([{ 
        amount: parseFloat(formData.value.amount),
        category_id: formData.value.category_id,
        expense_date: formData.value.expense_date,
        description: formData.value.description,
        user_id: currentUser.value.id
      }])
      
    if (error) throw error
    
    // Reset form partially
    formData.value.amount = ''
    formData.value.description = ''
    
    await fetchData()
  } catch (err) {
    console.error('Error saving expense:', err)
  } finally {
    isSubmitting.value = false
  }
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      
    if (error) throw error
    await fetchData()
  } catch (err) {
    console.error('Error deleting expense:', err)
  }
}

function formatDate(dateString) {
  const options = { month: 'short', day: 'numeric', year: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <div>
        <h1>Daily Expenses</h1>
        <p class="subtitle">Log and track your daily spending</p>
      </div>
    </header>

    <div class="content-grid">
      <!-- Add Expense Form -->
      <div class="glass-card form-panel animate-fade-in" style="animation-delay: 0.1s">
        <h2>Log an Expense</h2>
        
        <div v-if="categories.length === 0 && !loading" class="alert-box warning">
          <p>Please create categories first before logging expenses.</p>
          <RouterLink to="/categories" class="btn btn-secondary mt-2">Go to Categories</RouterLink>
        </div>
        
        <form v-else @submit.prevent="saveExpense" class="expense-form">
          <div class="form-group row-group">
            <div class="field amount-field">
              <label class="form-label">Amount (Rp)</label>
              <div class="input-wrapper">
                <span class="currency-prefix">Rp</span>
                <input 
                  v-model.number="formData.amount" 
                  type="number" 
                  step="1000" 
                  min="0"
                  class="form-control pl-8" 
                  placeholder="0"
                  required 
                />
              </div>
            </div>
            
            <div class="field date-field">
              <label class="form-label">Date</label>
              <input 
                v-model="formData.expense_date" 
                type="date" 
                class="form-control" 
                required 
              />
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Category</label>
            <select v-model="formData.category_id" class="form-control" required>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Description (Optional)</label>
            <input 
              v-model="formData.description" 
              type="text" 
              class="form-control" 
              placeholder="What was this for?"
            />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-block" :disabled="isSubmitting || categories.length === 0">
              <Loader2 v-if="isSubmitting" class="spin-icon" size="18" />
              <Plus v-else size="18" />
              {{ isSubmitting ? 'Saving...' : 'Add Expense' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Recent Expenses List -->
      <div class="glass-card list-panel animate-fade-in" style="animation-delay: 0.2s">
        <h2 class="list-title">Recent Transactions</h2>
        
        <div v-if="loading" class="loading-state">
          <Loader2 class="spin-icon text-accent" size="40" />
          <p>Loading expenses...</p>
        </div>
        
        <div v-else-if="expenses.length === 0" class="empty-state">
          <div class="empty-icon">💸</div>
          <h3>No expenses logged</h3>
          <p>Your recent transactions will appear here.</p>
        </div>

        <div v-else class="expenses-list">
          <div 
            v-for="exp in expenses" 
            :key="exp.id" 
            class="expense-item"
          >
            <div class="exp-icon" :style="{ backgroundColor: exp.categories?.color || '#94a3b8' }">
              <span class="initial">{{ exp.categories?.name?.charAt(0) || '?' }}</span>
            </div>
            
            <div class="exp-details">
              <div class="exp-header">
                <span class="exp-cat">{{ exp.categories?.name || 'Uncategorized' }}</span>
                <span class="exp-amount">{{ formatCurrency(exp.amount) }}</span>
              </div>
              <div class="exp-meta">
                <span class="exp-desc">{{ exp.description || 'No description' }}</span>
                <span class="exp-date">
                  <Calendar size="12" class="mr-1" />
                  {{ formatDate(exp.expense_date) }}
                </span>
              </div>
            </div>
            
            <button @click="deleteExpense(exp.id)" class="delete-btn" title="Delete">
              <Trash2 size="16" />
            </button>
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
  gap: var(--spacing-xl);
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: 400px 1fr;
    align-items: start;
  }
}

.form-panel h2 {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--glass-border);
}

.expense-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.row-group {
  display: flex;
  gap: 1rem;
}

.field {
  flex: 1;
}

.amount-field {
  flex: 1.2;
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

.pl-8 {
  padding-left: 2rem !important;
}

.btn-block {
  width: 100%;
}

.list-title {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
}

.expenses-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.expense-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-md);
  transition: transform var(--transition-fast), background var(--transition-fast);
  position: relative;
}

.expense-item:hover {
  transform: translateX(4px);
  background: rgba(255, 255, 255, 0.05);
}

.exp-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}

.exp-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.exp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exp-cat {
  font-weight: 600;
  font-size: 1.05rem;
}

.exp-amount {
  font-weight: 700;
  font-size: 1.1rem;
  color: #fff;
}

.exp-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.exp-date {
  display: flex;
  align-items: center;
  opacity: 0.8;
}

.mr-1 { margin-right: 0.25rem; }

.delete-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);
}

.expense-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-50%) scale(1.1);
}

.alert-box {
  padding: 1rem;
  border-radius: var(--radius-sm);
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: var(--warning);
}

.mt-2 { margin-top: 0.5rem; }

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-secondary);
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}
</style>
