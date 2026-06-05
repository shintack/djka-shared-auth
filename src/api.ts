import axios, { AxiosInstance, AxiosError } from 'axios';
import type { CreateApiConfig } from './types';
import { withBasePath, stripBasePath } from './basePath';
import { getToken } from './token';

let instance: AxiosInstance | null = null;
let config: Required<CreateApiConfig> | null = null;

export function createApi(cfg: CreateApiConfig): AxiosInstance {
  config = {
    baseUrl: cfg.baseUrl.replace(/\/+$/, ''),
    publicPaths: cfg.publicPaths ?? [],
    tokenKey: cfg.tokenKey ?? 'access_token',
  };

  instance = axios.create({
    baseURL: `${config.baseUrl}/api`,
    withCredentials: true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    (reqConfig) => {
      if (typeof window !== 'undefined') {
        const token = getToken();
        if (token) {
          reqConfig.headers.Authorization = `Bearer ${token}`;
        }
      }
      return reqConfig;
    },
    (error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        const path = stripBasePath(window.location.pathname);
        const isPublic = (config?.publicPaths ?? []).some((p) =>
          path === p || path.startsWith(`${p}/`),
        ) || path.startsWith('/sso/');

        if (!isPublic) {
          window.location.href = withBasePath('/login');
        }
      }
      return Promise.reject(error);
    },
  );

  return instance;
}

export function getApi(): AxiosInstance {
  if (!instance) {
    throw new Error(
      'API not initialized. Call createApi() before using auth features.',
    );
  }
  return instance;
}

export function getApiConfig(): Required<CreateApiConfig> | null {
  return config;
}
