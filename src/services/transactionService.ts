import axios from 'axios';

const API_URL = import.meta.env.VITE_TRANSACTION_SERVICE_URL; 

// Interface disesuaikan STRICT dengan payload request Anda
export interface TransactionPayload {
  user_id: string;
  description: string;
  source: string;
  latitude?: number;
  longitude?: number;
}

export const createTransaction = async (payload: TransactionPayload) => {
  try {
    const response = await axios.post(`${API_URL}/api/transaction/create`, payload);
    return response.data;
  } catch (error) {
    console.error("Create Error:", error);
    throw error;
  }
};

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
          console.warn("Gagal ambil lokasi:", error.message);
          // Tetap resolve tapi null/undefined agar flow tidak putus
          resolve({ lat: 0, lng: 0 }); 
        }
      );
    }
  });
};