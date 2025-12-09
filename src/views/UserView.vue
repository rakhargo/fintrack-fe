<template>
  <div style="padding: 20px; max-width: 600px; margin: auto;">
    <h1>Input Transaksi</h1>

    <div style="margin-bottom: 20px;">
      <button 
        @click="mode = 'text'" 
        :style="{ backgroundColor: mode === 'text' ? '#4CAF50' : '#ddd', color: mode === 'text' ? 'white' : 'black' }"
      >Manual Text</button>
      
      <button 
        @click="mode = 'image'" 
        :style="{ backgroundColor: mode === 'image' ? '#4CAF50' : '#ddd', color: mode === 'image' ? 'white' : 'black' }"
        style="margin-left: 10px;"
      >Scan Struk</button>
    </div>

    <div v-if="mode === 'text'" class="form-group">
      <label>Deskripsi:</label>
      <input v-model="form.description" placeholder="Contoh: Nasi Goreng Spesial" />
      
      <label>Total Harga:</label>
      <input v-model="form.amount" type="number" placeholder="0" />
    </div>

    <div v-else class="form-group">
      <label>Upload Struk:</label>
      <input type="file" @change="handleFileUpload" accept="image/*" />
    </div>

    <div class="form-group">
      <label>Metode Pembayaran:</label>
      <select v-model="form.source" style="width: 100%; padding: 8px; margin-top: 5px;">
        <option value="cash">Cash / Tunai</option>
        <option value="transfer">Transfer Bank</option>
        <option value="qris">QRIS</option>
        <option value="credit_card">Kartu Kredit</option>
        <option value="lainnya">Lainnya</option>
      </select>
    </div>

    <button @click="submitTransaction" :disabled="isLoading" style="margin-top: 20px;">
      {{ isLoading ? 'Loading...' : 'Kirim Transaksi' }}
    </button>

    <div v-if="statusMessage" style="margin-top: 20px; padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9;">
      <h3>Status: {{ statusMessage }}</h3>
      <div v-if="result">
        <p><strong>ID:</strong> {{ result.id }}</p>
        <p><strong>Deskripsi:</strong> {{ result.description }}</p>
        <p><strong>Pembayaran:</strong> {{ result.source }}</p>
        <p><strong>Kategori AI:</strong> {{ result.category.name }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import api from '../services/api';

const mode = ref('text'); // 'text' atau 'image'
const isLoading = ref(false);
const statusMessage = ref('');
const result = ref(null);
const file = ref(null);

const form = reactive({
  description: '',
  amount: 0,
  source: 'cash', // Default value dropdown
  latitude: -6.200000, 
  longitude: 106.816666
});

const handleFileUpload = (event) => {
  file.value = event.target.files[0];
};

const submitTransaction = async () => {
  isLoading.value = true;
  statusMessage.value = 'Mengirim data...';
  result.value = null;

  try {
    let response;
    
    if (mode.value === 'text') {
      // --- SKENARIO 1: KIRIM JSON ---
      response = await api.post('/transaction/create', {
        description: form.description,
        amount: form.amount,
        source: form.source, // <--- Kirim Source dari Dropdown
        latitude: form.latitude,
        longitude: form.longitude
      });
    } else {
      // --- SKENARIO 2: KIRIM MULTIPART (GAMBAR) ---
      if (!file.value) {
        alert("Pilih gambar dulu!");
        isLoading.value = false;
        return;
      }
      const formData = new FormData();
      formData.append('image', file.value);
      formData.append('source', form.source); // <--- Kirim Source dari Dropdown
      formData.append('latitude', form.latitude);
      formData.append('longitude', form.longitude);
      
      // Opsional: Kirim description/amount kalau user mau isi manual meski upload gambar
      // formData.append('description', 'Struk Upload'); 
      
      response = await api.post('/transaction/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }

    const transactionId = response.data.data.id;
    statusMessage.value = 'Data masuk! ID: ' + transactionId;
    
    // Langsung tampilkan hasil dari respon create (karena backend balikin object lengkap)
    // Kalau mau polling status AI, aktifkan startPolling(transactionId)
    result.value = response.data.data; 
    
    isLoading.value = false;

  } catch (error) {
    console.error(error);
    statusMessage.value = 'Error: ' + (error.response?.data?.error || error.message);
    isLoading.value = false;
  }
};
</script>

<style scoped>
.form-group { margin-bottom: 15px; }
.form-group label { display: block; font-weight: bold; margin-bottom: 5px; }
.form-group input, .form-group select { 
  display: block; 
  width: 100%; 
  padding: 8px; 
  box-sizing: border-box; 
}
button { 
  padding: 10px 20px; 
  cursor: pointer; 
  border: none; 
  border-radius: 4px; 
  background-color: #4CAF50; 
  color: white; 
  font-size: 16px;
}
button:disabled { background-color: #ccc; cursor: not-allowed; }
</style>