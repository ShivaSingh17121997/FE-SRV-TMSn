'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AuthContextType, Role } from '@/types';

export interface AuthUser {
    id: string;    // frontend-friendly alias for _id
    _id: string;
    name: string;
    email: string;
    role: Role;
    phone?: string;
    city?: string;
    subjects?: string[];
    profilePhoto?: string;
    googleMeetLink?: string;
}

interface AuthCtx {
    user: AuthUser | null;
    token: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://be-teachers-record.onrender.com/api';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const queryClient = useQueryClient();

    // Rehydrate from localStorage on mount
    useEffect(() => {
        try {
            const storedToken = localStorage.getItem('authToken');
            const storedUser = localStorage.getItem('authUser');
            if (storedToken && storedUser) {
                const parsed = JSON.parse(storedUser);
                setToken(storedToken);
                setUser({ ...parsed, id: parsed._id ?? parsed.id });
            }
        } catch {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Global fetch interceptor for 401 Unauthorized errors
    useEffect(() => {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            if (response.status === 401) {
                const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : '');
                if (!url.includes('/auth/login')) {
                    
                    // Prevent infinite loops from multiple parallel requests triggering this
                    if (!window.sessionStorage.getItem('isRedirectingToLogin')) {
                        window.sessionStorage.setItem('isRedirectingToLogin', 'true');
                        toast.error('Session expired or invalid token. Please log in again.');
                        
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('authUser');
                        setToken(null);
                        setUser(null);
                        if (queryClient) queryClient.clear();
                        
                        setTimeout(() => {
                            window.sessionStorage.removeItem('isRedirectingToLogin');
                            router.push('/login');
                        }, 1000);
                    }
                }
            }
            return response;
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, [router, queryClient]);

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) return false;

            const apiUser = data.data.user;
            const authUser: AuthUser = {
                _id: apiUser._id,
                id: apiUser._id,
                name: apiUser.name,
                email: apiUser.email,
                role: apiUser.role as Role,
                phone: apiUser.phone,
                city: apiUser.city,
                subjects: apiUser.subjects,
                profilePhoto: apiUser.profilePhoto,
                googleMeetLink: apiUser.googleMeetLink,
            };

            localStorage.setItem('authToken', data.data.token);
            localStorage.setItem('authUser', JSON.stringify(authUser));
            setToken(data.data.token);
            setUser(authUser);
            queryClient.clear();
            return true;
        } catch (err) {
            console.error('Login error:', err);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setToken(null);
        setUser(null);
        queryClient.clear();
        router.push('/login');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                isAuthenticated: !!user,
                isLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
