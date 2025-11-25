<script setup lang="ts">
import { ref } from 'vue';
import { analyzeTransaction, type AiResponse } from '../services/aiService';

const inputText = ref('');
const isLoading = ref(false);
const result = ref<AiResponse | null>(null);
const errorMessage = ref('');

const handleAnalyze = async () => {
  if (!inputText.value) return;
  
  isLoading.value = true;
  errorMessage.value = '';
  result.value = null;

  try {
    const data = await analyzeTransaction(inputText.value);
    result.value = data;
  } catch (err) {
    errorMessage.value = 'Gagal menghubungi AI Service. Pastikan CORS aktif di Azure.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="container">
    <h2>Input Transaksi</h2>
    <p>contoh: "20rb beli air putih"</p>

    <div class="input-group">
      <textarea 
        v-model="inputText" 
        placeholder="Masukkan catatan transaksi..." 
        rows="3"
      ></textarea>
      <button @click="handleAnalyze" :disabled="isLoading">
        {{ isLoading ? 'Sedang Menganalisis...' : 'Analisis AI' }}
      </button>
    </div>

    <div v-if="result" class="result-card">
      <h3>Hasil Deteksi:</h3>
      <ul>
        <li><strong>Kategori:</strong> {{ result.category_name }}</li>
        <li><strong>Tipe:</strong> {{ result.category_type }}</li>
        <li><strong>Jumlah:</strong> Rp {{ result.amount.toLocaleString() }}</li>
        <li><strong>Confidence:</strong> {{ (result.ai_confidence * 100).toFixed(1) }}%</li>
      </ul>
      <button class="save-btn">Simpan Transaksi</button>
    </div>

    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
  </div>
</template>

<style scoped>
.container { max-width: 500px; margin: 2rem auto; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; font-family: sans-serif; }
.input-group { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
textarea { padding: 10px; border-radius: 4px; border: 1px solid #ccc; font-size: 16px; }
button { padding: 10px; background-color: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;}
button:disabled { background-color: #ccc; cursor: not-allowed; }
.result-card { background-color: #f0fdf4; padding: 15px; border-radius: 6px; border: 1px solid #bbf7d0; color: black; }
.save-btn { background-color: #16a34a; margin-top: 10px; width: 100%; }
.error { color: red; margin-top: 10px; }
</style>