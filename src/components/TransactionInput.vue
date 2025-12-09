<script setup lang="ts">
import { ref } from 'vue';
import { createTransaction, getTransactionDetail, getCurrentLocation } from '../services/transactionService';

const inputText = ref('');
const sourceInput = ref('cash'); // Default ke Cash
const isLoading = ref(false);
const statusMessage = ref('');
const result = ref<any>(null);
const errorMessage = ref('');

// Config User
const USER_ID = "user-debug-001"; 

const handleSubmit = async () => {
  if (!inputText.value) return;
  
  isLoading.value = true;
  errorMessage.value = '';
  result.value = null;
  statusMessage.value = 'Mengambil lokasi...';

  try {
    // 1. Ambil Lokasi
    let lat = 0;
    let lng = 0;
    
    try {
      const loc = await getCurrentLocation();
      if (loc.lat !== 0) {
        lat = loc.lat;
        lng = loc.lng;
      }
    } catch (e) {
      console.warn("Lanjut tanpa lokasi presisi.");
    }

    // 2. Kirim ke Transaction Service
    statusMessage.value = 'Mengirim data ke Cloud...';
    
    // PAYLOAD FINAL SESUAI REQUEST
    const payload = {
      user_id: USER_ID,
      description: inputText.value,
      source: sourceInput.value, // <--- Menggunakan input dari user
      latitude: lat,
      longitude: lng
    };

    // console.log("Payload:", payload); 

    const createRes = await createTransaction(payload);
    const transactionId = createRes.id;

    // 3. Polling
    statusMessage.value = 'AI sedang memproses...';
    await pollForCompletion(transactionId);

  } catch (err: any) {
    console.error(err);
    errorMessage.value = err.message || 'Gagal mengirim transaksi.';
    isLoading.value = false;
  }
};

const pollForCompletion = async (txId: string) => {
  const maxRetries = 15; 
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;
    try {
      const txData = await getTransactionDetail(txId, USER_ID);
      
      if (txData.is_processed === true) {
        clearInterval(interval);
        result.value = txData;
        isLoading.value = false;
        statusMessage.value = 'Selesai!';
      } else if (attempts >= maxRetries) {
        clearInterval(interval);
        isLoading.value = false;
        errorMessage.value = 'Timeout: AI belum selesai merespon.';
      }
    } catch (e) {
      // Ignore polling error
    }
  }, 2000);
};
</script>

<template>
  <div class="container">
    <h2>Input Transaksi Cloud ☁️</h2>
    <p class="subtitle">Biarkan AI mendeteksi nominal & kategori dari teks.</p>
    
    <div class="input-group">
      
      <label for="source">Metode Pembayaran:</label>
      <select v-model="sourceInput" id="source">
        <option value="cash">Tunai (Cash)</option>
        <option value="qris">QRIS</option>
        <option value="transfer">Transfer Bank</option>
        <option value="ewallet">E-Wallet</option>
        <option value="cc">Kartu Kredit</option>
      </select>

      <label for="desc">Deskripsi Transaksi:</label>
      <textarea 
        id="desc"
        v-model="inputText" 
        placeholder="Contoh: 5k bayar parkir" 
        rows="3"
      ></textarea>
      
      <button @click="handleSubmit" :disabled="isLoading">
        {{ isLoading ? statusMessage : 'Kirim Transaksi' }}
      </button>
    </div>

    <div v-if="result" class="result-card">
      <h3>✅ Selesai!</h3>
      <div class="result-item">
        <span class="label">Deskripsi:</span>
        <span class="value">{{ result.description }}</span>
      </div>
      <div class="result-item highlight">
        <span class="label">Nominal (AI):</span>
        <span class="value">Rp {{ result.amount ? result.amount.toLocaleString() : '0' }}</span>
      </div>
      <div class="result-item">
        <span class="label">Kategori:</span>
        <span class="value">{{ result.category?.name }}</span>
      </div>
      <div class="result-item">
        <span class="label">Metode:</span>
        <span class="value" style="text-transform: capitalize;">{{ result.source }}</span>
      </div>
       <div class="result-item">
        <span class="label">Lokasi:</span>
        <span class="value">{{ result.location?.city || 'Unknown' }}</span>
      </div>
    </div>

    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
  </div>
</template>

<style scoped>
.container { max-width: 500px; margin: 2rem auto; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 12px; font-family: 'Segoe UI', sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.subtitle { color: #666; font-size: 0.9rem; margin-bottom: 15px; }
.input-group { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }

/* Styling untuk Input & Select */
label { font-size: 0.9rem; font-weight: 600; color: #475569; margin-bottom: -8px;}
textarea, select { padding: 12px; border-radius: 6px; border: 1px solid #ccc; font-size: 16px; background-color: white; }
textarea { resize: vertical; }

button { padding: 12px; background-color: #0078d4; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background 0.2s; }
button:hover:not(:disabled) { background-color: #0063b1; }
button:disabled { background-color: #ccc; cursor: not-allowed; }

.result-card { background-color: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0; color: #1e293b; display: flex; flex-direction: column; gap: 8px; }
.result-item { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #cbd5e1; padding-bottom: 5px; }
.result-item:last-child { border-bottom: none; }
.label { font-size: 0.9rem; color: #64748b; }
.value { font-weight: 600; }
.highlight .value { color: #16a34a; font-size: 1.1rem; }

.error { color: #dc2626; margin-top: 10px; font-size: 0.9rem; background: #fef2f2; padding: 10px; border-radius: 4px; }
</style>