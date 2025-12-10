import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import TransactionInput from '../components/TransactionInput.vue'
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
    name: 'home',
    component: TransactionInput,
    beforeEnter: (to, from, next) => {
      const token = localStorage.getItem('fintrack_token');
      
      if (isTokenValid(token)) {
        next(); // Lanjut masuk
      } else {
        localStorage.removeItem('fintrack_token'); 
        next('/login'); 
      }
    }
  }
  ]
})

export default router