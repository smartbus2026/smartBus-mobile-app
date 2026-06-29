import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const BASE_URL = 'http://10.171.240.67:5001/api';

const Api = axios.create({
  baseURL: BASE_URL, 
  timeout: 10000,
});

Api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default Api;