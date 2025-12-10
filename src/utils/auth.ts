import { jwtDecode } from "jwt-decode";

interface FintrackTokenPayload {
  user_id: string;
  name: string;
  email: string;
  role: string;
  exp: number;
}

// 2. Fungsi Validasi dengan Type Guard
export function isTokenValid(token: string | null): boolean {
  if (!token) return false;

  try {
    // Decode token dengan tipe generik <FintrackTokenPayload>
    const decoded = jwtDecode<FintrackTokenPayload>(token);
    
    // Ambil waktu sekarang (dalam detik, bukan milidetik)
    const currentTime = Date.now() / 1000;

    // Cek apakah token sudah kadaluarsa
    if (decoded.exp < currentTime) {
      console.warn("Token telah kadaluarsa.");
      return false; 
    }

    return true; // Token valid dan belum expired
  } catch (error) {
    console.error("Format token tidak valid:", error);
    return false; 
  }
}