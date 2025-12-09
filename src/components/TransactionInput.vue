<script setup lang="ts">
import { ref } from 'vue';
import { createTransaction, getTransactionDetail, getCurrentLocation } from '../services/transactionService';

// State
const token = ref(''); // Input untuk Bearer Token
const inputText = ref('');
const sourceInput = ref('cash');
const selectedFile = ref<File | null>(null); // State untuk file gambar
const isLoading = ref(false);
const statusMessage = ref('');
const result = ref<any>(null);
const errorMessage = ref('');

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
  // Validasi Token Wajib
  if (!token.value) {
    errorMessage.value = "Mohon masukkan Bearer Token!";
    return;
  }

  // Validasi: Harus ada Gambar ATAU Deskripsi
  if (!selectedFile.value && !inputText.value) {
    errorMessage.value = "Mohon isi deskripsi atau upload gambar struk.";
    return;
  }
  
  isLoading.value = true;
  errorMessage.value = '';
  result.value = null;
  statusMessage.value = 'Mengambil lokasi...';

  try {
    // 1. Ambil Lokasi (Opsional)
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

    // 2. Siapkan Payload & Kirim ke Cloud
    statusMessage.value = 'Mengirim data ke Cloud...';
    
    let payload;
    let isMultipart = false;

    if (selectedFile.value) {
      // --- SKENARIO A: UPLOAD GAMBAR (Multipart) ---
      isMultipart = true;
      const formData = new FormData();
      formData.append('image', selectedFile.value); // Sesuai backend: req.files['image']
      formData.append('source', sourceInput.value);
      formData.append('latitude', lat.toString());
      formData.append('longitude', lng.toString());
      
      // Description boleh kosong jika gambar ada (sesuai logika backend)
      if (inputText.value) {
        formData.append('description', inputText.value);
      }
      
      payload = formData;

    } else {
      // --- SKENARIO B: TEXT ONLY (JSON) ---
      isMultipart = false;
      payload = {
        description: inputText.value,
        source: sourceInput.value,
        latitude: lat,
        longitude: lng
      };
      // Note: Kita TIDAK kirim user_id lagi di body, backend ambil dari token
    }

    // Panggil Service dengan Token
    const createRes = await createTransaction(payload, token.value, isMultipart);
    
    // Response dari backend formatnya: { message: "...", data: { id: "..." } }
    const transactionId = createRes.data.id; 

    // 3. Polling Hasil AI
    statusMessage.value = 'AI sedang memproses...';
    await pollForCompletion(transactionId);

  } catch (err: any) {
    console.error(err);
    errorMessage.value = err.message || 'Gagal mengirim transaksi.';
    isLoading.value = false;
  }
};

const pollForCompletion = async (txId: string) => {
  const maxRetries = 20; // Tambah dikit karena proses gambar mungkin lebih lama
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;
    try {
      // Pass token ke fungsi getTransactionDetail
      const txData = await getTransactionDetail(txId, token.value);
      
      if (txData.is_processed === true) {
        clearInterval(interval);
        result.value = txData;
        isLoading.value = false;
        statusMessage.value = 'Selesai!';
        // Reset form setelah sukses (opsional)
        // selectedFile.value = null;
        // inputText.value = '';
      } else if (attempts >= maxRetries) {
        clearInterval(interval);
        isLoading.value = false;
        errorMessage.value = 'Timeout: AI belum selesai merespon.';
      }
    } catch (e) {
      // Ignore polling error (misal 404 sebentar saat data belum masuk DB)
    }
  }, 2000);
};
</script>

<template>
  <div class="container">
    <h2>Input Transaksi Cerdas 🧠</h2>
    <p class="subtitle">Upload struk atau tulis deskripsi, AI yang akan catat.</p>
    
    <div class="input-group">
      
      <label for="token">Bearer Token (JWT):</label>
      <input 
        type="password" 
        id="token" 
        v-model="token" 
        placeholder="Paste token JWT disini..." 
        class="token-input"
      />

      <label for="source">Metode Pembayaran:</label>
      <select v-model="sourceInput" id="source">
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
      />
      <div v-if="selectedFile" class="file-preview">
        📁 {{ selectedFile.name }}
      </div>

      <label for="desc">Deskripsi / Catatan:</label>
      <textarea 
        id="desc"
        v-model="inputText" 
        :placeholder="selectedFile ? 'Tambahan catatan (opsional)...' : 'Contoh: 15rb Nasi Goreng'" 
        rows="3"
      ></textarea>
      
      <button @click="handleSubmit" :disabled="isLoading">
        {{ isLoading ? statusMessage : 'Kirim Transaksi' }}
      </button>
    </div>

    <div v-if="result" class="result-card">
      <h3>✅ Selesai!</h3>
      
      <div v-if="result.image_url" class="result-image">
        <a :href="result.image_url" target="_blank">Lihat Bukti Foto</a>
      </div>

      <div class="result-item">
        <span class="label">Deskripsi Final:</span>
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
      <div class="result-item">
        <span class="label">Lokasi:</span>
        <span class="value">{{ result.location?.city || 'Unknown' }}</span>
      </div>
    </div>

    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
  </div>
</template>

<style scoped>
/* Styling Tambahan */
.token-input {
  padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-family: monospace; font-size: 0.8rem; background: #f8fafc;
}
input[type="file"] {
  padding: 8px; background: white; border: 1px dashed #ccc; border-radius: 6px;
}
.file-preview {
  font-size: 0.8rem; color: #059669; margin-top: -8px; margin-bottom: 8px;
}
.result-image a {
  font-size: 0.9rem; color: #0078d4; text-decoration: none; font-weight: 600;
}
.badge {
  background: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 12px; font-size: 0.85rem;
}

/* Style Lama Tetap Ada */
.container { max-width: 500px; margin: 2rem auto; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 12px; font-family: 'Segoe UI', sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.subtitle { color: #666; font-size: 0.9rem; margin-bottom: 15px; }
.input-group { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
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