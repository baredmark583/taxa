import axios from 'axios';
import { type Ad, type GeneratedAdData } from './types';

// VERY IMPORTANT: Make sure you have VITE_API_BASE_URL set in your Render environment variables.
// It should be the URL of your deployed backend service.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: `/api`,
});

// Interceptor to add the auth token to every request
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// --- Ads ---
export const getAds = (): Promise<{ data: Ad[] }> => apiClient.get('/ads');
export const createAd = (data: { adData: GeneratedAdData, imageUrls: string[] }): Promise<{ data: Ad }> => apiClient.post('/ads', data);

// --- Gemini ---
export const generateAdContent = (prompt: string, imageBase64: string, mimeType: string): Promise<{ data: GeneratedAdData }> => {
    return apiClient.post('/gemini/generate-ad', { prompt, imageBase64, mimeType });
}

export default apiClient;
