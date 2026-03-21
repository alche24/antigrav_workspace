<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, Edit2, Loader2 } from 'lucide-vue-next'
import { currentUser } from '../lib/auth'

const categories = ref([])
const loading = ref(true)
const isSubmitting = ref(false)

// Form state
const isEditing = ref(false)
const formData = ref({
  id: null,
  name: '',
  color: '#3b82f6'
})

// Default color palettes to choose from
const colorOptions = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', 
  '#f97316', '#eab308', '#22c55e', '#14b8a6', 
  '#06b6d4', '#475569'
]

async function fetchCategories() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    categories.value = data || []
  } catch (err) {
    console.error('Error fetching categories:', err)
  } finally {
    loading.value = false
  }
}

async function saveCategory() {
  if (!formData.value.name.trim()) return
  isSubmitting.value = true
  try {
    if (isEditing.value) {
      const { error } = await supabase
        .from('categories')
        .update({ 
          name: formData.value.name,
          color: formData.value.color
        })
        .eq('id', formData.value.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('categories')
        .insert([{ 
          name: formData.value.name,
          color: formData.value.color,
          user_id: currentUser.value.id
        }])
      if (error) throw error
    }
    
    resetForm()
    await fetchCategories()
  } catch (err) {
    console.error('Error saving category:', err)
  } finally {
    isSubmitting.value = false
  }
}

async function deleteCategory(id) {
  if (!confirm('Delete this category? Associated budgets and expenses may be affected.')) return
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    if (error) throw error
    await fetchCategories()
  } catch (err) {
    console.error('Error deleting category:', err)
  }
}

function editCategory(cat) {
  isEditing.value = true
  formData.value = { ...cat }
}

function resetForm() {
  isEditing.value = false
  formData.value = {
    id: null,
    name: '',
    color: '#3b82f6'
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <div>
        <h1>Expense Categories</h1>
        <p class="subtitle">Customize the categories you want to track</p>
      </div>
    </header>

    <div class="content-grid">
      <!-- Form Panel -->
      <div class="glass-card form-panel animate-fade-in" style="animation-delay: 0.1s">
        <h2>{{ isEditing ? 'Edit Category' : 'Create New Category' }}</h2>
        <form @submit.prevent="saveCategory" class="category-form">
          <div class="form-group">
            <label class="form-label">Category Name</label>
            <input 
              v-model="formData.name" 
              type="text" 
              class="form-control" 
              placeholder="e.g. Groceries, Rent, Utilities"
              required 
            />
          </div>

          <div class="form-group">
            <label class="form-label">Theme Color</label>
            <div class="color-picker">
              <button 
                v-for="color in colorOptions" 
                :key="color"
                type="button"
                class="color-btn"
                :class="{ active: formData.color === color }"
                :style="{ backgroundColor: color }"
                @click="formData.color = color"
              ></button>
              
              <!-- Custom color picker fallback -->
              <input type="color" v-model="formData.color" class="custom-color-input" />
            </div>
          </div>

          <div class="form-actions">
            <button v-if="isEditing" type="button" @click="resetForm" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <Loader2 v-if="isSubmitting" class="spin-icon" size="18" />
              <Plus v-else-if="!isEditing" size="18" />
              {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update Category' : 'Add Category') }}
            </button>
          </div>
        </form>
      </div>

      <!-- Categories List -->
      <div class="glass-card list-panel animate-fade-in" style="animation-delay: 0.2s">
        <div v-if="loading" class="loading-state">
          <Loader2 class="spin-icon text-accent" size="40" />
          <p>Loading categories...</p>
        </div>
        
        <div v-else-if="categories.length === 0" class="empty-state">
          <div class="empty-icon">📁</div>
          <h3>No categories yet</h3>
          <p>Create your first category to start tracking expenses.</p>
        </div>

        <div v-else class="categories-list">
          <div 
            v-for="cat in categories" 
            :key="cat.id" 
            class="category-item"
            :style="{ borderLeftColor: cat.color }"
          >
            <div class="cat-info">
              <div class="cat-color-dot" :style="{ backgroundColor: cat.color }"></div>
              <span class="cat-name">{{ cat.name }}</span>
            </div>
            
            <div class="cat-actions">
              <button @click="editCategory(cat)" class="icon-btn edit-btn" title="Edit">
                <Edit2 size="16" />
              </button>
              <button @click="deleteCategory(cat.id)" class="icon-btn delete-btn" title="Delete">
                <Trash2 size="16" />
              </button>
            </div>
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

.subtitle {
  color: var(--text-secondary);
  font-size: 1.05rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: 350px 1fr;
    align-items: start;
  }
}

.form-panel h2 {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--glass-border);
}

.category-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.color-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform var(--transition-fast), border-color var(--transition-fast);
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: white;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.custom-color-input {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  background: none;
}

.custom-color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}
.custom-color-input::-webkit-color-swatch {
  border: none;
  border-radius: 50%;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.form-actions .btn {
  flex: 1;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.categories-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-md);
  border-left: 4px solid;
  transition: transform var(--transition-fast), background var(--transition-fast);
}

.category-item:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.05);
}

.cat-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cat-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.cat-name {
  font-weight: 500;
  font-size: 1.05rem;
}

.cat-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
}

.category-item:hover .cat-actions {
  opacity: 1;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.4rem;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-primary);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
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

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.text-accent {
  color: var(--accent-primary);
}
</style>
