import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const baseURL = isLocal ? 'http://localhost:5000/api/v1' : 'https://pandara-samaja-backend.onrender.com/api/v1';

const api = axios.create({
    baseURL,
});

api.interceptors.request.use((config) => {
    // Only inject the stored token if the caller did NOT already provide an Authorization header.
    // This is critical for the MFA setup/verify flow where a short-lived temp token must be used.
    if (!config.headers.Authorization) {
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;
