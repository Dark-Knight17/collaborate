import axios from 'axios';

// Production (Vercel): set VITE_API_URL in the Vercel dashboard to your Railway/Render backend URL.
// e.g. https://collaborate-backend.railway.app/api
// Development: falls back to localhost:8000 automatically.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Base URL without the /api suffix (for static files/uploads)
export const ROOT_URL = API_BASE_URL.replace(/\/api$/, '');

// Derive WebSocket URL from API_BASE_URL
// If API_BASE_URL is https://backend.com/api -> wss://backend.com/api
// If API_BASE_URL is http://localhost:8000/api -> ws://localhost:8000/api
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

/**
 * Resolves a user avatar URL.
 * If it's a relative path starting with /uploads, it prefixes it with ROOT_URL.
 */
export const getAvatarUrl = (url?: string) => {
  if (!url) return 'https://i.pravatar.cc/150';
  if (url.startsWith('/uploads')) {
    return `${ROOT_URL}${url}`;
  }
  return url;
};

// Add JWT Token to all outbound requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axios;
