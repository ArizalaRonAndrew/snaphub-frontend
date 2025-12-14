// src/layouts/AdminLayout.jsx - UPDATED VERSION
import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu, LogOut, User } from "lucide-react";
import Sidebar from "../components/admin/Sidebar";
import NotificationDropdown from "../components/admin/NotificationDropdown";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get admin info
  const getAdminUser = () => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  };

  const adminUser = getAdminUser();

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      <Sidebar isSidebarOpen={sidebarOpen} onToggleSidebar={setSidebarOpen} />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shadow-sm relative shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-700 hidden lg:block">
              Admin Panel
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Dropdown */}
            <NotificationDropdown />

            {/* Admin Info */}
            {adminUser && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
                <User className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {adminUser.username || "Admin"}
                </span>
              </div>
            )}

            {/* Logout Button */}
            <Link
              to="/admin-logout"
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition shadow-md"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
