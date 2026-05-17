import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;

export const generateArticle = async (keyword) => {
  const response = await api.post('/generate-article', { keyword });
  return response.data;
};

export const getHistory = async () => {
  const response = await api.get('/history');
  return response.data;
};

export const refineArticle = async (id, prompt) => {
  const response = await api.patch(`/history/${id}/refine`, { prompt });
  return response.data;
};

export const generateInternalLinks = async (content, knownUrls = []) => {
  const response = await api.post('/internal-links', { content, knownUrls });
  return response.data;
};
