import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const PrivateRoute = () => {
  const { user } = useAuth();

  if (!user) {
    // If not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the nested routes (Outlet)
  return <Outlet />;
};

export default PrivateRoute;
