import axios from 'axios';

import { API_BASE_URL } from '../config/apiConfig';

const api = axios.create({
    baseURL: API_BASE_URL,
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
