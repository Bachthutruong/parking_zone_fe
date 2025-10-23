import axios from 'axios';

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://parking-zone-be.onrender.com/api';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';



const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url,
      method: error.config?.method
    });
    
    // Only redirect to login for 401 errors on protected routes
    // Public routes like booking and lookup should not redirect
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isPublicRoute = ['/booking', '/lookup', '/booking-confirmation'].includes(currentPath);
      
      if (!isPublicRoute) {
        console.log('Unauthorized on protected route - logging out user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        console.log('Unauthorized on public route - continuing without auth');
      }
    }
    return Promise.reject(error);
  }
);

export default api; 