import axios from 'axios';
// FIX: Added AdminStats to imports.
import { type Ad, type GeneratedAdData, type AdminUser, type AdminAd, type AuthUser, type AdminStats, AnalyticsData } from './types';

// FIX: Use an environment variable for the base URL in production.
// In development, this will be falsy, and relative paths will be used, which is handled by Vite's proxy.
// In production (Vercel, Netlify), set VITE_API_BASE_URL to your backend's full domain URL (e.g., https://taxa-backend.onrender.com).
// FIX: Cast `import.meta` to `any` to bypass TypeScript error about missing `env` property.
const apiClient = axios.create({
  baseURL: (import.meta as any).env.VITE_API_BASE_URL || '',
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
export const registerUser = (data: any): Promise<{ data: { token: string, user: AuthUser } }> => apiClient.post('/api/auth/register', data);
export const loginUser = (data: any): Promise<{ data: { token: string, user: AuthUser } }> => apiClient.post('/api/auth/login', data);
export const telegramLogin = (initData: string): Promise<{ data: { token: string, user: AuthUser } }> => apiClient.post('/api/auth/telegram', { initData });

// --- Ads ---
export const getAds = (): Promise<{ data: Ad[] }> => apiClient.get('/api/ads');
export const createAd = (data: { adData: GeneratedAdData, imageUrls: string[] }): Promise<{ data: Ad }> => apiClient.post('/api/ads', data);
// Add a function to get a single ad by ID
export const getAdById = (id: string): Promise<{ data: Ad }> => apiClient.get(`/api/ads/${id}`);


// --- Gemini ---
export const generateAdContent = (prompt: string, imageBase64: string, mimeType: string): Promise<{ data: GeneratedAdData }> => {
    return apiClient.post('/api/gemini/generate-ad', { prompt, imageBase64, mimeType });
}

// --- Admin ---
// Add a new function to get dashboard statistics.
export const getAdminStats = (): Promise<{ data: AdminStats }> => apiClient.get('/api/admin/stats');
export const getAdminAnalytics = (): Promise<{ data: AnalyticsData }> => apiClient.get('/api/admin/analytics');
export const getAdminUsers = (): Promise<{ data: AdminUser[] }> => apiClient.get('/api/admin/users');
export const updateAdminUser = (id: string, data: Partial<AdminUser>): Promise<{ data: AdminUser }> => apiClient.put(`/api/admin/users/${id}`, data);
export const deleteAdminUser = (id: string): Promise<any> => apiClient.delete(`/api/admin/users/${id}`);
export const getAdminAds = (): Promise<{ data: AdminAd[] }> => apiClient.get('/api/admin/ads');
export const updateAdminAd = (id: string, data: Partial<AdminAd>): Promise<{ data: AdminAd }> => apiClient.put(`/api/admin/ads/${id}`, data);
export const deleteAdminAd = (id: string): Promise<any> => apiClient.delete(`/api/admin/ads/${id}`);


// ... other API functions will be added here as we migrate them ...

export default apiClient;