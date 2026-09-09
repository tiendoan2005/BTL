// Axios instance dùng chung: gắn Bearer token, tự refresh khi 401.
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const TOKEN_KEY = 'ap_access_token';
export const REFRESH_KEY = 'ap_refresh_token';
export const USER_KEY = 'ap_user';

const client = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 30000,
});

// ---- Request: gắn token ----
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Response: tự refresh 1 lần rồi retry ----
let refreshing = null;

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (
      response?.status === 401 &&
      !config._retried &&
      localStorage.getItem(REFRESH_KEY) &&
      !String(config.url).includes('/auth/')
    ) {
      config._retried = true;
      refreshing = refreshing || doRefresh();
      try {
        const ok = await refreshing;
        if (ok) {
          return client(config); // retry với token mới
        }
      } finally {
        refreshing = null;
      }
      clearAuth();
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

async function doRefresh() {
  try {
    const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
      refreshToken: localStorage.getItem(REFRESH_KEY),
    });
    if (data?.success && data.data?.accessToken) {
      localStorage.setItem(TOKEN_KEY, data.data.accessToken);
      localStorage.setItem(REFRESH_KEY, data.data.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function saveAuth(authData) {
  localStorage.setItem(TOKEN_KEY, authData.accessToken);
  localStorage.setItem(REFRESH_KEY, authData.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

/** Kiểm tra user hiện tại có một trong các quyền yêu cầu không. */
export function hasPermission(required) {
  if (!required || required.length === 0) return true;
  const user = getStoredUser();
  if (!user?.permissions) return false;
  return required.some((p) => user.permissions.includes(p));
}

/** Gọi API trả về { success, message, data }. */
export function unwrap(promise) {
  return promise.then((res) => {
    const body = res.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Có lỗi xảy ra');
    }
    return body?.data !== undefined ? body.data : body;
  });
}

export default client;
