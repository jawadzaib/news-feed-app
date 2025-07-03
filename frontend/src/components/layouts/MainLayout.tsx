import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { NavLink, Outlet } from "react-router-dom";

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-md p-4 px-4 md:px-8 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-3xl sm:text-lg font-bold text-green-700">
          News Feed
        </h1>{" "}
        <nav className="hidden md:flex justify-center space-x-4">
          <NavLink
            to="/feed"
            className={({ isActive }) =>
              `px-4 py-2 font-medium transition duration-150 ease-in-out ${
                isActive
                  ? "text-green-600"
                  : "text-green-700 hover:text-green-500"
              }`
            }
          >
            My Feed
          </NavLink>
          <NavLink
            to="/articles"
            className={({ isActive }) =>
              `px-4 py-2 font-medium transition duration-150 ease-in-out ${
                isActive
                  ? "text-green-600"
                  : "text-green-700 hover:text-green-500"
              }`
            }
          >
            Search Articles
          </NavLink>
        </nav>
        {/* Desktop layout */}
        <div className="hidden md:flex items-center space-x-4">
          <span className="text-gray-700">Welcome, {user?.name}!</span>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150 ease-in-out"
          >
            Logout
          </button>
        </div>
        {/* Mobile layout */}
        <div className="md:hidden flex items-center">
          <button
            onClick={toggleMobileMenu}
            className="text-gray-800 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Content (slides down) */}
      <div
        className={`md:hidden shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "max-h-screen py-4" : "max-h-0" // Control height for slide effect
        }`}
      >
        <nav className="flex flex-col px-4 items-center space-y-2">
          <NavLink
            to="/feed"
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              `px-4 text-base font-medium transition duration-150 ease-in-out w-full ${
                isActive ? "text-green-600" : "hover:text-green-700"
              }`
            }
          >
            My Feed
          </NavLink>
          <NavLink
            to="/articles"
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              `px-4 text-base font-medium transition duration-150 ease-in-out w-full ${
                isActive ? "text-green-600" : "hover:text-green-700"
              }`
            }
          >
            Search Articles
          </NavLink>
          <button
            onClick={() => {
              logout();
              closeMobileMenu();
            }}
            className={`px-4 text-left text-base font-medium transition duration-150 ease-in-out w-full text-red-600`}
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
