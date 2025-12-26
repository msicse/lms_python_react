import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/api';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'bg-indigo-700' : '';

  if (!user) return null;

  return (
    <div className="w-56 bg-gradient-to-b from-indigo-800 to-purple-900 text-white h-screen flex flex-col fixed left-0 top-0 shadow-lg">
      {/* Logo/Header */}
      <div className="p-4 border-b border-indigo-700">
        <h1 className="text-xl font-bold">LMS</h1>
        <p className="text-xs text-indigo-200 mt-0.5">{user.role}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <Link
          to="/dashboard"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 hover:bg-indigo-700 transition-colors text-sm ${isActive('/dashboard')}`}
        >
          <span className="text-base">📊</span>
          <span>Dashboard</span>
        </Link>

        <Link
          to="/dashboard/courses"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 hover:bg-indigo-700 transition-colors text-sm ${isActive('/dashboard/courses')}`}
        >
          <span className="text-base">📚</span>
          <span>All Courses</span>
        </Link>

        {(user.role === 'instructor' || user.role === 'admin') && (
          <Link
            to="/create-course"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 hover:bg-indigo-700 transition-colors text-sm ${isActive('/create-course')}`}
          >
            <span className="text-base">➕</span>
            <span>Create Course</span>
          </Link>
        )}

        {user.role === 'student' && (
          <Link
            to="/my-courses"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 hover:bg-indigo-700 transition-colors text-sm ${isActive('/my-courses')}`}
          >
            <span className="text-base">📖</span>
            <span>My Courses</span>
          </Link>
        )}

        {(user.role === 'instructor' || user.role === 'admin') && (
          <Link
            to="/my-courses"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 hover:bg-indigo-700 transition-colors text-sm ${isActive('/my-courses')}`}
          >
            <span className="text-base">👨‍🏫</span>
            <span>My Courses</span>
          </Link>
        )}

        {user.role === 'admin' && (
          <>
            <Link
              to="/users"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 hover:bg-indigo-700 transition-colors text-sm ${isActive('/users')}`}
            >
              <span className="text-base">👥</span>
              <span>Users</span>
            </Link>
            <Link
              to="/create-instructor"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 hover:bg-indigo-700 transition-colors text-sm ${isActive('/create-instructor')}`}
            >
              <span className="text-base">➕</span>
              <span>Create User</span>
            </Link>
            <Link
              to="/reports"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 hover:bg-indigo-700 transition-colors text-sm ${isActive('/reports')}`}
            >
              <span className="text-base">📈</span>
              <span>Reports</span>
            </Link>
          </>
        )}

        <Link
          to="/profile"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 hover:bg-indigo-700 transition-colors text-sm ${isActive('/profile')}`}
        >
          <span className="text-base">👤</span>
          <span>Profile</span>
        </Link>
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-indigo-700">
        <div className="mb-2">
          <p className="text-sm font-semibold truncate">{user.full_name}</p>
          <p className="text-xs text-indigo-200 truncate">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-pink-600 hover:bg-pink-700 px-3 py-1.5 rounded text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
