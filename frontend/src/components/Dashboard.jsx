import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, isAuthenticated } from '../services/api';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const userData = getCurrentUser();
    setUser(userData);
    fetchDashboard();
  }, [navigate]);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || !dashboardData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-2">Hello, {user.full_name}! 👋</h2>
        <p className="text-gray-600">Role: <span className="font-semibold text-blue-600">{user.role}</span></p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(dashboardData.summary).map(([key, value]) => (
          <div key={key} className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">{key.replace(/_/g, ' ').toUpperCase()}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
        ))}
      </div>

      {/* Student View */}
      {user.role === 'student' && dashboardData.my_enrollments && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">My Enrolled Courses</h3>
          <div className="space-y-3">
            {dashboardData.my_enrollments.map((enrollment) => (
              <div key={enrollment.id} className="border rounded p-3">
                <h4 className="font-semibold">{enrollment.course.title}</h4>
                <p className="text-sm text-gray-600">Category: {enrollment.course.category_name}</p>
                <p className="text-sm text-gray-600">Instructor: {enrollment.course.instructor_name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructor View */}
      {user.role === 'instructor' && dashboardData.courses && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">My Courses</h3>
          <div className="space-y-3">
            {dashboardData.courses.map((course) => (
              <div key={course.id} className="border rounded p-3">
                <h4 className="font-semibold">{course.title}</h4>
                <p className="text-sm text-gray-600">Students: {course.enrollment_count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin View */}
      {user.role === 'admin' && dashboardData.users_by_role && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">System Overview</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {Object.entries(dashboardData.users_by_role).map(([role, count]) => (
              <div key={role} className="border rounded p-3 text-center">
                <p className="text-gray-600 text-sm">{role.toUpperCase()}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
