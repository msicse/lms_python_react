import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function CreateInstructor() {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'instructor'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = getCurrentUser();

  // Only admins can access this page
  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
          Access Denied: Only administrators can create user accounts.
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setMessage('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/admin/create-instructor/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`${formData.role === 'admin' ? 'Administrator' : 'Instructor'} account created successfully! Email: ${formData.email}`);
        setFormData({ email: '', full_name: '', password: '', role: 'instructor' });
      } else {
        setError(data.error || data.email?.[0] || 'Failed to create instructor account');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Create User Account</h1>
          <p className="text-gray-600 text-sm mt-1">Add a new instructor or administrator to the system</p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="instructor@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">This will be used for login</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
                placeholder="Min 8 characters"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="instructor">Instructor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className={`border rounded-lg p-4 ${formData.role === 'admin' ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-200'}`}>
              <p className={`text-sm font-semibold ${formData.role === 'admin' ? 'text-red-800' : 'text-indigo-800'}`}>
                {formData.role === 'admin' ? '👑 Administrator Privileges' : '🎓 Instructor Privileges'}
              </p>
              <p className={`text-xs mt-1 ${formData.role === 'admin' ? 'text-red-600' : 'text-indigo-600'}`}>
                {formData.role === 'admin' 
                  ? 'Full system access: manage users, courses, create instructors/admins, view all reports and analytics.'
                  : 'Can create and manage courses, view enrolled students, and access course reports.'}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : `Create ${formData.role === 'admin' ? 'Admin' : 'Instructor'} Account`}
              </button>
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Security Best Practice</h3>
          <p className="text-sm text-blue-800">
            Instructor and administrator accounts can only be created by existing administrators. 
            This ensures proper verification and prevents unauthorized access to privileged features.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CreateInstructor;
