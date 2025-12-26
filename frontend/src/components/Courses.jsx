import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lms/courses/`);
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading courses...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Available Courses</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-2">{course.title}</h3>
            <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>
            
            <div className="text-sm text-gray-500 mb-4">
              <p>Category: {course.category_name}</p>
              <p>Instructor: {course.instructor_name}</p>
              <p>Students: {course.enrollments_count}</p>
            </div>

            <Link
              to={`/courses/${course.id}`}
              className="block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <p className="text-center text-gray-500">No courses available yet.</p>
      )}
    </div>
  );
};

export default Courses;
