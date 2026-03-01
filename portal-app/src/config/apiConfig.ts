// src/config/apiConfig.ts
const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('172.')
);

const LOCAL_URL = `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5000/api/v1`;
const PROD_URL = 'https://pandara-samaja-backend.onrender.com/api/v1';

export const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocal ? LOCAL_URL : PROD_URL);
export const SOCKET_URL = isLocal ? 'http://localhost:5000' : 'https://pandara-samaja-backend.onrender.com';
export const PORTAL_API_URL = `${API_BASE_URL}/portal`;
