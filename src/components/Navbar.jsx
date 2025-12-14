// src/components/Navbar.jsx - FINAL CORRECTED VERSION
import { Link, useNavigate } from "react-router-dom";
// UPDATED: Added Menu and X icons
import { LogOut, User, Menu, X } from "lucide-react"; 
import UserNotificationDropdown from "./UserNotificationDropdown";
import { AuthService } from "../services/AuthService"; 
// UPDATED: Added useState for mobile menu
import { useState } from "react"; 

export default function Navbar() {
  
  // ADDED: Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // FIX 1: Use AuthService helper for consistent user retrieval
  const user = AuthService.getCurrentUserObject();
  const navigate = useNavigate(); // ADDED: Initialize useNavigate hook
  
  // FIX: Binasa ang 'userName' property na ngayon ay consistent na sa controller.
  const displayUserName = user?.userName; 

  return (
    <nav className="bg-slate-900 text-white px-4 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
      <div className="flex items-center gap-2">
        {/* ADDED: Mobile Menu Toggle Button (Visible only on mobile/md screens) */}
        <button
            className="md:hidden text-white p-1 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
        >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        {/* End Mobile Menu Toggle Button */}

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="text-white size-7"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7.5A2.5 2.5 0 0 1 5.5 5h2.086c.404 0 .787-.162 1.07-.45l1.378-1.378c.283-.288.666-.45 1.07-.45h3.692c.404 0 .787.162 1.07.45l1.378 1.378c.283.288.666.45 1.07.45H18.5A2.5 2.5 0 0 1 21 7.5v9A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
          />
        </svg>
        <span className="text-lg font-semibold">SnapHub</span>
      </div>

      {/* Desktop Navigation Links - Hidden on mobile */}
      <ul className="hidden md:flex gap-6 text-base font-medium">
        <li>
          <Link to="/home" className="hover:text-slate-300">
            Home
          </Link>
        </li>
        <li>
          <Link to="/booking" className="hover:text-slate-300">
            Booking Session
          </Link>
        </li>
        <li>
          <Link to="/student-id" className="hover:text-slate-300">
            Student ID
          </Link>
        </li>
      </ul>

      <div className="flex items-center gap-4">
        {/* Notification Dropdown (Only show if user is logged in) */}
        {user && <UserNotificationDropdown />}

        {/* User Info & Logout */}
        {user ? (
          <div className="flex items-center gap-3">
            {/* Display username using the fixed property 'displayUserName' */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
              <User className="w-4 h-4 hidden sm:block" /> 
              <span className="text-sm font-medium">{displayUserName}</span>
            </div>
            {/* FIX 2: Added Logout Button using AuthService */}
            <button
              onClick={() => navigate("/user-logout")} // MODIFIED: Redirects to UserLogout page
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition shadow-md"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
             // Show link to login page if no user is logged in
            <Link 
                to="/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold transition shadow-md"
            >
                Login
            </Link>
        )}
      </div>

      {/* ADDED: Mobile Menu Dropdown Panel (Appears when isMobileMenuOpen is true) */}
      {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-slate-800 shadow-xl md:hidden py-2 z-40">
              <Link 
                  to="/home" 
                  className="block px-4 py-3 hover:bg-slate-700 transition"
                  onClick={() => setIsMobileMenuOpen(false)}
              >
                  Home
              </Link>
              <Link 
                  to="/booking" 
                  className="block px-4 py-3 hover:bg-slate-700 transition"
                  onClick={() => setIsMobileMenuOpen(false)}
              >
                  Booking Session
              </Link>
              <Link 
                  to="/student-id" 
                  className="block px-4 py-3 hover:bg-slate-700 transition"
                  onClick={() => setIsMobileMenuOpen(false)}
              >
                  Student ID
              </Link>
          </div>
      )}
      {/* End Mobile Menu Dropdown Panel */}

    </nav>
  );
}