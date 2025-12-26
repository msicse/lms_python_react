import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser, isAuthenticated } from '../services/api';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [courseStats, setCourseStats] = useState(null);
  const [enrollmentStats, setEnrollmentStats] = useState(null);
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
    
    // Fetch additional stats for admin
    if (userData && userData.role === 'admin') {
      fetchAdminStats();
    }
  }, [navigate]);

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch user statistics
      const userStatsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/statistics/users/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (userStatsResponse.ok) {
        const data = await userStatsResponse.json();
        setUserStats(data);
      }
      
      // Fetch course statistics
      const courseStatsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/statistics/courses/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (courseStatsResponse.ok) {
        const data = await courseStatsResponse.json();
        setCourseStats(data);
      }
      
      // Fetch enrollment statistics
      const enrollmentStatsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/statistics/enrollments/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (enrollmentStatsResponse.ok) {
        const data = await enrollmentStatsResponse.json();
        setEnrollmentStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchDashboard = async () => {
    try {
      let token = localStorage.getItem('access_token');
      let response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // If token expired, try to refresh it
      if (response.status === 401) {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const refreshResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken })
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            localStorage.setItem('access_token', refreshData.access);
            token = refreshData.access;
            
            // Retry the original request with new token
            response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
          } else {
            // Refresh failed, redirect to login
            localStorage.clear();
            navigate('/login');
            return;
          }
        } else {
          // No refresh token, redirect to login
          localStorage.clear();
          navigate('/login');
          return;
        }
      }

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('Dashboard fetch failed:', response.status);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || !dashboardData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-2">Hello, {user.full_name}! 👋</h2>
        <p className="text-gray-600">Role: <span className="font-semibold text-indigo-600">{user.role}</span></p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(dashboardData.summary).map(([key, value]) => (
          <div key={key} className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-lg shadow-md p-4">
            <p className="text-indigo-100 text-xs uppercase">{key.replace(/_/g, ' ')}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Student View */}
      {user.role === 'student' && dashboardData.my_enrollments && dashboardData.my_enrollments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">My Enrolled Courses</h3>
          <div className="space-y-3">
            {dashboardData.my_enrollments.map((enrollment) => (
              <div key={enrollment.id} className="border rounded p-3">
                <h4 className="font-semibold">{enrollment.course_title}</h4>
                <p className="text-sm text-gray-600">Category: {enrollment.category}</p>
                <p className="text-sm text-gray-600">Instructor: {enrollment.instructor}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {user.role === 'student' && dashboardData.my_enrollments && dashboardData.my_enrollments.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">You haven't enrolled in any courses yet.</p>
          <a href="/courses" className="text-indigo-600 hover:underline mt-2 inline-block">Browse Courses</a>
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
      {user.role === 'admin' && (
        <div className="space-y-6">
          {/* User Statistics */}
          {userStats && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="mr-2">👥</span> User Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-blue-600 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-blue-700">{userStats.total_users}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-green-600 text-sm font-medium">Active Users</p>
                  <p className="text-3xl font-bold text-green-700">{userStats.active_users}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-red-600 text-sm font-medium">Admins</p>
                  <p className="text-3xl font-bold text-red-700">{userStats.users_by_role?.admin || 0}</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4 text-center">
                  <p className="text-indigo-600 text-sm font-medium">Instructors</p>
                  <p className="text-3xl font-bold text-indigo-700">{userStats.users_by_role?.instructor || 0}</p>
                </div>
              </div>
              
              {/* User Role Distribution Chart */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Users by Role</h4>
                <div className="space-y-3">
                  {Object.entries(userStats.users_by_role || {}).map(([role, count]) => {
                    const total = userStats.total_users;
                    const percentage = ((count / total) * 100).toFixed(1);
                    const colors = {
                      admin: 'bg-red-500',
                      instructor: 'bg-indigo-500',
                      student: 'bg-green-500'
                    };
                    return (
                      <div key={role} className="flex items-center">
                        <div className="w-24 text-sm font-medium text-gray-700 capitalize">{role}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 ml-4">
                          <div 
                            className={`${colors[role]} h-6 rounded-full flex items-center justify-end pr-2`}
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-white text-xs font-semibold">{count}</span>
                          </div>
                        </div>
                        <div className="w-16 text-right text-sm font-medium text-gray-600 ml-2">{percentage}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Recent Registrations */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Registrations</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userStats.recent_registrations?.slice(0, 5).map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{user.full_name}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{user.email}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'instructor' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {new Date(user.date_joined).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {/* Course Statistics */}
          {courseStats && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="mr-2">📚</span> Course Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-purple-600 text-sm font-medium">Total Courses</p>
                  <p className="text-3xl font-bold text-purple-700">{courseStats.total_courses}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <p className="text-orange-600 text-sm font-medium">Total Enrollments</p>
                  <p className="text-3xl font-bold text-orange-700">{courseStats.total_enrollments}</p>
                </div>
                <div className="bg-teal-50 rounded-lg p-4 text-center">
                  <p className="text-teal-600 text-sm font-medium">Avg. Enrollments</p>
                  <p className="text-3xl font-bold text-teal-700">{courseStats.average_enrollments_per_course}</p>
                </div>
              </div>
              
              {/* Courses by Category Chart */}
              {courseStats.courses_by_category?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Courses by Category</h4>
                  <div className="space-y-3">
                    {courseStats.courses_by_category.map((item, index) => {
                      const total = courseStats.total_courses;
                      const percentage = ((item.count / total) * 100).toFixed(1);
                      const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500'];
                      return (
                        <div key={index} className="flex items-center">
                          <div className="w-32 text-sm font-medium text-gray-700">{item.category__name || 'Uncategorized'}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 ml-4">
                            <div 
                              className={`${colors[index % colors.length]} h-6 rounded-full flex items-center justify-end pr-2`}
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="text-white text-xs font-semibold">{item.count}</span>
                            </div>
                          </div>
                          <div className="w-16 text-right text-sm font-medium text-gray-600 ml-2">{percentage}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Top Courses Table */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Courses by Enrollment</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Enrollments</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {courseStats.courses?.slice(0, 5).map((course) => (
                        <tr key={course.id}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{course.title}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{course.category__name || 'N/A'}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{course.instructor__full_name}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                              {course.enrollment_count} students
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {/* Enrollment Statistics */}
          {enrollmentStats && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="mr-2">📈</span> Enrollment Statistics
              </h3>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 text-center">
                <p className="text-gray-600 text-sm font-medium">Total Enrollments</p>
                <p className="text-4xl font-bold text-indigo-600">{enrollmentStats.total_enrollments}</p>
              </div>
              
              {/* Recent Enrollments */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Enrollments</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {enrollmentStats.recent_enrollments?.slice(0, 5).map((enrollment) => (
                        <tr key={enrollment.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{enrollment.student__full_name}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{enrollment.student__email}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{enrollment.course__title}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {new Date(enrollment.enrolled_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow p-6 text-white">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link 
                to="/create-instructor" 
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-3 text-center transition-all"
              >
                <div className="text-2xl mb-1">👤</div>
                <div className="text-sm font-medium">Create User</div>
              </Link>
              <Link 
                to="/create-course" 
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-3 text-center transition-all"
              >
                <div className="text-2xl mb-1">📝</div>
                <div className="text-sm font-medium">Create Course</div>
              </Link>
              <Link 
                to="/users" 
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-3 text-center transition-all"
              >
                <div className="text-2xl mb-1">👥</div>
                <div className="text-sm font-medium">Manage Users</div>
              </Link>
              <Link 
                to="/reports" 
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-3 text-center transition-all"
              >
                <div className="text-2xl mb-1">📊</div>
                <div className="text-sm font-medium">View Reports</div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
