import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const Api = axios.create({
<<<<<<< HEAD
baseURL: 'http://10.171.240.111:5001/api',
=======
  baseURL: 'http://192.168.1.2:5001/api',
>>>>>>> 70635a9b2b2d9bce8345433724a517b1228827e9
  timeout: 10000,
});

Api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default Api;