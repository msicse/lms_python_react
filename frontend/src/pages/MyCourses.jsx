import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getCurrentUser();

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const token = localStorage.getItem('access_token');
      let url = '';
      
      // Different endpoints for different roles
      if (user.role === 'student') {
        url = `${API_BASE_URL}/lms/student/enrollments/`;
      } else if (user.role === 'instructor' || user.role === 'admin') {
        url = `${API_BASE_URL}/lms/instructor/courses/`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        setError('Failed to fetch courses');
      }
    } catch (err) {
      setError('Error loading courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {user.role === 'student' ? 'My Enrolled Courses' : 'My Courses'}
          </h1>
          <p className="text-gray-600">
            {user.role === 'student' 
              ? 'Courses you are currently enrolled in' 
              : user.role === 'admin' 
                ? 'All courses in the system' 
                : 'Courses you are teaching'}
          </p>
        </div>

        {/* Courses Grid */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((item) => {
              // For students, item is an enrollment object with nested course
              // For instructors, item is directly a course object
              const course = user.role === 'student' ? item.course : item;
              
              return (
                <div 
                  key={user.role === 'student' ? item.id : course.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  {/* Course Header - Gradient */}
                  <div className="h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
                    <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all"></div>
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-white bg-opacity-90 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                        {user.role === 'student' ? course.category_name : course.category.name}
                      </span>
                    </div>
                    {user.role === 'student' && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Enrolled
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Course Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 h-16">
                      {course.description}
                    </p>

                    {/* Course Meta */}
                    <div className="flex items-center text-xs text-gray-500 mb-4 space-x-4">
                      {user.role === 'student' ? (
                        <>
                          <div className="flex items-center gap-1">
                            <span>👨‍🏫</span>
                            <span className="truncate">{course.instructor_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>📅</span>
                            <span>{new Date(item.enrolled_at).toLocaleDateString()}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1">
                            <span>👥</span>
                            <span>{course.enrollments_count || 0} students</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>📅</span>
                            <span>{new Date(course.created_at).toLocaleDateString()}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link
                        to={`/courses/${course.id}`}
                        className="flex-1 text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                      >
                        View Details
                      </Link>
                      {user.role === 'instructor' && (
                        <button
                          className="px-4 py-2 border border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
                          onClick={() => alert('Edit functionality coming soon!')}
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <div className="text-6xl mb-4">
              {user.role === 'student' ? '📚' : '👨‍🏫'}
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {user.role === 'student' ? 'No enrollments yet' : 'No courses yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {user.role === 'student' 
                ? 'Start learning by enrolling in courses' 
                : 'Create your first course to start teaching'}
            </p>
            <Link
              to={user.role === 'student' ? '/courses' : '/courses/create'}
              className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700"
            >
              {user.role === 'student' ? 'Browse Courses' : 'Create Course'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyCourses;
