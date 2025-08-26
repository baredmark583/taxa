import axios from 'axios';
import { type Ad, type GeneratedAdData } from './types';

const baseURL = process.env.VITE_API_BASE_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: `${baseURL}/api`,
});

// Interceptor to add the auth token to every request
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth ---
export const registerUser = (data: any) => apiClient.post('/auth/register', data);
export const loginUser = (data: any) => apiClient.post('/auth/login', data);

// --- Ads ---
export const getAds = (): Promise<{ data: Ad[] }> => apiClient.get('/ads');
export const createAd = (data: { adData: GeneratedAdData, imageUrls: string[] }): Promise<{ data: Ad }> => apiClient.post('/ads', data);

// --- Gemini ---
export const generateAdContent = (prompt: string, imageBase64: string, mimeType: string): Promise<{ data: GeneratedAdData }> => {
    return apiClient.post('/gemini/generate-ad', { prompt, imageBase64, mimeType });
}

// ... other API functions will be added here as we migrate them ...

export default apiClient;
