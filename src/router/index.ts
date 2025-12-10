import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue' 
import ReportView from '../views/ReportView.vue' 
import { isTokenValid } from '../utils/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportView,
      meta: { requiresAuth: true }
    }
  ]
})

// --- GLOBAL GUARD ---
// Ini lebih aman daripada 'beforeEnter' per satu route.
// Kode ini akan jalan setiap kali user pindah halaman.
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('fintrack_token');
  const isAuthenticated = isTokenValid(token);

  // SKENARIO 1: User mau ke halaman yang butuh login (Dashboard)
  if (to.meta.requiresAuth) {
    if (isAuthenticated) {
      next(); // Boleh masuk
    } else {
      // Token tidak valid/kadaluarsa
      console.warn("Akses ditolak. Token invalid.");
      localStorage.removeItem('fintrack_token'); // Bersihkan sampah
      next('/login'); // Tendang ke login
    }
  } 
  // SKENARIO 2: User sudah login, tapi mau buka halaman Login/Register
  else if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
    next('/'); // Jangan kasih login lagi, lempar balik ke dashboard
  } 
  // SKENARIO 3: Halaman publik (jika ada)
  else {
    next();
  }
});

export default router