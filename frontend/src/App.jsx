import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import DashboardPage from "./pages/Dashboard";
import InventoryPage from "./pages/InventoryPage";
import ItemPage from "./pages/ItemPage";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/layout/Layout";

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        {/* Private routes (wrapped by PrivateRoute and Layout) */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            {/* Redirect "/dashboard" to "/inventories" */}
            <Route path="/dashboard" element={<Navigate to="/inventories" replace />} />
            <Route path="/inventories" element={<InventoryPage />} />
            <Route path="/items/:inventoryId" element={<ItemPage />} />
          </Route>
        </Route>

        {/* Redirect root to /login or /dashboard depending on auth */}
        <Route path="/" element={<Navigate to="/inventories" replace />} />

        {/* 404 fallback */}
        <Route
          path="*"
          element={
            <div className="h-screen flex items-center justify-center">
              <h2 className="text-2xl">404: Page Not Found</h2>
            </div>
          }
        />
      </Routes>
    </AuthProvider>
  );
};

export default App;
