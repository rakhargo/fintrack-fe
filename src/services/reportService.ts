// src/services/reportService.ts

// Ganti dengan URL API Anda
const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL;

export interface ReportItem {
  request_id: string;
  year: string | number;
  status: 'Accepted' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  file_url: string | null;
  created_at?: string;
  generated_at?: string;
  message?: string;
}

// 1. Generate Report
export const generateReport = async (year: number, token: string) => {
  const response = await fetch(`${API_BASE_URL}/report/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ year })
  });

  if (!response.ok) throw new Error("Gagal request laporan.");
  return response.json();
};

// 2. Cek Status (Polling)
export const checkReportStatus = async (requestId: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/report/status/${requestId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error("Gagal cek status.");
  return response.json();
};

// 3. Ambil History (Perhatikan URL ada '/gateway')
export const getReportHistory = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/gateway/report/history`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error("Gagal mengambil riwayat laporan.");
  return response.json();
};