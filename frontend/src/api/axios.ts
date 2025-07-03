import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import {
  User,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  Article,
  PaginatedResponse,
  Source,
  Category,
  UserPreference,
} from '@/types/api';

const getCsrfToken = () => {
  const name = 'XSRF-TOKEN=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
};

// Create an Axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000', // Adjust if your backend is on a different port/host
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// intercept request to use auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // For non-GET requests, manually add the X-XSRF-TOKEN header
    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers.set('X-XSRF-TOKEN', csrfToken);
      }
    }

    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// intercept response to handle token expiration or 401 responses
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
    }

    return Promise.reject(error);
  }
);

export default api;

// Authentication
export const authApi = {
  login: (payload: LoginPayload): Promise<AxiosResponse<LoginResponse>> =>
    api.post<LoginResponse>('/api/login', payload),
  register: (payload: RegisterPayload): Promise<AxiosResponse<RegisterResponse>> =>
    api.post<RegisterResponse>('/api/register', payload),
  fetchUser: (): Promise<AxiosResponse<User>> =>
    api.get<User>('/api/user'),
  logout: (): Promise<AxiosResponse<void>> =>
    api.post<void>('/api/logout'),
};

// Article and Feed API
export const newsApi = {
  getArticles: (params?: Record<string, any>): Promise<AxiosResponse<PaginatedResponse<Article>>> =>
    api.get<PaginatedResponse<Article>>('/api/articles', { params }),
  getPersonalizedFeed: (params?: Record<string, any>): Promise<AxiosResponse<PaginatedResponse<Article>>> =>
    api.get<PaginatedResponse<Article>>('/api/feed', { params }),
};

// User Preferences API
export const preferencesApi = {
  getPreferences: (): Promise<AxiosResponse<UserPreference>> =>
    api.get<UserPreference>('/api/preferences'),
  savePreferences: (payload: Partial<UserPreference>): Promise<AxiosResponse<{ message: string; preferences: UserPreference }>> =>
    api.post<{ message: string; preferences: UserPreference }>('/api/preferences', payload),
  getSources: (): Promise<AxiosResponse<Source[]>> =>
    api.get<Source[]>('/api/sources'),
  getCategories: (): Promise<AxiosResponse<Category[]>> =>
    api.get<Category[]>('/api/categories'),
  getAuthors: (): Promise<AxiosResponse<string[]>> =>
    api.get<string[]>('/api/authors'),
};
