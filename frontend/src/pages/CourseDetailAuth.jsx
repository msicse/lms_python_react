import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/api';

const CourseDetailAuth = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const user = getCurrentUser();

  useEffect(() => {
    fetchCourse();
    checkEnrollment();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lms/courses/${id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch course:', response.status);
      }
      
      const data = await response.json();
      setCourse(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lms/student/enrollments/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const enrollments = await response.json();
        const isEnrolled = enrollments.some(e => e.course === parseInt(id));
        setEnrolled(isEnrolled);
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lms/courses/${id}/enroll/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Successfully enrolled in the course!');
        setEnrolled(true);
        navigate('/my-courses');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to enroll');
      }
    } catch (error) {
      alert('Error enrolling in course');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Course not found</h2>
        <button
          onClick={() => navigate('/dashboard/courses')}
          className="text-indigo-600 hover:underline"
        >
          ← Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/dashboard/courses')}
        className="mb-4 text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2"
      >
        ← Back to Courses
      </button>

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Course Header */}
        <div className="h-64 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
          <div className="text-white text-9xl">📚</div>
        </div>

        {/* Course Content */}
        <div className="p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold">
              {course.category_name}
            </span>
            {enrolled && (
              <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                ✓ Enrolled
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold text-gray-800 mb-4">{course.title}</h1>
          
          <div className="flex items-center gap-6 text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <span>👨‍🏫</span>
              <span className="font-medium">{course.instructor_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👥</span>
              <span>{course.enrollment_count || 0} students enrolled</span>
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Course Description</h2>
            <p className="text-gray-600 text-lg leading-relaxed">{course.description}</p>
          </div>

          {/* Enrollment Section */}
          {user && user.role === 'student' && (
            <div className="border-t pt-6">
              {enrolled ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <h3 className="text-xl font-bold text-green-800 mb-2">You're Enrolled!</h3>
                  <p className="text-green-600 mb-4">Continue learning in your enrolled courses</p>
                  <button
                    onClick={() => navigate('/my-courses')}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold"
                  >
                    Go to My Courses
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll in This Course'}
                </button>
              )}
            </div>
          )}

          {user && user.role === 'instructor' && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
              <p className="text-blue-800">You are viewing this course as an instructor</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailAuth;
