import axios from 'axios';

const axiosFineTune = axios.create({
  baseURL: process.env.REACT_APP_FINE_TUNE_API_URL || 'http://localhost:5002',
});

axiosFineTune.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return Promise.reject(new Error('Authentication required'));
  }
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosFineTune.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosFineTune;
