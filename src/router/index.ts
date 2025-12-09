import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import TransactionInput from '../components/TransactionInput.vue'
import UserView from '@/views/UserView.vue'

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
      name: 'home',
      component: TransactionInput,
      // Guard: Cek apakah user sudah login
      beforeEnter: (to, from, next) => {
        const token = localStorage.getItem('fintrack_token');
        if (!token) next('/login');
        else next();
      }
    }
  ]
})

export default router