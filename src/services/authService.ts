import axios from 'axios';

// URL User Service (Ganti dengan URL Function App User Service Anda)
const API_URL = import.meta.env.VITE_API_GATEWAY_URL;

export interface User {
  user_id: string;
  name: string;
  email: string;
  token?: string;
}

// Helper: Simpan user ke LocalStorage (Persist Login)
const saveUser = (userData: User) => {
  localStorage.setItem('fintrack_user', JSON.stringify(userData));
  if (userData.token) {
    localStorage.setItem('fintrack_token', userData.token);
  }
};

// Helper: Hapus user (Logout)
export const logoutUser = () => {
  localStorage.removeItem('fintrack_user');
  localStorage.removeItem('fintrack_token');
  window.location.href = '/'; // Redirect paksa
};

// Helper: Ambil Token saat ini
export const getAuthToken = () => {
  return localStorage.getItem('fintrack_token');
};

// --- API CALLS ---

export const register = async (name: string, email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/gateway/user/register`, { name, email, password });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Registrasi gagal.');
  }
};

export const login = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/gateway/user/login`, { email, password });
    
    if (response.data.token) {
      saveUser({
        user_id: response.data.user_id,
        name: response.data.name,
        email: email,
        token: response.data.token
      });
    }
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Login gagal.');
  }
};

export const getProfile = async () => {
    const token = localStorage.getItem('fintrack_token');
    if (!token) throw new Error("No Token");

    try {
        const response = await axios.get(`${API_URL}/gateway/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error: any) {
        throw error;
    }
}