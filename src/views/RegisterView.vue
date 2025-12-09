<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { register } from '../services/authService';

const name = ref('');
const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const router = useRouter();

const handleRegister = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    await register(name.value, email.value, password.value);
    alert("Registrasi Berhasil! Silakan Login.");
    router.push('/login'); 
  } catch (err: any) {
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="card">
      <h2>📝 Daftar Akun Baru</h2>
      <form @submit.prevent="handleRegister">
        <div class="input-group">
          <label>Nama Lengkap</label>
          <input type="text" v-model="name" required placeholder="John Doe" />
        </div>

        <div class="input-group">
          <label>Email</label>
          <input type="email" v-model="email" required placeholder="nama@email.com" />
        </div>
        
        <div class="input-group">
          <label>Password</label>
          <input type="password" v-model="password" required placeholder="********" />
        </div>

        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Mendaftar...' : 'Daftar Sekarang' }}
        </button>

        <p class="error" v-if="errorMessage">{{ errorMessage }}</p>

        <p class="switch-link">
          Sudah punya akun? <router-link to="/login">Login di sini</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Gunakan style yang sama dengan LoginView agar konsisten */
.auth-container { display: flex; justify-content: center; align-items: center; min-height: 80vh; }
.card { width: 100%; max-width: 400px; padding: 2rem; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); background: white; }
h2 { text-align: center; color: #1e293b; margin-bottom: 1.5rem; }
.input-group { margin-bottom: 1rem; }
label { display: block; margin-bottom: 0.5rem; color: #64748b; font-size: 0.9rem; }
input { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }
button { width: 100%; padding: 0.75rem; background-color: #10b981; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 1rem; }
button:disabled { background-color: #94a3b8; }
.error { color: #ef4444; text-align: center; margin-top: 1rem; font-size: 0.9rem; }
.switch-link { text-align: center; margin-top: 1.5rem; font-size: 0.9rem; color: #64748b; }
a { color: #10b981; text-decoration: none; font-weight: 600; }
</style>