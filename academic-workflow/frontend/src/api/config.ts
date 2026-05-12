import axios from 'axios';

// Production (Vercel): set VITE_API_URL in the Vercel dashboard to your Railway/Render backend URL.
// e.g. https://collaborate-backend.railway.app/api
// Development: falls back to localhost:8000 automatically.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Add JWT Token to all outbound requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axios;
