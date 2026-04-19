import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface AdminUser {
    id: number;
    username: string;
    role: string;
}

interface AdminAuthContextType {
    token: string | null;
    user: AdminUser | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
    const [user, setUser] = useState<AdminUser | null>(null);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('adminToken', token);
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser(payload);
            } catch (_e) {
                console.error('Failed to parse token');
            }
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('adminToken');
            setUser(null);
        }
    }, [token]);

    const login = (newToken: string) => {
        setToken(newToken);
    };

    const logout = () => {
        setToken(null);
    };

    return (
        <AdminAuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth() {
    const context = useContext(AdminAuthContext);
    if (context === undefined) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
}

