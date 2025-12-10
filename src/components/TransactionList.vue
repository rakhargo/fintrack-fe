<script setup lang="ts">
import { ref, onMounted, defineExpose } from 'vue'; // Tambah defineExpose
import { getUserHistory } from '../services/transactionService';

// ... (State & Helpers sama seperti sebelumnya) ...
const transactions = ref<any[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

// Helper formats (sama seperti sebelumnya)
const formatCurrency = (amount: number) => { /*...*/ return amount.toLocaleString('id-ID'); };
const formatDate = (dateString: string | null) => { /*...*/ return dateString; };
const truncateText = (text: string | null) => { /*...*/ return text; };

// --- FETCH DATA ---
const fetchTransactions = async () => {
  const token = localStorage.getItem('fintrack_token');
  if (!token) return;

  isLoading.value = true; // Set loading true biar ada efek muter/loading
  try {
    const response = await getUserHistory(token);
    transactions.value = response.data; 
  } catch (err: any) {
    errorMessage.value = "Gagal memuat data.";
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchTransactions();
});

// PENTING: Expose fungsi ini agar bisa dipanggil dari DashboardView
defineExpose({
  fetchTransactions
});
</script>

<template>
  <div class="history-container">
    <div class="header-row">
      <h3>📜 Riwayat Transaksi</h3>
      
      <button 
        @click="fetchTransactions" 
        class="refresh-btn" 
        :class="{ 'spinning': isLoading }"
        title="Refresh Data"
      >
        🔄
      </button>
    </div>

    <div v-if="isLoading && transactions.length === 0" class="loading-state">
      Memuat data...
    </div>

    <div v-else-if="errorMessage" class="error-msg">
      {{ errorMessage }}
    </div>

    <div v-else class="transaction-list">
      <div v-for="trx in transactions" :key="trx.id" class="trx-card" :class="{ 'processing': !trx.is_processed }">
        <div class="card-header">
            <span class="date">{{ formatDate(trx.date) }}</span>
            <span v-if="!trx.is_processed" class="badge-pending">⏳ Pending AI</span>
            <span v-else class="badge-category">{{ trx.category || 'Uncategorized' }}</span>
          </div>
          <div class="card-body">
            <div class="description">{{ truncateText(trx.description) }}</div>
            <div class="amount">Rp {{ formatCurrency(trx.amount) }}</div>
          </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ... Style sebelumnya ... */
.history-container { max-width: 500px; margin: 2rem auto; font-family: 'Segoe UI', sans-serif; }

/* Header dengan tombol refresh */
.header-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;
}
h3 { margin: 0; color: #334155; }

/* Style Tombol Refresh */
.refresh-btn {
  background: none; border: 1px solid #e2e8f0; cursor: pointer;
  font-size: 1.2rem; padding: 4px 8px; border-radius: 6px;
  transition: all 0.2s;
}
.refresh-btn:hover { background-color: #f1f5f9; }

/* Animasi Putar saat Loading */
.refresh-btn.spinning {
  animation: spin 1s linear infinite;
  cursor: wait;
}

@keyframes spin { 100% { transform: rotate(360deg); } }

/* ... Sisa CSS Card sama seperti sebelumnya ... */
.transaction-list { display: flex; flex-direction: column; gap: 12px; }
.trx-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }
.trx-card.processing { border-left: 4px solid #f59e0b; background: #fffbeb; }
.card-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.8rem; color: #94a3b8; }
.badge-category { background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 0.75rem; }
.badge-pending { background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 0.75rem; }
.card-body { display: flex; justify-content: space-between; font-weight: 600; }
</style>