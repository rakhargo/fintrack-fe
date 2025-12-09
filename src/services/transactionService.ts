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

export const createTransaction = async (payload: any, token: string, isMultipart: boolean) => {
  const headers: any = {
    'Authorization': `Bearer ${token}`
  };

  // Jika JSON, set Content-Type. Jika Multipart (File), JANGAN set Content-Type (biarkan browser set boundary)
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}/transaction/create`, {
    method: 'POST',
    headers: headers,
    body: isMultipart ? payload : JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Gagal membuat transaksi');
  }
  return response.json();
};

export const getTransactionDetail = async (id: string, token: string) => {
  const response = await fetch(`${API_URL}/transaction/get?id=${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Gagal mengambil detail transaksi');
  }
  return response.json();
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