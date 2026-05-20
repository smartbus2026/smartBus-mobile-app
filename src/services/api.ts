import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const Api = axios.create({
baseURL: 'http://10.171.240.111:5001/api',
  timeout: 10000,
});

Api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default Api;