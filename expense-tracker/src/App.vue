<script setup>
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { LayoutDashboard, Receipt, PiggyBank, Tags } from 'lucide-vue-next'
import { computed } from 'vue'

const route = useRoute()

const navigation = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Expenses', path: '/expenses', icon: Receipt },
  { name: 'Budgets', path: '/budgets', icon: PiggyBank },
  { name: 'Categories', path: '/categories', icon: Tags },
]

const currentRoute = computed(() => route.path)
</script>

<template>
  <div class="app-container">
    <!-- Desktop Sidebar Navigation -->
    <aside class="sidebar glass-card desktop-only">
      <div class="brand">
        <div class="brand-icon">
          <PiggyBank size="28" color="white" />
        </div>
        <span class="brand-text">Aura<strong>Budget</strong></span>
      </div>
      
      <nav class="nav-menu">
        <RouterLink 
          v-for="item in navigation" 
          :key="item.name" 
          :to="item.path"
          class="nav-item"
          :class="{ active: currentRoute === item.path }"
        >
          <component :is="item.icon" size="20" class="nav-icon" />
          <span>{{ item.name }}</span>
        </RouterLink>
      </nav>
      
      <div class="user-profile">
        <div class="avatar">U</div>
        <div class="user-info">
          <span class="user-name">User Account</span>
          <span class="user-email">guest@aurabudget</span>
        </div>
      </div>
    </aside>

    <!-- Mobile Bottom Navigation -->
    <nav class="mobile-nav glass-card mobile-only">
      <RouterLink 
        v-for="item in navigation" 
        :key="item.name" 
        :to="item.path"
        class="mobile-nav-item"
        :class="{ active: currentRoute === item.path }"
      >
        <component :is="item.icon" size="24" />
        <span class="mobile-nav-label">{{ item.name }}</span>
      </RouterLink>
    </nav>

    <!-- Main Content Area -->
    <main class="main-content animate-fade-in">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
/* Sidebar Styles */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100vh;
  border-radius: 0;
  border-left: none;
  border-top: none;
  border-bottom: none;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem;
  z-index: 40;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 3rem;
}

.brand-icon {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border-radius: 12px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4);
}

.brand-text {
  font-size: 1.5rem;
  font-weight: 300;
  letter-spacing: -0.5px;
}

.brand-text strong {
  font-weight: 700;
}

.nav-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.nav-item.active {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.15), transparent);
  color: var(--accent-primary);
  border-left: 3px solid var(--accent-primary);
}

.nav-item.active .nav-icon {
  color: var(--accent-primary);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--glass-border);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--text-primary);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.user-email {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Mobile Nav Styles */
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-around;
  padding: 0.75rem 0.5rem;
  border-radius: 0;
  border-bottom: none;
  border-left: none;
  border-right: none;
  z-index: 50;
  background: rgba(15, 23, 42, 0.85);
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-secondary);
  text-decoration: none;
}

.mobile-nav-item.active {
  color: var(--accent-primary);
}

.mobile-nav-label {
  font-size: 0.65rem;
  font-weight: 500;
}

/* Responsive Display Classes */
.desktop-only {
  display: none;
}

.mobile-only {
  display: flex;
}

@media (min-width: 768px) {
  .desktop-only {
    display: flex;
  }
  .mobile-only {
    display: none;
  }
}
</style>
