import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// =========================
// REQUEST INTERCEPTOR
// =========================
client.interceptors.request.use(
  (config) => {
    // obtener token
    const token = localStorage.getItem('token');
    // agregar Authorization
    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// =========================
// RESPONSE INTERCEPTOR
// =========================

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // token inválido o expirado
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
