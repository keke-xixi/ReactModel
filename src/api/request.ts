import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
});

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 处理未授权
      localStorage.removeItem('token');
      // 重定向到登录
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default request;