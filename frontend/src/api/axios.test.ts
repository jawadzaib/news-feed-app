import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import {
  LoginPayload,
  RegisterPayload,
  UserPreference,
} from '@/types/api';

let requestOnFulfilled: ((config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>) | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let requestOnRejected: ((error: any) => Promise<any>) | undefined;
let responseOnFulfilled: ((response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>) | undefined;
let responseOnRejected: ((error: any) => Promise<any>) | undefined;

// Mock axios
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn((onFulfilled, onRejected) => {
          requestOnFulfilled = onFulfilled;
          requestOnRejected = onRejected;
          return 0;
        }),
        eject: vi.fn(),
      },
      response: {
        use: vi.fn((onFulfilled, onRejected) => {
          responseOnFulfilled = onFulfilled;
          responseOnRejected = onRejected;
          return 0;
        }),
        eject: vi.fn(),
      },
    },
    defaults: {},
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Mock document.cookie
const documentCookieMock = (() => {
  let cookieString = '';
  return {
    get: vi.fn(() => cookieString),
    set: vi.fn((value: string) => {
      cookieString = value;
    }),
    clear: vi.fn(() => {
      cookieString = '';
    }),
  };
})();


describe('API Client', () => {
  let api: any;
  let authApi: typeof import('./axios').authApi;
  let newsApi: typeof import('./axios').newsApi;
  let preferencesApi: typeof import('./axios').preferencesApi;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    // Reset captured interceptor handlers for each test.
    requestOnFulfilled = undefined;
    requestOnRejected = undefined;
    responseOnFulfilled = undefined;
    responseOnRejected = undefined;

    // Assign the mocked localStorage and document.cookie.
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    Object.defineProperty(document, 'cookie', {
      get: documentCookieMock.get,
      set: documentCookieMock.set,
    });

    localStorageMock.clear();
    documentCookieMock.clear();

    const apiModule = await vi.importActual('./axios');
    api = (apiModule as any).default;
    authApi = (apiModule as any).authApi;
    newsApi = (apiModule as any).newsApi;
    preferencesApi = (apiModule as any).preferencesApi;
  });

  afterEach(() => {
    localStorageMock.clear();
    documentCookieMock.clear();
    requestOnFulfilled = undefined;
    requestOnRejected = undefined;
    responseOnFulfilled = undefined;
    responseOnRejected = undefined;
  });

  // Helper to get the actual `api` instance created by the mock
  const getApiInstance = () => {
    return api;
  };

  describe('CSRF Token Handling', () => {
    it('should return null if XSRF-TOKEN cookie is not found', async () => {
      documentCookieMock.set('some_other_cookie=value');
      const config = { method: 'post', headers: {} } as InternalAxiosRequestConfig;
      if (requestOnFulfilled) {
        const modifiedConfig = await requestOnFulfilled(config);
        expect(modifiedConfig.headers?.['X-XSRF-TOKEN']).toBeUndefined();
      } else {
        throw new Error('Request interceptor onFulfilled not captured.');
      }
    });

    it('should extract XSRF-TOKEN from cookie', async () => {
      documentCookieMock.set('some_cookie=value; XSRF-TOKEN=test-csrf-token; another_cookie=value');
      const config = { method: 'post', headers: {} } as InternalAxiosRequestConfig;
      if (requestOnFulfilled) {
        const modifiedConfig = await requestOnFulfilled(config);
        expect(modifiedConfig.headers?.['X-XSRF-TOKEN']).toBe('test-csrf-token');
      } else {
        throw new Error('Request interceptor onFulfilled not captured.');
      }
    });

    it('should not add X-XSRF-TOKEN for GET requests', async () => {
      documentCookieMock.set('XSRF-TOKEN=test-csrf-token');
      const config = { method: 'get', headers: {} } as InternalAxiosRequestConfig;
      if (requestOnFulfilled) {
        const modifiedConfig = await requestOnFulfilled(config);
        expect(modifiedConfig.headers?.['X-XSRF-TOKEN']).toBeUndefined();
      } else {
        throw new Error('Request interceptor onFulfilled not captured.');
      }
    });
  });


  describe('Axios Interceptors', () => {
    it('should add Authorization header if authToken exists in localStorage', async () => {
      localStorageMock.setItem('authToken', 'test-token');
      const config = { headers: {} } as InternalAxiosRequestConfig;
      if (requestOnFulfilled) {
        const modifiedConfig = await requestOnFulfilled(config);
        expect(modifiedConfig.headers?.Authorization).toBe('Bearer test-token');
      } else {
        throw new Error('Request interceptor onFulfilled not captured.');
      }
    });

    it('should not add Authorization header if authToken does not exist in localStorage', async () => {
      localStorageMock.removeItem('authToken');
      const config = { headers: {} } as InternalAxiosRequestConfig;
      if (requestOnFulfilled) {
        const modifiedConfig = await requestOnFulfilled(config);
        expect(modifiedConfig.headers?.Authorization).toBeUndefined();
      } else {
        throw new Error('Request interceptor onFulfilled not captured.');
      }
    });

    it('should remove authToken from localStorage on 401 response', async () => {
      localStorageMock.setItem('authToken', 'expired-token');
      const error = { response: { status: 401 } };
      if (responseOnRejected) {
        await expect(responseOnRejected(error)).rejects.toBe(error);
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      } else {
        throw new Error('Response interceptor onRejected not captured.');
      }
    });

    it('should not remove authToken from localStorage on non-401 response', async () => {
      localStorageMock.setItem('authToken', 'valid-token');
      const error = { response: { status: 403 } };
      if (responseOnRejected) {
        await expect(responseOnRejected(error)).rejects.toBe(error);
        expect(localStorageMock.removeItem).not.toHaveBeenCalled();
      } else {
        throw new Error('Response interceptor onRejected not captured.');
      }
    });

    it('should return response as is for successful responses', async () => {
      const response = { status: 200, data: { message: 'Success' } } as AxiosResponse;
      if (responseOnFulfilled) {
        const modifiedResponse = await responseOnFulfilled(response);
        expect(modifiedResponse).toBe(response);
      } else {
        throw new Error('Response interceptor onFulfilled not captured.');
      }
    });
  });

  describe('authApi', () => {
    it('login should call api.post with correct endpoint and payload', async () => {
      const loginPayload: LoginPayload = { email: 'test@example.com', password: 'password123' };
      await authApi.login(loginPayload);
      expect(getApiInstance().post).toHaveBeenCalledWith('/api/login', loginPayload);
    });

    it('register should call api.post with correct endpoint and payload', async () => {
      const registerPayload: RegisterPayload = {
        name: 'Test User',
        email: 'register@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      };
      await authApi.register(registerPayload);
      expect(getApiInstance().post).toHaveBeenCalledWith('/api/register', registerPayload);
    });

    it('fetchUser should call api.get with correct endpoint', async () => {
      await authApi.fetchUser();
      expect(getApiInstance().get).toHaveBeenCalledWith('/api/user');
    });

    it('logout should call api.post with correct endpoint', async () => {
      await authApi.logout();
      expect(getApiInstance().post).toHaveBeenCalledWith('/api/logout');
    });
  });

  describe('newsApi', () => {
    it('getArticles should call api.get with correct endpoint and params', async () => {
      const params = { page: 1, limit: 10, category: 'tech' };
      await newsApi.getArticles(params);
      expect(getApiInstance().get).toHaveBeenCalledWith('/api/articles', { params });
    });

    it('getArticles should call api.get without params if none provided', async () => {
      await newsApi.getArticles();
      expect(getApiInstance().get).toHaveBeenCalledWith('/api/articles', { params: undefined });
    });

    it('getPersonalizedFeed should call api.get with correct endpoint and params', async () => {
      const params = { page: 1, limit: 5 };
      await newsApi.getPersonalizedFeed(params);
      expect(getApiInstance().get).toHaveBeenCalledWith('/api/feed', { params });
    });

    it('getPersonalizedFeed should call api.get without params if none provided', async () => {
      await newsApi.getPersonalizedFeed();
      expect(getApiInstance().get).toHaveBeenCalledWith('/api/feed', { params: undefined });
    });
  });

  describe('preferencesApi', () => {
    it('getPreferences should call api.get with correct endpoint', async () => {
      await preferencesApi.getPreferences();
      expect(getApiInstance().get).toHaveBeenCalledWith('/api/preferences');
    });

    it('savePreferences should call api.post with correct endpoint and payload', async () => {
      const preferencesPayload: Partial<UserPreference> = {
        preferred_categories: [1, 2, 3],
        preferred_sources: [101, 102],
      };
      await preferencesApi.savePreferences(preferencesPayload);
      expect(getApiInstance().post).toHaveBeenCalledWith('/api/preferences', preferencesPayload);
    });

    it('getSources should call api.get with correct endpoint', async () => {
      await preferencesApi.getSources();
      expect(getApiInstance().get).toHaveBeenCalledWith('/api/sources');
    });

    it('getCategories should call api.get with correct endpoint', async () => {
      await preferencesApi.getCategories();
      expect(getApiInstance().get).toHaveBeenCalledWith('/api/categories');
    });

    it('getAuthors should call api.get with correct endpoint', async () => {
      await preferencesApi.getAuthors();
      expect(getApiInstance().get).toHaveBeenCalledWith('/api/authors');
    });
  });
});
