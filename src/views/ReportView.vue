<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { generateReport, checkReportStatus, getReportHistory, type ReportItem } from '../services/reportService';

const reports = ref<ReportItem[]>([]);
const selectedYear = ref(new Date().getFullYear());
const isLoadingHistory = ref(false);
const isGenerating = ref(false);
const errorMessage = ref('');

// Menyimpan interval polling agar bisa di-stop saat pindah halaman
const activeIntervals: Record<string, number> = {};

// 1. Ambil History saat load
const fetchHistory = async () => {
  const token = localStorage.getItem('fintrack_token');
  if (!token) return;

  isLoadingHistory.value = true;
  try {
    const res = await getReportHistory(token);
    reports.value = res.data;

    // Cek jika ada yang masih "Accepted" atau "PROCESSING", lanjutkan polling
    reports.value.forEach(item => {
      if (item.status === 'Accepted' || item.status === 'PROCESSING') {
        startPolling(item.request_id);
      }
    });
  } catch (err: any) {
    errorMessage.value = "Gagal memuat riwayat laporan.";
  } finally {
    isLoadingHistory.value = false;
  }
};

// 2. Request Report Baru
const handleGenerate = async () => {
  const token = localStorage.getItem('fintrack_token');
  if (!token) return;

  isGenerating.value = true;
  errorMessage.value = '';

  try {
    // API Call
    const res = await generateReport(selectedYear.value, token);
    
    // Tambahkan item "dummy" ke list agar user langsung lihat
    const newReport: ReportItem = {
      request_id: res.request_id,
      year: selectedYear.value,
      status: 'Accepted', // Status awal
      file_url: null,
      created_at: new Date().toISOString()
    };
    
    // Masukkan ke paling atas
    reports.value.unshift(newReport);

    // Mulai Polling otomatis
    startPolling(newReport.request_id);

  } catch (err: any) {
    errorMessage.value = err.message || "Gagal membuat laporan.";
  } finally {
    isGenerating.value = false;
  }
};

// 3. Logika Polling (Cek status berulang-ulang)
const startPolling = (requestId: string) => {
  if (activeIntervals[requestId]) return; // Jangan double polling

  const token = localStorage.getItem('fintrack_token');
  if (!token) return;

  // Set Interval setiap 3 detik
  const intervalId = window.setInterval(async () => {
    try {
      const statusRes = await checkReportStatus(requestId, token);
      
      // Update data di list local
      const index = reports.value.findIndex(r => r.request_id === requestId);
      if (index !== -1 && reports.value[index]) {
        reports.value[index].status = statusRes.status;
        
        // JIKA SELESAI
        if (statusRes.status === 'COMPLETED') {
          reports.value[index].file_url = statusRes.file_url;
          stopPolling(requestId); // Stop loop
        } 
        // JIKA GAGAL
        else if (statusRes.status === 'FAILED') {
          stopPolling(requestId); // Stop loop
        }
      }
    } catch (e) {
      console.warn("Polling error:", e);
    }
  }, 3000); // Cek tiap 3 detik

  activeIntervals[requestId] = intervalId;
};

const stopPolling = (requestId: string) => {
  if (activeIntervals[requestId]) {
    clearInterval(activeIntervals[requestId]);
    delete activeIntervals[requestId];
  }
};

// Bersihkan interval jika user pindah halaman
onUnmounted(() => {
  Object.keys(activeIntervals).forEach(id => stopPolling(id));
});

onMounted(() => {
  fetchHistory();
});

// Formatter Tanggal
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'
  });
};
</script>

<template>
  <div class="report-container">
    <h2>Laporan Keuangan 📊</h2>
    <p class="subtitle">Download rekap transaksi dalam format Excel (.xlsx)</p>

    <div class="generate-card">
      <div class="input-group">
        <label>Pilih Tahun:</label>
        <select v-model="selectedYear">
          <option :value="2024">2024</option>
          <option :value="2025">2025</option>
          <option :value="2026">2026</option>
        </select>
      </div>
      <button @click="handleGenerate" :disabled="isGenerating" class="gen-btn">
        {{ isGenerating ? 'Meminta Request...' : '📄 Generate Laporan' }}
      </button>
    </div>

    <div v-if="errorMessage" class="error-msg">{{ errorMessage }}</div>

    <hr class="divider">

    <h3>Riwayat Request</h3>
    
    <div v-if="isLoadingHistory" class="loading">Memuat riwayat...</div>
    
    <div v-else class="history-list">
      <div v-if="reports.length === 0" class="empty">Belum ada laporan yang dibuat.</div>

      <div v-for="item in reports" :key="item.request_id" class="report-item">
        <div class="report-info">
          <div class="report-title">Laporan Tahun {{ item.year }}</div>
          <div class="report-date">{{ formatDate(item.created_at) }}</div>
        </div>
        
        <div class="report-status">
          <a 
            v-if="item.status === 'COMPLETED' && item.file_url" 
            :href="item.file_url" 
            class="download-btn"
            target="_blank"
          >
            ⬇️ Download Excel
          </a>

          <span v-else-if="item.status === 'Accepted' || item.status === 'PROCESSING'" class="badge processing">
            ⏳ Memproses...
          </span>

          <span v-else class="badge failed">
            ❌ Gagal
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-container { max-width: 600px; margin: 0 auto; padding: 1rem; font-family: 'Segoe UI', sans-serif; }
.subtitle { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }

/* GENERATE SECTION */
.generate-card {
  display: flex; gap: 10px; align-items: flex-end; background: #f8fafc;
  padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;
}
.input-group { display: flex; flex-direction: column; gap: 5px; flex: 1; }
select { padding: 10px; border-radius: 6px; border: 1px solid #ccc; font-size: 1rem; }
.gen-btn {
  padding: 11px 20px; background-color: #0f172a; color: white; border: none;
  border-radius: 6px; cursor: pointer; font-weight: 600;
}
.gen-btn:disabled { background-color: #94a3b8; cursor: not-allowed; }

.divider { border: 0; border-top: 1px solid #e2e8f0; margin: 2rem 0; }
.error-msg { color: #dc2626; background: #fee2e2; padding: 10px; margin-top: 10px; border-radius: 6px; }

/* HISTORY LIST */
.history-list { display: flex; flex-direction: column; gap: 10px; }
.report-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background: white;
}
.report-title { font-weight: bold; color: #334155; }
.report-date { font-size: 0.8rem; color: #94a3b8; margin-top: 4px; }

/* BUTTONS & BADGES */
.download-btn {
  display: inline-block; padding: 8px 16px; background-color: #16a34a; color: white;
  text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 0.9rem;
  transition: background 0.2s;
}
.download-btn:hover { background-color: #15803d; }

.badge { padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
.badge.processing { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; animation: pulse 2s infinite; }
.badge.failed { background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; }

@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
</style>