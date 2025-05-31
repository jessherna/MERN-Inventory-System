import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-lg text-center">
        <h1 className="text-3xl font-bold mb-4">
          Welcome, {user?.name || "User"}!
        </h1>
        <p className="mb-6">
          This is your dashboard. You're now logged in.
        </p>
        <Button onClick={logout} className="mt-4">
          Logout
        </Button>
      </div>
    </div>
  );
};

export default DashboardPage;
