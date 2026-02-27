/**
 * API Helper Utility for Frontend
 * This file provides helper functions to make authenticated API calls
 * Integrated with window.API_BASE_URL from config.js
 */

const getApiBase = () => {
    const base = window.API_BASE_URL || 'http://localhost:5000';
    return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
};

// Token management
const AuthToken = {
    get: () => localStorage.getItem('authToken'),
    set: (token) => localStorage.setItem('authToken', token),
    remove: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('portalToken');
    },
    exists: () => !!localStorage.getItem('authToken') || !!localStorage.getItem('portalToken'),

    // Portal specific token
    getPortal: () => localStorage.getItem('portalToken'),
    setPortal: (token) => localStorage.setItem('portalToken', token)
};

// User management
const AuthUser = {
    get: () => {
        const user = localStorage.getItem('authUser') || localStorage.getItem('portalMember');
        return user ? JSON.parse(user) : null;
    },
    set: (user) => {
        localStorage.setItem('authUser', JSON.stringify(user));
        localStorage.setItem('portalMember', JSON.stringify(user)); // Legacy sync
    },
    remove: () => {
        localStorage.removeItem('authUser');
        localStorage.removeItem('portalMember');
    },
    isAdmin: () => {
        const user = AuthUser.get();
        return user && user.role === 'admin';
    }
};

/**
 * Make an authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
    const token = AuthToken.get() || AuthToken.getPortal();

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    // Add authorization header if token exists
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${getApiBase()}${endpoint}`, config);
        const data = await response.json();

        // Handle unauthorized responses
        if (response.status === 401) {
            // Token expired or invalid - clear auth data
            AuthToken.remove();
            AuthUser.remove();

            // Auto-redirect only if not on public pages
            const isPublicPage = ['index.html', 'about.html', 'members.html', 'matrimony.html', 'blogs.html'].some(p => window.location.pathname.includes(p));
            if (!isPublicPage && !window.location.pathname.includes('/portal/') && !window.location.pathname.includes('/admin/')) {
                window.location.href = 'admin/';
            }

            throw new Error(data.message || 'Authentication required');
        }

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// ============================================
// AUTH API (Admin)
// ============================================

const AuthAPI = {
    login: async (username, password) => {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        if (data.success && data.token) {
            AuthToken.set(data.token);
            AuthUser.set(data.user);
        }
        return data;
    },
    logout: () => {
        AuthToken.remove();
        AuthUser.remove();
        window.location.href = 'index.html';
    },
    verify: async () => apiRequest('/auth/verify')
};

// ============================================
// PORTAL (MEMBER) API
// ============================================

const PortalAPI = {
    /**
     * Start login process (sends WhatsApp OTP)
     */
    login: async (membership_no, mobile) => {
        return await apiRequest('/portal/login', {
            method: 'POST',
            body: JSON.stringify({ membership_no, mobile })
        });
    },

    /**
     * Verify WhatsApp OTP
     */
    verify: async (membership_no, mobile, otp) => {
        const data = await apiRequest('/portal/verify', {
            method: 'POST',
            body: JSON.stringify({ membership_no, mobile, otp })
        });

        if (data.success && data.token) {
            AuthToken.setPortal(data.token);
            AuthUser.set(data.member);
        }

        return data;
    },

    /**
     * Verify OTPless Token (One-Tap Login)
     */
    verifyOtpless: async (otplessToken) => {
        const data = await apiRequest('/portal/verify-otpless', {
            method: 'POST',
            body: JSON.stringify({ otplessToken })
        });

        if (data.success && data.token) {
            AuthToken.setPortal(data.token);
            AuthUser.set(data.member);
        }

        return data;
    },

    /**
     * Get member profile
     */
    getProfile: async () => {
        const token = AuthToken.getPortal();
        return await apiRequest('/portal/profile');
    },

    /**
     * Update profile
     */
    updateProfile: async (profileData) => {
        return await apiRequest('/portal/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }
};

// ============================================
// POSTS & GALLERY API
// ============================================

const PostsAPI = {
    getAll: async () => apiRequest('/posts'),
    create: async (postData) => apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify(postData)
    })
};
