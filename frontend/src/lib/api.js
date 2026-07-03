import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Auto-logout on expired/invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/welcome';
    }
    return Promise.reject(error);
  }
);

export default api;

export const generateArticle = async (keyword) => {
  const response = await api.post('/generate-article', { keyword });
  return response.data;
};

export const getHistory = async ({ page = 1, limit = 12, search = '' } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (search) params.set('search', search);
  const response = await api.get(`/history?${params}`);
  return response.data;
};

export const refineArticle = async (id, prompt) => {
  const response = await api.patch(`/history/${id}/refine`, { prompt });
  return response.data;
};

export const restoreArticleVersion = async (id, versionIndex) => {
  const response = await api.post(`/history/${id}/restore/${versionIndex}`);
  return response.data;
};

export const deleteArticle = async (id) => {
  const response = await api.delete(`/articles/${id}`);
  return response.data;
};

export const uploadCoverImage = async (articleId, file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post(`/articles/${articleId}/cover`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getInternalLinks = async (content, knownUrls = []) => {
  const response = await api.post('/internal-links', { content, knownUrls });
  return response.data;
};

export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (data) => {
  const response = await api.put('/settings', data);
  return response.data;
};

// Stripe
export const getCreditPackages = async () => {
  const response = await api.get('/stripe/packages');
  return response.data;
};

export const createCheckoutSession = async (packageId) => {
  const response = await api.post('/stripe/checkout', { packageId });
  return response.data;
};

export const getStripeConfig = async () => {
  const response = await api.get('/stripe/config');
  return response.data;
};

export const createPaymentIntent = async (packageId) => {
  const response = await api.post('/stripe/payment-intent', { packageId });
  return response.data;
};

// Admin Endpoints
export const fetchUsers = async (page = 1, limit = 10, search = '') => {
  const response = await api.get(`/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  return response.data;
};

export const updateUserCredits = async (id, credits) => {
  const response = await api.put(`/admin/users/${id}/credits`, { credits });
  return response.data;
};

export const deleteUserAccount = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

export const generateAICoverImage = async (articleId, customPrompt = '') => {
  const response = await api.post(`/articles/${articleId}/generate-cover-ai`, { customPrompt });
  return response.data;
};

export const deleteMyAccount = async () => {
  const response = await api.delete('/auth/account');
  return response.data;
};

export const resendVerificationEmail = async () => {
  const response = await api.post('/auth/resend-verification');
  return response.data;
};

// Unsplash
export const searchUnsplashPhotos = async (query, page = 1) => {
  const response = await api.get('/images/unsplash/search', { params: { query, page } });
  return response.data;
};

export const setUnsplashCover = async (articleId, { photoUrl, downloadLocation, photographerName, photographerUrl }) => {
  const response = await api.post(`/articles/${articleId}/cover-unsplash`, {
    photoUrl, downloadLocation, photographerName, photographerUrl,
  });
  return response.data;
};

// Subscription management
export const getSubscription = async () => {
  const response = await api.get('/stripe/subscription');
  return response.data;
};

export const cancelSubscription = async () => {
  const response = await api.delete('/stripe/subscription');
  return response.data;
};

export const reactivateSubscription = async () => {
  const response = await api.post('/stripe/subscription/reactivate');
  return response.data;
};

export const changeSubscriptionPlan = async (newPriceId) => {
  const response = await api.put('/stripe/subscription/plan', { newPriceId });
  return response.data;
};
