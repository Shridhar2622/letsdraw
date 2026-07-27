import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('letsdraw_token') || null);

    // If token exists, we can decode it or we can just fetch the user profile.
    // For simplicity, we just assume if there's a token, they are somewhat logged in.
    // In a real app we'd have a /api/auth/me route. Here we'll decode the JWT payload manually.
    useEffect(() => {
        if (token) {
            localStorage.setItem('letsdraw_token', token);
            try {
                // safely decode JWT
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const payload = JSON.parse(jsonPayload);
                setUser({ id: payload.id, username: payload.username });
            } catch (e) {
                console.error("Invalid token", e);
                logout();
            }
        } else {
            localStorage.removeItem('letsdraw_token');
            setUser(null);
        }
    }, [token]);

    const login = (userData, jwtToken) => {
        setToken(jwtToken);
        setUser(userData);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
