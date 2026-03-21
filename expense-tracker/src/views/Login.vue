<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { Loader2, Lock, Mail, UserPlus, LogIn } from 'lucide-vue-next'

const router = useRouter()
const isLogin = ref(true)
const loading = ref(false)
const errorMsg = ref('')

const formData = ref({
  email: '',
  password: ''
})

async function handleAuth() {
  loading.value = true
  errorMsg.value = ''
  
  try {
    if (isLogin.value) {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.value.email,
        password: formData.value.password,
      })
      if (error) throw error
    } else {
      const { error } = await supabase.auth.signUp({
        email: formData.value.email,
        password: formData.value.password,
      })
      if (error) throw error
      // Show success or login directly
      if(!error) alert("Registration successful! You are now logged in.")
    }
    
    // Redirect to dashboard
    router.push('/')
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="glass-card auth-card animate-fade-in">
      <div class="auth-header">
        <h1 class="brand-title">Aura<strong>Budget</strong></h1>
        <p class="auth-subtitle">{{ isLogin ? 'Welcome back' : 'Create your account' }}</p>
      </div>

      <div v-if="errorMsg" class="alert-box error mb-4">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="handleAuth" class="auth-form">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <div class="input-wrapper">
            <Mail class="input-icon" size="18" />
            <input 
              v-model="formData.email" 
              type="email" 
              class="form-control with-icon" 
              placeholder="you@example.com"
              required 
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="input-wrapper">
            <Lock class="input-icon" size="18" />
            <input 
              v-model="formData.password" 
              type="password" 
              class="form-control with-icon" 
              placeholder="••••••••"
              required 
              minlength="6"
            />
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-block mt-4" :disabled="loading">
          <Loader2 v-if="loading" class="spin-icon" size="20" />
          <LogIn v-else-if="isLogin" size="20" />
          <UserPlus v-else size="20" />
          {{ loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up') }}
        </button>
      </form>

      <div class="auth-footer">
        <p class="text-secondary">
          {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
          <button type="button" class="text-link" @click="isLogin = !isLogin">
            {{ isLogin ? 'Sign up' : 'Sign in' }}
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
  width: 100%;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 0.5rem;
}

.brand-title {
  font-size: 2rem;
  font-weight: 300;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.brand-title strong {
  font-weight: 700;
}

.auth-subtitle {
  color: var(--text-secondary);
  font-size: 1.05rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: var(--text-secondary);
}

.with-icon {
  padding-left: 2.75rem !important;
}

.btn-block {
  width: 100%;
  padding: 0.875rem;
  font-size: 1.05rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.auth-footer {
  text-align: center;
  margin-top: 1rem;
  border-top: 1px solid var(--glass-border);
  padding-top: 1.5rem;
}

.text-link {
  background: none;
  border: none;
  color: var(--accent-primary);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-left: 0.5rem;
}

.text-link:hover {
  text-decoration: underline;
}

.alert-box.error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--danger);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  text-align: center;
}

.mt-4 {
  margin-top: 1rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
