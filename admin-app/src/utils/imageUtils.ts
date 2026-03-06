// utils/imageUtils.ts
// Single source of truth for all image URL resolution in the admin app.
// Change this file once — all components update automatically.

import { BACKEND_URL } from '../config/apiConfig';

/**
 * Converts any Google Drive / CDN / relative URL into a displayable URL
 * by routing it through our backend image proxy.
 *
 * Proxy provides:
 *  - Proper HTTP caching (1yr immutable, ETags, 304)
 *  - Auth-controlled access (only our server touches Drive API)
 *  - Graceful fallback on error
 *  - Future: swap storage (Cloudinary, S3) without touching any component
 *
 * @param url Raw URL from the database
 * @returns Resolved URL safe for use in <img src=...>
 */
export function getImageUrl(url: string | null | undefined): string {
    if (!url) return '';

    // Phase 3 (Cloudinary): already a CDN URL — serve as-is
    if (url.includes('res.cloudinary.com')) return url;

    // Google Drive: extract file ID and route through our proxy
    if (url.includes('drive.google.com/uc?id=')) {
        try {
            const fileId = new URL(url).searchParams.get('id');
            if (fileId) return `${BACKEND_URL}/api/v1/image-proxy/${fileId}`;
        } catch {
            // URL parse failed, fall through to regex
            const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (match?.[1]) return `${BACKEND_URL}/api/v1/image-proxy/${match[1]}`;
        }
    }

    // lh3.googleusercontent.com (already proxied or remapped) — extract file ID
    if (url.includes('lh3.googleusercontent.com')) {
        const id = url.split('/d/')?.[1]?.split('?')?.[0] ?? url.match(/[a-zA-Z0-9_-]{25,}/)?.[0];
        if (id) return `${BACKEND_URL}/api/v1/image-proxy/${id}`;
    }

    // Relative seed data path (e.g. "assets/leaders/photo.jpg")
    if (url.startsWith('assets/')) return `https://nikhilaodishapandarasamaja.in/${url}`;

    // Already an absolute URL (blob: for preview, http: for external)
    if (url.startsWith('http') || url.startsWith('blob:')) return url;

    // Relative backend path
    return `${BACKEND_URL}/${url.replace(/^\//, '')}`;
}
