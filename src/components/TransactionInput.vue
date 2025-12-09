<script setup lang="ts">
import { ref, onMounted } from 'vue'; // Tambahkan onMounted
import { createTransaction, getTransactionDetail, getCurrentLocation } from '../services/transactionService';

// State
const token = ref(''); 
const inputText = ref('');
const sourceInput = ref('cash');
const selectedFile = ref<File | null>(null);
const isLoading = ref(false);
const statusMessage = ref('');
const result = ref<any>(null);
const errorMessage = ref('');
const isAuthError = ref(false); // Penanda jika user belum login

// 1. OTOMATIS AMBIL TOKEN SAAT LOAD
onMounted(() => {
  const storedToken = localStorage.getItem('fintrack_token');
  if (storedToken) {
    token.value = storedToken;
  } else {
    isAuthError.value = true;
    errorMessage.value = "Anda belum login (Token tidak ditemukan). Silakan login ulang.";
  }
});

// Handle File Selection
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
  } else {
    selectedFile.value = null;
  }
};

const handleSubmit = async () => {
  // Validasi: Token Wajib
  if (!token.value) {
    errorMessage.value = "Sesi kadaluarsa atau token hilang. Silakan login kembali.";
    return;
  }

  // Validasi: Input Kosong
  if (!selectedFile.value && !inputText.value) {
    errorMessage.value = "Mohon isi deskripsi atau upload gambar struk.";
    return;
  }
  
  isLoading.value = true;
  errorMessage.value = '';
  result.value = null;
  statusMessage.value = 'Mengambil lokasi...';

  try {
    // 2. Ambil Lokasi
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

    // 3. Kirim ke Cloud
    statusMessage.value = 'Mengirim data ke Cloud...';
    
    let payload;
    let isMultipart = false;

    if (selectedFile.value) {
      // MODE GAMBAR (Multipart)
      isMultipart = true;
      const formData = new FormData();
      formData.append('image', selectedFile.value);
      formData.append('source', sourceInput.value);
      formData.append('latitude', lat.toString());
      formData.append('longitude', lng.toString());
      if (inputText.value) formData.append('description', inputText.value);
      payload = formData;

    } else {
      // MODE TEKS (JSON)
      isMultipart = false;
      payload = {
        description: inputText.value,
        source: sourceInput.value,
        latitude: lat,
        longitude: lng
      };
    }

    // Panggil Service (Token diambil dari variable state yang sudah diisi onMounted)
    const createRes = await createTransaction(payload, token.value, isMultipart);
    const transactionId = createRes.data.id; 

    // 4. Polling Hasil
    statusMessage.value = 'AI sedang memproses...';
    await pollForCompletion(transactionId);

  } catch (err: any) {
    console.error(err);
    // Jika error 401 Unauthorized, suruh login lagi
    if (err.message.includes("401") || err.message.includes("Unauthorized")) {
      errorMessage.value = "Sesi habis. Silakan login ulang.";
      isAuthError.value = true;
    } else {
      errorMessage.value = err.message || 'Gagal mengirim transaksi.';
    }
    isLoading.value = false;
  }
};

const pollForCompletion = async (txId: string) => {
  const maxRetries = 40; 
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;
    try {
      const txData = await getTransactionDetail(txId, token.value);
      
      if (txData.is_processed === true) {
        clearInterval(interval);
        result.value = txData;
        isLoading.value = false;
        statusMessage.value = 'Selesai!';
        // Reset form
        selectedFile.value = null;
        inputText.value = '';
        // Reset file input value di DOM agar bisa pilih file yang sama lagi kalau mau
        const fileInput = document.getElementById('file') as HTMLInputElement;
        if(fileInput) fileInput.value = ''; 

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
    <h2>Input Transaksi</h2>
    
    <div v-if="isAuthError" class="auth-warning">
      ⚠️ Anda belum login. Silakan masuk ke halaman login terlebih dahulu.
    </div>

    <div class="input-group" :class="{ disabled: isAuthError }">
      
      <label for="source">Metode Pembayaran:</label>
      <select v-model="sourceInput" id="source" :disabled="isAuthError">
        <option value="cash">Tunai (Cash)</option>
        <option value="qris">QRIS</option>
        <option value="transfer">Transfer Bank</option>
        <option value="cc">Kartu Kredit</option>
      </select>

      <label for="file">Upload Foto Struk (Opsional):</label>
      <input 
        type="file" 
        id="file" 
        @change="handleFileChange" 
        accept="image/*"
        :disabled="isAuthError"
      />
      
      <label for="desc">Deskripsi / Catatan:</label>
      <textarea 
        id="desc"
        v-model="inputText" 
        :placeholder="selectedFile ? 'Tambahan catatan...' : 'Contoh: 15rb Nasi Goreng'" 
        rows="3"
        :disabled="isAuthError"
      ></textarea>
      
      <button @click="handleSubmit" :disabled="isLoading || isAuthError">
        {{ isLoading ? statusMessage : 'Kirim Transaksi' }}
      </button>
    </div>

    <div v-if="result" class="result-card">
      <h3>✅ Selesai!</h3>
      
      <div v-if="result.image_url" class="result-image">
        <a :href="result.image_url" target="_blank">Lihat Bukti Foto</a>
      </div>

      <div class="result-item">
        <span class="label">Deskripsi:</span>
        <span class="value">{{ result.description }}</span>
      </div>
      <div class="result-item highlight">
        <span class="label">Nominal:</span>
        <span class="value">Rp {{ result.amount ? result.amount.toLocaleString() : '0' }}</span>
      </div>
      <div class="result-item">
        <span class="label">Kategori:</span>
        <span class="value badge">{{ result.category?.name }}</span>
      </div>
    </div>

    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
  </div>
</template>

<style scoped>
.auth-warning {
  background-color: #fff3cd; color: #856404; padding: 10px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #ffeeba; font-size: 0.9rem;
}
.input-group.disabled { opacity: 0.6; pointer-events: none; }

/* Style Standar */
.container { max-width: 500px; margin: 2rem auto; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 12px; font-family: 'Segoe UI', sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.input-group { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
label { font-size: 0.9rem; font-weight: 600; color: #475569; margin-bottom: -8px;}
textarea, select, input[type="file"] { padding: 10px; border-radius: 6px; border: 1px solid #ccc; font-size: 16px; background-color: white; }
button { padding: 12px; background-color: #0078d4; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background 0.2s; }
button:hover:not(:disabled) { background-color: #0063b1; }
button:disabled { background-color: #ccc; cursor: not-allowed; }
.result-card { background-color: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0; color: #1e293b; display: flex; flex-direction: column; gap: 8px; }
.result-item { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #cbd5e1; padding-bottom: 5px; }
.result-item:last-child { border-bottom: none; }
.label { font-size: 0.9rem; color: #64748b; }
.value { font-weight: 600; }
.highlight .value { color: #16a34a; font-size: 1.1rem; }
.badge { background: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 12px; font-size: 0.85rem; }
.error { color: #dc2626; margin-top: 10px; font-size: 0.9rem; background: #fef2f2; padding: 10px; border-radius: 4px; }
</style>