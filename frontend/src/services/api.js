import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getUsers: (skip = 0, limit = 100) => api.get(`/users?skip=${skip}&limit=${limit}`),
  getUser: (userId) => api.get(`/users/${userId}`),
};

// Courts API
export const courtsAPI = {
  getCourts: (skip = 0, limit = 100) => api.get(`/courts?skip=${skip}&limit=${limit}`),
  getCourt: (courtId) => api.get(`/courts/${courtId}`),
  createCourt: (courtData) => api.post('/courts', courtData),
};

// Challenges API
export const challengesAPI = {
  getChallenges: (skip = 0, limit = 100, status = null) => {
    const params = new URLSearchParams({ skip, limit });
    if (status) params.append('status', status);
    return api.get(`/challenges?${params}`);
  },
  createChallenge: (challengeData) => api.post('/challenges', challengeData),
  getChallenge: (challengeId) => api.get(`/challenges/${challengeId}`),
  acceptChallenge: (challengeId) => api.put(`/challenges/${challengeId}/accept`),
};

// Coaches API
export const coachesAPI = {
  getCoaches: (skip = 0, limit = 100) => api.get(`/coaches?skip=${skip}&limit=${limit}`),
  getCoach: (coachId) => api.get(`/coaches/${coachId}`),
};

// Games API
export const gamesAPI = {
  getGames: (skip = 0, limit = 100, status = null) => {
    const params = new URLSearchParams({ skip, limit });
    if (status) params.append('status', status);
    return api.get(`/games?${params}`);
  },
  createGame: (gameData) => api.post('/games', gameData),
};

// Products API
export const productsAPI = {
  getProducts: (skip = 0, limit = 100, category = null) => {
    const params = new URLSearchParams({ skip, limit });
    if (category) params.append('category', category);
    return api.get(`/products?${params}`);
  },
  getProduct: (productId) => api.get(`/products/${productId}`),
};

// Stats API
export const statsAPI = {
  getUserStats: (userId) => api.get(`/stats/user/${userId}`),
  createPlayerStats: (statsData) => api.post('/stats', statsData),
};

// Health API
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;