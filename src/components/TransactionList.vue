<script setup lang="ts">
import { ref, onMounted, computed, defineExpose } from 'vue';
import { getUserHistory } from '../services/transactionService';

// --- STATE ---
const transactions = ref<any[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

// --- PAGINATION STATE ---
const currentPage = ref(1);
const itemsPerPage = 5; // Tampilkan 5 transaksi per halaman

// --- COMPUTED: PAGINATION LOGIC ---
const totalPages = computed(() => {
  return Math.ceil(transactions.value.length / itemsPerPage);
});

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return transactions.value.slice(start, end);
});

// --- NAVIGATION FUNCTIONS ---
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

// --- HELPERS ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date);
};

const truncateText = (text: string | null) => {
  if (!text) return 'Tidak ada deskripsi';
  const cleanText = text.replace(/\n/g, ' '); 
  if (cleanText.length <= 60) return cleanText;
  return cleanText.substring(0, 60) + '...';
};

// Helper untuk Cek Tipe (Income/Expense)
const getTransactionType = (trx: any) => {
  // Cek dari object category
  if (trx.category && trx.category.category_type) {
    return trx.category.category_type; // 'Income' atau 'Expense'
  }
  // Default fallback
  return 'Expense';
};

// --- FETCH DATA ---
const fetchTransactions = async () => {
  const token = localStorage.getItem('fintrack_token');
  if (!token) return;

  isLoading.value = true;
  try {
    const response = await getUserHistory(token);
    // Sort agar yang terbaru ada di paling atas
    transactions.value = response.data.sort((a: any, b: any) => {
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });
    
    // Reset ke halaman 1 setiap kali fetch baru
    currentPage.value = 1;
  } catch (err: any) {
    errorMessage.value = "Gagal memuat data.";
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchTransactions();
});

defineExpose({ fetchTransactions });
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
    <div v-else-if="transactions.length === 0" class="empty-state">
      Belum ada transaksi.
    </div>

    <div v-else>
      <div class="transaction-list">
        <div 
          v-for="trx in paginatedTransactions" 
          :key="trx.id" 
          class="trx-card"
          :class="{ 'processing': !trx.is_processed }"
        >
          
          <div class="card-header">
            <span class="date">{{ formatDate(trx.date) }}</span>
            <span v-if="!trx.is_processed" class="badge-pending">⏳ Pending AI</span>
            <span v-else class="badge-category">{{ trx.category?.name || 'Uncategorized' }}</span>
          </div>

          <div class="card-body">
            <div class="description">
              {{ truncateText(trx.description) }}
            </div>
            
            <div 
              class="amount" 
              :class="{
                'text-income': getTransactionType(trx) === 'Income',
                'text-expense': getTransactionType(trx) === 'Expense'
              }"
            >
              {{ getTransactionType(trx) === 'Income' ? '+' : '-' }} 
              {{ formatCurrency(trx.amount) }}
            </div>
          </div>

          <div v-if="trx.image_url" class="card-footer">
             <a :href="trx.image_url" target="_blank" class="link-receipt">📎 Bukti Struk</a>
          </div>

        </div>
      </div>

      <div class="pagination-controls" v-if="totalPages > 1">
        <button 
          @click="prevPage" 
          :disabled="currentPage === 1" 
          class="page-btn"
        >
          &laquo; Prev
        </button>
        
        <span class="page-info">
          Page <b>{{ currentPage }}</b> of {{ totalPages }}
        </span>
        
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages" 
          class="page-btn"
        >
          Next &raquo;
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.history-container { max-width: 500px; margin: 2rem auto; font-family: 'Segoe UI', sans-serif; }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
h3 { margin: 0; color: #334155; }

.refresh-btn { background: none; border: 1px solid #e2e8f0; cursor: pointer; font-size: 1.2rem; padding: 4px 8px; border-radius: 6px; transition: all 0.2s; }
.refresh-btn:hover { background-color: #f1f5f9; }
.refresh-btn.spinning { animation: spin 1s linear infinite; cursor: wait; }
@keyframes spin { 100% { transform: rotate(360deg); } }

.loading-state, .empty-state { text-align: center; padding: 20px; color: #64748b; background: #f8fafc; border-radius: 8px; }
.error-msg { color: #dc2626; background: #fee2e2; padding: 1rem; border-radius: 8px; text-align: center; }

/* CARD STYLING */
.transaction-list { display: flex; flex-direction: column; gap: 12px; min-height: 300px; /* Biar tinggi konsisten */ }
.trx-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.03); transition: transform 0.2s; }
.trx-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.06); }
.trx-card.processing { border-left: 4px solid #f59e0b; background: #fffbeb; }

.card-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.8rem; color: #94a3b8; }
.badge-category { background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 0.75rem; }
.badge-pending { background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 0.75rem; }

.card-body { display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; }
.description { font-size: 0.95rem; color: #334155; line-height: 1.4; flex: 1; }
.amount { font-weight: 700; font-size: 1rem; white-space: nowrap; }

/* WARNA UTAMA */
.text-expense { color: #ef4444; /* Merah */ }
.text-income { color: #16a34a; /* Hijau */ }

.card-footer { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e2e8f0; font-size: 0.85rem; }
.link-receipt { color: #0ea5e9; text-decoration: none; font-weight: 500; }
.link-receipt:hover { text-decoration: underline; }

/* PAGINATION CONTROLS */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #f1f5f9;
}

.page-btn {
  padding: 6px 12px;
  background-color: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  color: #334155;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) { background-color: #f1f5f9; border-color: #94a3b8; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; background-color: #f8fafc; }
.page-info { font-size: 0.9rem; color: #64748b; }
</style>