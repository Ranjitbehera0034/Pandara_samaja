// services/api.ts
// Centralized axios instance for the portal app.
// Mirrors the admin-app/src/services/api.ts pattern so both apps 
// talk to the same backend with consistent auth headers.
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

const api = axios.create({
    baseURL: API_BASE_URL, // https://pandara-samaja-backend.onrender.com/api/v1
});

api.interceptors.request.use((config) => {
    if (!config.headers.Authorization) {
        const token = localStorage.getItem('portalToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;
