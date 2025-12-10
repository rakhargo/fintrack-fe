<script setup lang="ts">
import { ref } from 'vue';
import TransactionInput from '../components/TransactionInput.vue';
import TransactionList from '../components/TransactionList.vue';

// Referensi ke komponen TransactionList
// (Agar kita bisa memanggil fungsi di dalamnya)
const listRef = ref<InstanceType<typeof TransactionList> | null>(null);

// Fungsi untuk me-refresh list
const handleRefreshList = () => {
  // Panggil fungsi fetchTransactions() milik anak (TransactionList)
  if (listRef.value) {
    console.log("Auto-refreshing list...");
    listRef.value.fetchTransactions();
  }
};
</script>

<template>
  <div class="dashboard-container">
    
    <section class="section-input">
      <TransactionInput @transaction-success="handleRefreshList" />
    </section>

    <hr class="divider">

    <section class="section-list">
      <TransactionList ref="listRef" />
    </section>
  </div>
</template>

<style scoped>
/* ... Style sama seperti sebelumnya ... */
.dashboard-container { max-width: 600px; margin: 0 auto; padding: 0 1rem; animation: fadeIn 0.5s ease-in-out; }
.divider { border: 0; border-top: 1px solid #e2e8f0; margin: 2rem 0; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>