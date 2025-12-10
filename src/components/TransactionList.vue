<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getUserHistory } from '../services/transactionService';

// --- STATE ---
const transactions = ref<any[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

// --- HELPERS (FORMATTING) ---

// 1. Format Rupiah
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// 2. Format Tanggal (Contoh: 10 Des 2025, 15:30)
const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date);
};

// 3. Potong Teks Panjang (Agar struk tidak memenuhi layar)
const truncateText = (text: string | null, maxLength: number = 80) => {
  if (!text) return 'Tidak ada deskripsi';
  // Hapus newlines (\n) biar jadi satu baris rapi
  const cleanText = text.replace(/\n/g, ' '); 
  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.substring(0, maxLength) + '...';
};

// --- FETCH DATA ---
const fetchTransactions = async () => {
  const token = localStorage.getItem('fintrack_token');
  if (!token) {
    errorMessage.value = "Token tidak ditemukan. Silakan login.";
    isLoading.value = false;
    return;
  }

  try {
    const response = await getUserHistory(token);
    // Response API Anda: { message: "...", data: [...] }
    transactions.value = response.data; 
  } catch (err: any) {
    console.error(err);
    errorMessage.value = "Gagal memuat data transaksi.";
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchTransactions();
});
</script>

<template>
  <div class="history-container">
    <h3>📜 Riwayat Transaksi</h3>

    <div v-if="isLoading" class="loading-state">
      Memuat data...
    </div>

    <div v-else-if="errorMessage" class="error-msg">
      {{ errorMessage }}
    </div>

    <div v-else-if="transactions.length === 0" class="empty-state">
      Belum ada transaksi. Yuk catat pengeluaranmu!
    </div>

    <div v-else class="transaction-list">
      <div 
        v-for="trx in transactions" 
        :key="trx.id" 
        class="trx-card"
        :class="{ 'processing': !trx.is_processed }"
      >
        
        <div class="card-header">
          <span class="date">{{ formatDate(trx.date) }}</span>
          <span v-if="!trx.is_processed" class="badge-pending">⏳ Pending AI</span>
          <span v-else class="badge-category">{{ trx.category || 'Uncategorized' }}</span>
        </div>

        <div class="card-body">
          <div class="description">
            {{ truncateText(trx.description) }}
          </div>
          <div class="amount">
            {{ formatCurrency(trx.amount) }}
          </div>
        </div>

        <div v-if="trx.image_url" class="card-footer">
          <a :href="trx.image_url" target="_blank" class="link-receipt">
            📎 Lihat Struk Asli
          </a>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.history-container {
  max-width: 500px;
  margin: 2rem auto;
  font-family: 'Segoe UI', sans-serif;
}

h3 { color: #334155; margin-bottom: 1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }

.loading-state, .empty-state { text-align: center; color: #64748b; padding: 2rem; background: #f8fafc; border-radius: 8px; }
.error-msg { color: #dc2626; background: #fee2e2; padding: 1rem; border-radius: 8px; text-align: center; }

/* CARD STYLING */
.transaction-list { display: flex; flex-direction: column; gap: 12px; }

.trx-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.03);
  transition: transform 0.2s;
}

.trx-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.06); }

/* Jika sedang diproses (Pending) warnanya agak beda */
.trx-card.processing {
  border-left: 4px solid #f59e0b; /* Kuning */
  background: #fffbeb;
}

.card-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
}

.date { font-size: 0.8rem; color: #94a3b8; }

.badge-category {
  background: #dbeafe; color: #1e40af; font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; font-weight: 600;
}
.badge-pending {
  background: #fef3c7; color: #b45309; font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; font-weight: 600;
}

.card-body {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;
}

.description {
  font-size: 0.95rem; color: #334155; line-height: 1.4; flex: 1;
}

.amount {
  font-weight: 700; color: #0f172a; font-size: 1rem; white-space: nowrap;
}

.card-footer {
  margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e2e8f0; font-size: 0.85rem;
}

.link-receipt {
  color: #0ea5e9; text-decoration: none; font-weight: 500; display: flex; align-items: center; gap: 4px;
}
.link-receipt:hover { text-decoration: underline; }
</style>