import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Welcome to <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">LMS Platform</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Your gateway to world-class education. Learn from expert instructors, 
            explore diverse courses, and achieve your learning goals.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/register"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Why Choose Our Platform?
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-2xl mb-4">
              📚
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Diverse Courses</h3>
            <p className="text-gray-600 text-sm">
              Access a wide range of courses across multiple categories. From technology 
              to business, find the perfect course to enhance your skills.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl mb-4">
              👨‍🏫
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Expert Instructors</h3>
            <p className="text-gray-600 text-sm">
              Learn from industry professionals and experienced educators who are 
              passionate about sharing their knowledge and expertise.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center text-2xl mb-4">
              🎓
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Track Progress</h3>
            <p className="text-gray-600">
              Monitor your learning journey with comprehensive dashboards, enrollment 
              tracking, and personalized course recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto text-center">
            <div className="text-white">
              <div className="text-4xl font-bold mb-1">1000+</div>
              <div className="text-indigo-100">Students Enrolled</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-1">50+</div>
              <div className="text-indigo-100">Expert Instructors</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-1">100+</div>
              <div className="text-indigo-100">Quality Courses</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of students already learning on our platform. 
            Create your free account today!
          </p>
          <Link
            to="/register"
            className="inline-block px-10 py-4 bg-white text-indigo-600 rounded-lg font-bold text-lg hover:bg-gray-100 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
          >
            Sign Up Now - It's Free!
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 LMS Platform. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Empowering learners worldwide with quality education.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
