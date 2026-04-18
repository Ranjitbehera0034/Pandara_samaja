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
export const BACKEND_URL = isLocal ? `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5000` : 'https://pandara-samaja-backend.onrender.com';

/**
 * Resolves a media URL from the backend. 
 * If it's a relative path starting with /api, prepends the backend host.
 */
export const resolveMediaUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    // Some URLs might come from Google Drive or other sources
    if (url.includes('drive.google.com')) return url;

    // Get the base host (e.g., http://localhost:5000)
    const host = isLocal ? 'http://localhost:5000' : 'https://pandara-samaja-backend.onrender.com';
    
    // Handle both /api/v1 and api/v1
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${host}${normalizedPath}`;
};
