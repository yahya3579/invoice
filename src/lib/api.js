// API utility functions for admin dashboard

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}/api${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || 'An error occurred', response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 500);
  }
}

// Admin Dashboard API
export const adminDashboardApi = {
  getDashboard: () => apiRequest('/admin/dashboard'),
};

// User Management API
export const userApi = {
  getUsers: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    return apiRequest(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  getUser: (id) => apiRequest(`/admin/users/${id}`),

  createUser: (userData) => apiRequest('/admin/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  updateUser: (id, userData) => apiRequest(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),

  deleteUser: (id) => apiRequest(`/admin/users/${id}`, {
    method: 'DELETE',
  }),

  updateFbrToken: (id, fbrToken) => apiRequest(`/admin/users/${id}/fbr-token`, {
    method: 'PUT',
    body: JSON.stringify({ fbrApiToken: fbrToken }),
  }),

  generateFbrToken: (id) => apiRequest(`/admin/users/${id}/fbr-token`, {
    method: 'POST',
  }),
};

// Organization Management API
export const organizationApi = {
  getOrganizations: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    return apiRequest(`/admin/organizations${queryString ? `?${queryString}` : ''}`);
  },

  getOrganization: (id) => apiRequest(`/admin/organizations/${id}`),

  createOrganization: (orgData) => apiRequest('/admin/organizations', {
    method: 'POST',
    body: JSON.stringify(orgData),
  }),

  updateOrganization: (id, orgData) => apiRequest(`/admin/organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(orgData),
  }),

  deleteOrganization: (id) => apiRequest(`/admin/organizations/${id}`, {
    method: 'DELETE',
  }),
};

// Subscription Management API
export const subscriptionApi = {
  getSubscriptions: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    return apiRequest(`/admin/subscriptions${queryString ? `?${queryString}` : ''}`);
  },

  getSubscription: (id) => apiRequest(`/admin/subscriptions/${id}`),

  updateSubscription: (id, subscriptionData) => apiRequest(`/admin/subscriptions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(subscriptionData),
  }),

  bulkUpdateSubscriptions: (subscriptionData) => apiRequest('/admin/subscriptions', {
    method: 'PUT',
    body: JSON.stringify(subscriptionData),
  }),
};

// Analytics API
export const analyticsApi = {
  getAnalytics: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    return apiRequest(`/admin/analytics${queryString ? `?${queryString}` : ''}`);
  },
};

export { ApiError };

// User-side APIs
export const authApi = {
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  session: () => apiRequest('/auth/session'),
  refresh: () => apiRequest('/auth/refresh', { method: 'POST' }),
};

export const invoiceApi = {
  list: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') sp.append(k, v);
    });
    const qs = sp.toString();
    return apiRequest(`/invoices${qs ? `?${qs}` : ''}`);
  },
  get: (id) => apiRequest(`/invoices/${id}`),
  create: (payload) => apiRequest('/invoices', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => apiRequest(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id) => apiRequest(`/invoices/${id}`, { method: 'DELETE' }),
  downloadPdf: (id) => apiRequest(`/invoices/${id}/pdf`),
  bulkCreate: (payload) => apiRequest('/invoices/bulk', { method: 'POST', body: JSON.stringify(payload) }),
};

export const fbrApi = {
  validate: (invoice) => apiRequest('/fbr/validate', { method: 'POST', body: JSON.stringify({ invoice }) }),
  register: (invoiceId) => apiRequest('/fbr/register', { method: 'POST', body: JSON.stringify({ invoiceId }) }),
  status: (irn) => apiRequest(`/fbr/status/${irn}`),
  checkToken: () => apiRequest('/fbr/check-token'),
  getErrorCodes: (codes) => apiRequest(`/fbr/error-codes${codes ? `?codes=${codes}` : ''}`),
};

export const uploadApi = {
  excel: (fileBase64) => apiRequest('/upload/excel', { method: 'POST', body: JSON.stringify({ fileBase64 }) }),
  template: () => apiRequest('/upload/template'),
};