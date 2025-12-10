<script setup lang="ts">
import TransactionInput from '../components/TransactionInput.vue';
import TransactionList from '../components/TransactionList.vue';

// Kita bisa pakai ref untuk memicu refresh list setelah input sukses
import { ref } from 'vue';

const transactionListRef = ref();

// Fungsi ini akan dipanggil ketika Input selesai (emit success)
// Tapi untuk sekarang, karena list pakai polling/onMounted sendiri,
// cukup taruh berdampingan saja sudah aman.
</script>

<template>
  <div class="dashboard-container">
    <section class="section-input">
      <TransactionInput />
    </section>

    <hr class="divider">

    <section class="section-list">
      <TransactionList ref="transactionListRef" />
    </section>
  </div>
</template>

<style scoped>
.dashboard-container {
  max-width: 600px; /* Lebar konten utama dashboard */
  margin: 0 auto;
  padding: 0 1rem;
}

.divider {
  border: 0;
  border-top: 1px solid #e2e8f0;
  margin: 2rem 0;
}

/* Animasi masuk halus saat halaman dibuka */
.dashboard-container {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>