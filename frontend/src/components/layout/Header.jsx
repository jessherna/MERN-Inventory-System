import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Inventory App</Link>
        <nav>
          {
            user ? (
              <div className="flex items-center space-x-4">
                <Link to="/inventories" className="hover:underline">Inventories</Link>
                {/* Add other authenticated links here if needed */}
                <button onClick={logout} className="hover:underline">Logout</button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="hover:underline">Login</Link>
                <Link to="/register" className="hover:underline">Register</Link>
              </div>
            )
          }
        </nav>
      </div>
    </header>
  );
};

export default Header; 