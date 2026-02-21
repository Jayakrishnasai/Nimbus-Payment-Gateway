import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor — handle errors
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ── Auth ──
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/me'),
};

// ── Products ──
export const productAPI = {
    list: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    getCategories: () => api.get('/products/categories'),
};

// ── Cart ──
export const cartAPI = {
    get: () => api.get('/cart'),
    addItem: (productId, quantity = 1) => api.post('/cart/items', { productId, quantity }),
    updateItem: (productId, quantity) => api.put(`/cart/items/${productId}`, { quantity }),
    removeItem: (productId) => api.delete(`/cart/items/${productId}`),
    clear: () => api.delete('/cart'),
};

// ── Orders ──
export const orderAPI = {
    create: (data) => api.post('/orders', data),
    list: (params) => api.get('/orders', { params }),
    getById: (id) => api.get(`/orders/${id}`),
};

// ── Payments ──
export const paymentAPI = {
    create: (orderId) => api.post(`/payments/${orderId}`),
    getStatus: (orderId) => api.get(`/payments/${orderId}/status`),
};

export default api;
