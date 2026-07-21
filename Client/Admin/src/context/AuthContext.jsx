import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("admin_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("admin_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem("admin_token");
      if (storedToken) {
        try {
          const res = await authService.getProfile();
          if (res.success && res.user && res.user.role === "admin") {
            setUser(res.user);
            localStorage.setItem("admin_user", JSON.stringify(res.user));
          } else {
            handleLogout();
          }
        } catch (err) {
          console.error("Session verification failed:", err);
          handleLogout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  const handleLogin = (jwtToken, userData) => {
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem("admin_token", jwtToken);
    localStorage.setItem("admin_user", JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Logout API warning:", err.message);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login: handleLogin,
        logout: handleLogout,
        isAuthenticated: !!token && user?.role === "admin",
      }}
    >
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

export default AuthContext;
