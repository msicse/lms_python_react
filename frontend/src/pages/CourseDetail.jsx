import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCurrentUser, isAuthenticated } from '../services/api';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const user = getCurrentUser();

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      // Course details are public, no auth required
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lms/courses/${id}/`);
      
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

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

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
        alert('Enrolled successfully!');
        fetchCourse();
      } else {
        const data = await response.json();
        alert(data.error || 'Enrollment failed');
      }
    } catch (error) {
      alert('Error enrolling in course');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!course) {
    return <div className="text-center py-10">Course not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Show Navbar for public view */}
      {!isAuthenticated() && <Navbar />}
      
      <div className="p-8">
      <button
        onClick={() => navigate('/courses')}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← Back to Courses
      </button>

      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">{course.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Category:</span> {course.category.name}
            </div>
            <div>
              <span className="font-semibold">Instructor:</span> {course.instructor.full_name}
            </div>
            <div>
              <span className="font-semibold">Students Enrolled:</span> {course.enrollments_count}
            </div>
            <div>
              <span className="font-semibold">Created:</span> {new Date(course.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {user && user.role === 'student' && (
          <div>
            {course.is_enrolled ? (
              <div className="bg-green-100 text-green-800 p-3 rounded">
                ✓ You are enrolled in this course
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {enrolling ? 'Enrolling...' : 'Enroll Now'}
              </button>
            )}
          </div>
        )}

        {!user && (
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Login to Enroll
          </button>
        )}
      </div>
      </div>
    </div>
  );
};

export default CourseDetail;
