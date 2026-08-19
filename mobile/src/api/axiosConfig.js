import axios from 'axios';
import { storage } from '../utils/storage';
import { Platform } from 'react-native';

const webFallback = 'http://localhost:5001/api';
const mobileFallback = 'http://192.168.1.224:5001/api';

export const API_BASE_URL = Platform.OS === 'web'
  ? (process.env.EXPO_PUBLIC_API_BASE_URL || webFallback)
  : (process.env.EXPO_PUBLIC_API_BASE_URL || mobileFallback);

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
