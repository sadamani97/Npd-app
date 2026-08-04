import axios from 'axios';
import { storage } from '../utils/storage';

import { Platform } from 'react-native';

// Uses your machine's Wi-Fi IP address (192.168.1.224) so physical mobile devices & Expo Go can reach Node.js backend
export const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:5001/api' 
  : 'http://192.168.1.224:5001/api';

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
