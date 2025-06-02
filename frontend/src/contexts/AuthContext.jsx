import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("auth_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem("auth_token") || null;
    console.log("AuthContext: Initial token from localStorage:", storedToken);
    return storedToken;
  });

  useEffect(() => {
    console.log("AuthContext: token state changed to:", token);
    if (token) {
      console.log("AuthContext: Setting Authorization header with token");
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("auth_token", token);
    } else {
      console.log("AuthContext: Removing Authorization header");
      delete api.defaults.headers.common["Authorization"];
      localStorage.removeItem("auth_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("auth_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("auth_user");
    }
  }, [user]);

  const login = async (email, password) => {
    console.log("Calling POST /auth/login with:", { email, password });
    const response = await api.post("/auth/login", { email, password });
    console.log("Login response.data:", response.data);

    // ─── CHANGE HERE ───
    // Instead of `const { user: loggedInUser, token: jwtToken } = response.data;`,
    // pull out the top-level fields:
    const {
      _id,
      name,
      email: returnedEmail,
      role,
      token: jwtToken,
    } = response.data;

    // Build a `user` object (shape is up to you; at minimum include `name`, `email`, `_id`, maybe `role`)
    const loggedInUser = { _id, name, email: returnedEmail, role };

    console.log("Extracted user:", loggedInUser, "token:", jwtToken);

    setUser(loggedInUser);
    setToken(jwtToken);

    return response.data;
  };

  const register = async (name, email, password) => {
    console.log("Calling POST /auth/register with:", { name, email, password });
    const response = await api.post("/auth/register", { name, email, password });
    console.log("Register response.data:", response.data);

    const {
      _id,
      name: registeredName,
      email: registeredEmail,
      role,
      token: jwtToken,
    } = response.data;

    const newUser = { _id, name: registeredName, email: registeredEmail, role };
    console.log("Extracted user:", newUser, "token:", jwtToken);

    setUser(newUser);
    setToken(jwtToken);

    return response.data;
  };

  const logout = () => {
    console.log("Logging out: clearing user + token");
    setUser(null);
    setToken(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
