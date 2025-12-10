<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import { logoutUser } from './services/authService';

const route = useRoute();
const router = useRouter();

// Logic: Cek apakah kita sedang di halaman Auth (Login/Register)
const isAuthPage = computed(() => {
  return route.name === 'login' || route.name === 'register';
});

const handleLogout = () => {
  const confirm = window.confirm("Yakin ingin keluar?");
  if (confirm) {
    logoutUser(); 
    router.push('/'); 
  }
};
</script>

<template>
  <header v-if="!isAuthPage">
    <div class="header-content">
      <div class="brand">
        <h1>Fintrack Cloud ☁️</h1>
        <nav class="main-nav" v-if="!isAuthPage">
          <RouterLink to="/" active-class="active">Input</RouterLink> | 
          <RouterLink to="/reports" active-class="active">Laporan</RouterLink>
        </nav>
      </div>
            
      <button @click="handleLogout" class="logout-btn">
        Logout 🚪
      </button>
    </div>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<style scoped>
header {
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 0;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.header-content {
  max-width: 500px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h1 {
  font-size: 1.5rem;
  margin: 0;
  color: #0f172a;
}

.logout-btn {
  background-color: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;
}

.logout-btn:hover {
  background-color: #ef4444;
  color: white;
}

/* Pastikan main mengambil sisa ruang */
main {
  width: 100%;
}
.main-nav { margin-top: 5px; font-size: 0.9rem; }
.main-nav a { text-decoration: none; color: #64748b; font-weight: 600; margin: 0 5px; }
.main-nav a.active { color: #0f172a; border-bottom: 2px solid #0f172a; }
</style>