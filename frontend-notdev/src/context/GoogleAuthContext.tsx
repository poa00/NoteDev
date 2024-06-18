import React, { createContext, useContext, useEffect, useState } from "react";
import CryptoJS from "crypto-js";
import { setuid } from "process";

interface UserProfile {
    uid: string;
    name: string;
    email: string;
    picture: string;
}

interface AuthContextType {
    user: UserProfile | null;
    token: string | null;
    uid: string | null;

    login: () => void;
    logout: () => void;
    userLoading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const encryptData = (data: string, privateKey: string) => {
    const ciphertext = CryptoJS.AES.encrypt(data, privateKey).toString();
    return ciphertext;
};

const decryptData = (ciphertext: string, privateKey: string) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, privateKey);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [uid, setuserId] = useState("");
    const [userLoading, setUserLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    const login = async () => {
        try {
            // Redirect to Google OAuth URL
            window.location.href = "http://localhost:5000/auth/google";
        } catch (error) {
            console.error("Error during sign-in:", error);
            throw error;
        }
    };

    const logout = () => {
        // Clear user and token on logout
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storeduid = localStorage.getItem("uid");


        if (storedToken && storeduid) {
            setToken(storedToken);
            setuserId(storeduid);
        }
        setUserLoading(false);
    }, []);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                if (token) {
                    const response = await fetch(
                        "http://localhost:5000/auth/user/profile",
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );

                    if (response.ok) {
                      const userData = await response.json();
        
                      setUser(userData.user);  
                  
                  } else {
                      throw new Error("Failed to fetch user profile");
                  }
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                setError("Failed to fetch user profile");
            } finally {
                setUserLoading(false);
            }
        };

        fetchUserProfile();
    }, [token]);

    return (
        <AuthContext.Provider
            value={{ user, token,uid, login, logout, userLoading, error }}
        >
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export { AuthProvider, useAuth };
