const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  verify: (email, code) => request('/auth/verify', { method: 'POST', body: { email, code } }),
  resendCode: (email) => request('/auth/resend-code', { method: 'POST', body: { email } }),

  getProducts: (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ''}`, { token });
  },
  createProduct: (token, product) => request('/products', { method: 'POST', body: product, token }),
  updateProduct: (token, id, updates) => request(`/products/${id}`, { method: 'PUT', body: updates, token }),
  deleteProduct: (token, id) => request(`/products/${id}`, { method: 'DELETE', token }),

  getCategories: (token) => request('/categories', { token }),
  createCategory: (token, name) => request('/categories', { method: 'POST', body: { name }, token }),
  updateCategory: (token, id, name) => request(`/categories/${id}`, { method: 'PUT', body: { name }, token }),
  deleteCategory: (token, id) => request(`/categories/${id}`, { method: 'DELETE', token }),

  checkout: (token, payload) => request('/transactions', { method: 'POST', body: payload, token }),
  getTransactions: (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/transactions${qs ? `?${qs}` : ''}`, { token });
  },
  getTransaction: (token, id) => request(`/transactions/${id}`, { token }),

  getDailyReport: (token, date) => request(`/reports/daily${date ? `?date=${date}` : ''}`, { token }),
};
