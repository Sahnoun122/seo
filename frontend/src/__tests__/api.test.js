import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// ─── Mock axios.create so we can inspect the instance ────────────────────────
vi.mock('axios');

// Capture the interceptors added by the module under test
let requestInterceptor;
let responseInterceptorFulfilled;
let responseInterceptorRejected;

const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: {
      use: vi.fn((fn) => { requestInterceptor = fn; }),
    },
    response: {
      use: vi.fn((ok, err) => {
        responseInterceptorFulfilled = ok;
        responseInterceptorRejected = err;
      }),
    },
  },
};

axios.create = vi.fn(() => mockAxiosInstance);

// Import AFTER mocking axios.create
const {
  default: api,
  generateArticle,
  getHistory,
  deleteArticle,
  getSettings,
  updateSettings,
  getCreditPackages,
  fetchUsers,
  updateUserCredits,
  deleteUserAccount,
} = await import('../lib/api.js');

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// ─────────────────────────────────────────────────
// Request interceptor — token attachment
// ─────────────────────────────────────────────────
describe('API request interceptor', () => {
  it('attaches Authorization header when token is in localStorage', () => {
    localStorage.setItem('token', 'my-jwt-token');
    const config = { headers: {} };
    const result = requestInterceptor(config);
    expect(result.headers.Authorization).toBe('Bearer my-jwt-token');
  });

  it('does not add Authorization header when no token exists', () => {
    const config = { headers: {} };
    const result = requestInterceptor(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('passes through the config object unchanged otherwise', () => {
    localStorage.setItem('token', 'tok');
    const config = { headers: {}, timeout: 5000 };
    const result = requestInterceptor(config);
    expect(result.timeout).toBe(5000);
  });
});

// ─────────────────────────────────────────────────
// Response interceptor — auto-logout on 401
// ─────────────────────────────────────────────────
describe('API response interceptor', () => {
  it('passes through successful responses unchanged', () => {
    const response = { data: { ok: true }, status: 200 };
    expect(responseInterceptorFulfilled(response)).toBe(response);
  });

  it('removes token from localStorage on 401 response', async () => {
    localStorage.setItem('token', 'expired-token');
    const error = { response: { status: 401 } };

    try { await responseInterceptorRejected(error); } catch (_) {}

    expect(localStorage.getItem('token')).toBeNull();
  });

  it('redirects to /login on 401 response', async () => {
    const error = { response: { status: 401 } };

    try { await responseInterceptorRejected(error); } catch (_) {}

    expect(window.location.href).toBe('/login');
  });

  it('rejects with the original error on non-401 status', async () => {
    const error = { response: { status: 500 } };
    await expect(responseInterceptorRejected(error)).rejects.toEqual(error);
  });

  it('rejects with the error when there is no response (network error)', async () => {
    const error = new Error('Network Error');
    await expect(responseInterceptorRejected(error)).rejects.toBe(error);
  });
});

// ─────────────────────────────────────────────────
// Named API helpers — correct endpoints
// ─────────────────────────────────────────────────
describe('generateArticle()', () => {
  it('POSTs to /generate-article with the keyword', async () => {
    mockAxiosInstance.post.mockResolvedValue({ data: { success: true, data: {} } });
    await generateArticle('backlinks');
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/generate-article', { keyword: 'backlinks' });
  });

  it('returns the data from the response', async () => {
    const payload = { success: true, data: { title: 'Test' } };
    mockAxiosInstance.post.mockResolvedValue({ data: payload });
    const result = await generateArticle('seo');
    expect(result).toEqual(payload);
  });
});

describe('getHistory()', () => {
  it('GETs /history with default page=1 and limit=12', async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: { data: [] } });
    await getHistory();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/history?page=1&limit=12');
  });

  it('includes search param when provided', async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: { data: [] } });
    await getHistory({ page: 2, limit: 5, search: 'backlinks' });
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/history?page=2&limit=5&search=backlinks');
  });

  it('does not include search param when empty string', async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: { data: [] } });
    await getHistory({ search: '' });
    const call = mockAxiosInstance.get.mock.calls[0][0];
    expect(call).not.toContain('search');
  });
});

describe('deleteArticle()', () => {
  it('calls DELETE /articles/:id', async () => {
    mockAxiosInstance.delete.mockResolvedValue({ data: { success: true } });
    await deleteArticle('article-id-123');
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/articles/article-id-123');
  });
});

describe('getSettings()', () => {
  it('GETs /auth/settings', async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: { settings: {} } });
    await getSettings();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/settings');
  });
});

describe('updateSettings()', () => {
  it('PUTs to /auth/settings with provided data', async () => {
    const payload = { preferredModel: 'gpt-4o' };
    mockAxiosInstance.put = vi.fn().mockResolvedValue({ data: { success: true } });
    await updateSettings(payload);
    expect(mockAxiosInstance.put).toHaveBeenCalledWith('/auth/settings', payload);
  });
});

describe('fetchUsers()', () => {
  it('GETs /admin/users with page and limit params', async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: { data: {} } });
    await fetchUsers(2, 5);
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/admin/users?page=2&limit=5');
  });
});

describe('updateUserCredits()', () => {
  it('PUTs to /admin/users/:id/credits with credits value', async () => {
    mockAxiosInstance.put = vi.fn().mockResolvedValue({ data: { success: true } });
    await updateUserCredits('user-id-456', 100);
    expect(mockAxiosInstance.put).toHaveBeenCalledWith('/admin/users/user-id-456/credits', { credits: 100 });
  });
});

describe('deleteUserAccount()', () => {
  it('calls DELETE /admin/users/:id', async () => {
    mockAxiosInstance.delete.mockResolvedValue({ data: { success: true } });
    await deleteUserAccount('user-id-789');
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/admin/users/user-id-789');
  });
});
