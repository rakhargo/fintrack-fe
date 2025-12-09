<script setup lang="ts">
import { ref } from 'vue';
import { createTransaction, getTransactionDetail, getCurrentLocation } from '../services/transactionService';

const inputText = ref('');
const amountInput = ref(0); // Input manual amount jika perlu
const isLoading = ref(false);
const statusMessage = ref('');
const result = ref<any>(null);
const errorMessage = ref('');

// Hardcode user sementara (sesuai request payload Anda)
const USER_ID = "user-debug-001"; 

const handleSubmit = async () => {
  if (!inputText.value) return;
  
  isLoading.value = true;
  errorMessage.value = '';
  result.value = null;
  statusMessage.value = 'Mengambil lokasi...';

  try {
    // 1. Ambil Lokasi User
    let lat, lng;
    try {
      const loc = await getCurrentLocation();
      lat = loc.lat;
      lng = loc.lng;
    } catch (e) {
      console.warn("Gagal ambil lokasi, lanjut tanpa lokasi.");
    }

    // 2. Kirim ke Transaction Service
    statusMessage.value = 'Mengirim data ke Cloud...';
    
    const payload = {
      user_id: USER_ID,
      description: inputText.value,
      amount: amountInput.value, // Kirim 0 jika ingin AI yg deteksi
      source: "manual_input",
      latitude: lat,
      longitude: lng
    };

    const createRes = await createTransaction(payload);
    const transactionId = createRes.id;

    // 3. Polling: Tunggu AI Selesai (Cek tiap 2 detik)
    statusMessage.value = 'Menunggu analisis AI...';
    
    await pollForCompletion(transactionId);

  } catch (err: any) {
    errorMessage.value = err.message || 'Terjadi kesalahan.';
    isLoading.value = false;
  }
};

// Logika Polling
const pollForCompletion = async (txId: string) => {
  const maxRetries = 10; // Maksimal coba 10x (20 detik)
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;
    try {
      const txData = await getTransactionDetail(txId, USER_ID);
      
      // Cek field 'is_processed' yang di-update oleh AI Service nanti
      if (txData.is_processed === true) {
        clearInterval(interval);
        result.value = txData; // Data lengkap dari DB (ada category, confidence, dll)
        isLoading.value = false;
        statusMessage.value = 'Selesai!';
      } else if (attempts >= maxRetries) {
        clearInterval(interval);
        isLoading.value = false;
        errorMessage.value = 'AI terlalu lama merespon (Timeout). Cek manual nanti.';
      }
    } catch (e) {
      // Ignore error saat polling, coba lagi next tick
      console.log("Polling error, retrying...");
    }
  }, 2000); // Cek setiap 2000ms (2 detik)
};
</script>

<template>
  <div class="container">
    <h2>Input Transaksi Cloud ☁️</h2>
    
    <div class="input-group">
      <input type="number" v-model="amountInput" placeholder="Nominal (Opsional)" />
      <textarea v-model="inputText" placeholder="Deskripsi (cth: 'Beli Nasi Padang')" rows="3"></textarea>
      
      <button @click="handleSubmit" :disabled="isLoading">
        {{ isLoading ? statusMessage : 'Kirim & Analisis' }}
      </button>
    </div>

    <div v-if="result" class="result-card">
      <h3>✅ Transaksi Tercatat!</h3>
      <ul>
        <li><strong>ID:</strong> {{ result.id.substring(0, 8) }}...</li>
        <li><strong>Lokasi:</strong> {{ result.location?.city || 'Unknown' }}</li>
        <li><strong>Kategori (AI):</strong> {{ result.category?.name }}</li>
        <li><strong>Tipe:</strong> {{ result.category?.category_type }}</li>
        <li><strong>Amount Final:</strong> Rp {{ result.amount.toLocaleString() }}</li>
      </ul>
    </div>

    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
  </div>
</template>

<style scoped>
/* Gunakan style yang sama seperti sebelumnya */
.container { max-width: 500px; margin: 2rem auto; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; font-family: sans-serif; }
.input-group { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
input, textarea { padding: 10px; border-radius: 4px; border: 1px solid #ccc; font-size: 16px; }
button { padding: 10px; background-color: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;}
button:disabled { background-color: #ccc; cursor: not-allowed; }
.result-card { background-color: #f0fdf4; padding: 15px; border-radius: 6px; border: 1px solid #bbf7d0; color: black; }
.error { color: red; margin-top: 10px; }
</style>