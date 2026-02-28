import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { auth } from "../config/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import type { Member, LoggedUser } from "../types";

interface AuthContextType {
    member: Member | null;
    user: LoggedUser | null;
    isLoading: boolean;
    requestOtp: (membershipNo: string, mobile: string) => Promise<string | undefined>;
    login: (membershipNo: string, mobile: string, otp: string) => Promise<void>;
    loginOtpless: (otplessToken: string, membershipNo: string, mobile: string) => Promise<void>;
    sendFirebaseOtp: (mobile: string, recaptchaContainerId: string) => Promise<void>;
    verifyFirebaseOtp: (otp: string, membershipNo: string, mobile: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "portalMember";
const USER_STORAGE_KEY = "portalUser";
const TOKEN_KEY = "portalToken";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [member, setMember] = useState<Member | null>(null);
    const [user, setUser] = useState<LoggedUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? 'http://localhost:5000/api/v1'
        : 'https://pandara-samaja-backend.onrender.com/api/v1';

    useEffect(() => {
        const loadStoredAuth = () => {
            const savedMember = localStorage.getItem(STORAGE_KEY);
            const savedUser = localStorage.getItem(USER_STORAGE_KEY);

            console.log("[AUTH] Loading stored auth:", {
                hasMember: !!savedMember,
                hasUser: !!savedUser
            });

            if (savedMember) {
                try {
                    const parsed = JSON.parse(savedMember);
                    setMember(parsed);
                } catch (err) {
                    console.error("Failed to parse stored member", err);
                }
            }
            if (savedUser) {
                try {
                    const parsed = JSON.parse(savedUser);
                    setUser(parsed);
                    console.log("[AUTH] Set user from storage:", parsed.name);
                } catch (err) {
                    console.error("Failed to parse stored user", err);
                }
            }
            setIsLoading(false);
        };

        loadStoredAuth();
    }, []);

    const handleLoginSuccess = (data: any) => {
        const memberData = data.member;
        const userData = data.loggedInUser || { name: memberData.name, relation: 'Head' };

        console.log("[AUTH] Login Success. Setting User:", userData.name);

        setMember(memberData);
        setUser(userData);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(memberData));
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        localStorage.setItem(TOKEN_KEY, data.token);

        toast.success(`Welcome back, ${userData.name}!`);
    };

    const requestOtp = async (membershipNo: string, mobile: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/portal/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ membership_no: membershipNo, mobile }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to request OTP");

            toast.success(data.message || "OTP sent to your WhatsApp");
            return data.message;
        } catch (err: any) {
            console.error("OTP request error:", err);
            toast.error(err.message || "OTP request failed");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (membershipNo: string, mobile: string, otp: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/portal/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ membership_no: membershipNo, mobile, otp }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            if (data.success && data.token) {
                handleLoginSuccess(data);
            } else {
                throw new Error(data.message || "Invalid response from server");
            }

        } catch (err: any) {
            console.error("Login error:", err);
            toast.error(err.message || "Login failed");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const loginOtpless = async (otplessToken: string, membershipNo: string, mobile: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/portal/verify-otpless`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    otpless_token: otplessToken,
                    membership_no: membershipNo,
                    mobile
                }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "OTPless login failed");

            if (data.success && data.token) {
                handleLoginSuccess(data);
            }
        } catch (err: any) {
            toast.error(err.message || "OTPless login failed");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const sendFirebaseOtp = async (mobile: string, recaptchaContainerId: string) => {
        setIsLoading(true);
        try {
            // Format mobile number with +91 if not present
            const formattedMobile = mobile.startsWith('+') ? mobile : `+91${mobile}`;

            const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
                size: 'invisible',
            });

            const result = await signInWithPhoneNumber(auth, formattedMobile, recaptchaVerifier);
            setConfirmationResult(result);
            toast.success("OTP sent to your mobile via SMS");
        } catch (err: any) {
            console.error("Firebase OTP request error:", err);
            toast.error(err.message || "Failed to send SMS OTP");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const verifyFirebaseOtp = async (otp: string, membershipNo: string, mobile: string) => {
        if (!confirmationResult) {
            toast.error("Please request OTP first");
            return;
        }

        setIsLoading(true);
        try {
            const userCredential = await confirmationResult.confirm(otp);
            const idToken = await userCredential.user.getIdToken();

            // Send idToken to backend
            const response = await fetch(`${API_BASE_URL}/portal/login/firebase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken,
                    membership_no: membershipNo,
                    mobile
                }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Firebase login failed");

            if (data.success && data.token) {
                handleLoginSuccess(data);
            }
        } catch (err: any) {
            console.error("Firebase login error:", err);
            toast.error(err.message || "Invalid OTP or login failed");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setMember(null);
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
        toast.info("Logged out successfully");
    };

    return (
        <AuthContext.Provider value={{
            member,
            user,
            isLoading,
            requestOtp,
            login,
            loginOtpless,
            sendFirebaseOtp,
            verifyFirebaseOtp,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
