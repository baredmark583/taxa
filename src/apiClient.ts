import axios from 'axios';
import { type Ad, type GeneratedAdData, type AdminUser, type AdminAd, type AuthUser } from './types';

// The base URL will be handled by Vite's proxy in development or will be a relative path in production.
const apiClient = axios.create({
  baseURL: '/api',
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
export const telegramLogin = (initData: string): Promise<{ data: { token: string, user: AuthUser } }> => apiClient.post('/auth/telegram', { initData });

// --- Ads ---
export const getAds = (): Promise<{ data: Ad[] }> => apiClient.get('/ads');
export const createAd = (data: { adData: GeneratedAdData, imageUrls: string[] }): Promise<{ data: Ad }> => apiClient.post('/ads', data);

// --- Gemini ---
export const generateAdContent = (prompt: string, imageBase64: string, mimeType: string): Promise<{ data: GeneratedAdData }> => {
    return apiClient.post('/gemini/generate-ad', { prompt, imageBase64, mimeType });
}

// --- Admin ---
export const getAdminUsers = (): Promise<{ data: AdminUser[] }> => apiClient.get('/admin/users');
export const deleteAdminUser = (id: string): Promise<any> => apiClient.delete(`/admin/users/${id}`);
export const getAdminAds = (): Promise<{ data: AdminAd[] }> => apiClient.get('/admin/ads');
export const deleteAdminAd = (id: string): Promise<any> => apiClient.delete(`/admin/ads/${id}`);


// ... other API functions will be added here as we migrate them ...

export default apiClient;