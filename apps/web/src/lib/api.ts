import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  requestOtp: (phone: string) => api.post('/auth/otp/request', { phone }),
  verifyOtp: (phone: string, code: string) => api.post('/auth/otp/verify', { phone, code }),
  me: () => api.get('/users/me'),
};

export const productsApi = {
  list: (all?: boolean) => api.get('/products', { params: all ? { all: 'true' } : {} }),
  nextCode: () => api.get('/products/next-code'),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.patch(`/products/${id}`, data),
  remove: (id: string) => api.delete(`/products/${id}`),
  transfer: (id: string, toProductId: string) => api.post(`/products/${id}/transfer`, { toProductId }),
};

export const vehiclesApi = {
  listTypes: () => api.get('/vehicles/types'),
  createType: (data: any) => api.post('/vehicles/types', data),
  list: () => api.get('/vehicles'),
  available: () => api.get('/vehicles/available'),
  create: (data: any) => api.post('/vehicles', data),
  update: (id: string, data: any) => api.patch(`/vehicles/${id}`, data),
  remove: (id: string) => api.delete(`/vehicles/${id}`),
};

export const driversApi = {
  list: () => api.get('/drivers'),
  create: (data: any) => api.post('/drivers', data),
  update: (id: string, data: any) => api.patch(`/drivers/${id}`, data),
  revokeVehicle: (id: string) => api.post(`/drivers/${id}/revoke-vehicle`),
  remove: (id: string) => api.delete(`/drivers/${id}`),
};

export const customersApi = {
  list: () => api.get('/customers'),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.patch(`/customers/${id}`, data),
};

export const shiftsApi = {
  list: (status?: string) => api.get('/shifts', { params: { status } }),
  get: (id: string) => api.get(`/shifts/${id}`),
  inventory: (id: string) => api.get(`/shifts/${id}/inventory`),
  create: (data: any) => api.post('/shifts', data),
  createLoad: (id: string, data: any) => api.post(`/shifts/${id}/load`, data),
  listLoads: (id: string) => api.get(`/shifts/${id}/loads`),
  approveLoad: (recordId: string) => api.post(`/shifts/load/${recordId}/approve`),
  start: (id: string) => api.post(`/shifts/${id}/start`),
  close: (id: string, data: any) => api.post(`/shifts/${id}/close`, data),
};

export const missionsApi = {
  byShift: (shiftId: string) => api.get(`/missions/by-shift/${shiftId}`),
  get: (id: string) => api.get(`/missions/${id}`),
  create: (data: any) => api.post('/missions', data),
  arrive: (id: string, data: any) => api.post(`/missions/${id}/arrive`, data),
  complete: (id: string, data: any, clientOpId?: string) =>
    api.post(`/missions/${id}/complete`, data, {
      headers: clientOpId ? { 'X-Client-Op-Id': clientOpId } : {},
    }),
};

export const usersApi = {
  list: (all?: boolean) => api.get('/users', { params: all ? { all: 'true' } : {} }),
  roles: () => api.get('/users/roles'),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  me: () => api.get('/users/me'),
};

export const catalogApi = {
  units: (all?: boolean) => api.get('/catalog/units', { params: all ? { all: 'true' } : {} }),
  createUnit: (data: any) => api.post('/catalog/units', data),
  updateUnit: (id: string, data: any) => api.patch(`/catalog/units/${id}`, data),
  warehouses: (all?: boolean) => api.get('/catalog/warehouses', { params: all ? { all: 'true' } : {} }),
  createWarehouse: (data: any) => api.post('/catalog/warehouses', data),
  updateWarehouse: (id: string, data: any) => api.patch(`/catalog/warehouses/${id}`, data),
  categories: (all?: boolean) => api.get('/catalog/categories', { params: all ? { all: 'true' } : {} }),
  createCategory: (data: any) => api.post('/catalog/categories', data),
  updateCategory: (id: string, data: any) => api.patch(`/catalog/categories/${id}`, data),
};

export const auditApi = {
  list: (params?: { module?: string; take?: number }) => api.get('/audit', { params }),
};

export const rbacApi = {
  roles: () => api.get('/rbac/roles'),
  permissions: () => api.get('/rbac/permissions'),
  createRole: (data: any) => api.post('/rbac/roles', data),
  updateRole: (id: string, data: any) => api.patch(`/rbac/roles/${id}`, data),
  removeRole: (id: string) => api.delete(`/rbac/roles/${id}`),
};

export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard'),
  shifts: () => api.get('/reports/shifts'),
  missions: () => api.get('/reports/missions'),
  inventory: (shiftId: string) => api.get(`/reports/inventory/${shiftId}`),
  liveDrivers: () => api.get('/reports/live-drivers'),
  audit: (take?: number) => api.get('/reports/audit', { params: { take } }),
  ping: (data: any) => api.post('/reports/location-ping', data),
};
