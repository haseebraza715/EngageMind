import axios from 'axios';

const axiosChat = axios.create({
  baseURL: 'http://localhost:5002',
});

axiosChat.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (!token) {
    // Redirect to login if no token
    window.location.href = '/login';
    return Promise.reject(new Error('Authentication required'));
  }
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 responses globally
axiosChat.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosChat;
