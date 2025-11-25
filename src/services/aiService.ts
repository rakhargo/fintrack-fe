import axios from 'axios';

const API_URL = import.meta.env.VITE_AI_SERVICE_URL;

export interface AiResponse {
  category_name: string;
  category_type: string;
  amount: number;
  ai_confidence: number;
}

export const analyzeTransaction = async (text: string): Promise<AiResponse> => {
  try {
    const payload = {
      text: text,
      instructions: {
        model_name: "gemini-2.5-flash",
        system_prompt: "Identifikasi jumlah uang, nama kategori dan tipe kategori. Nama kategori HARUS salah satu dari: 'Makanan & Minuman', 'Transportasi', 'Kebutuhan Harian', 'Gaji', 'Lainnya'. Tipe kategori: 'Expense' atau 'Income'. Respons JSON: {'category_name': string, 'category_type': string, 'amount': float, 'ai_confidence': float}." // Prompt sederhana, logic utama ada di backend
      }
    };
    // console.log("AI Service Payload:", payload);

    // Panggil Endpoint Azure Function
    const response = await axios.post(API_URL, payload);
    return response.data;
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};