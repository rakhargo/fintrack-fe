import axios from 'axios';

// Ganti dengan URL Function Transaction Service Anda
const API_URL = import.meta.env.VITE_TRANSACTION_SERVICE_URL; 

export interface TransactionPayload {
  user_id: string;
  description: string;
  amount: number;
  source: string;
  latitude?: number;
  longitude?: number;
}

// 1. Fungsi Create Transaksi
export const createTransaction = async (payload: TransactionPayload) => {
  try {
    const response = await axios.post(`${API_URL}/api/transaction/create`, payload);
    return response.data; // Mengembalikan { id: "...", status: "queued..." }
  } catch (error) {
    console.error("Create Error:", error);
    throw error;
  }
};

// 2. Fungsi Get Detail (Untuk Polling)
export const getTransactionDetail = async (id: string, userId: string) => {
  try {
    const response = await axios.get(`${API_URL}/api/transaction/get`, {
      params: { id: id, user_id: userId }
    });
    return response.data;
  } catch (error) {
    console.error("Get Detail Error:", error);
    throw error;
  }
};

// 3. Helper untuk Ambil Lokasi Browser
export const getCurrentLocation = (): Promise<{lat: number, lng: number}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation tidak didukung browser ini."));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        }
      );
    }
  });
};