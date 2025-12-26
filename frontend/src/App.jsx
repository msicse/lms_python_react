import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import BrowseCourses from './pages/BrowseCourses'
import CourseDetailAuth from './pages/CourseDetailAuth'
import CreateCourse from './pages/CreateCourse'
import CreateInstructor from './pages/CreateInstructor'
import MyCourses from './pages/MyCourses'
import Users from './pages/Users'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import { isAuthenticated } from './services/api'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? <Layout>{children}</Layout> : <Navigate to="/login" />
}

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/courses" 
          element={
            <ProtectedRoute>
              <BrowseCourses />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/courses/:id" 
          element={
            <ProtectedRoute>
              <CourseDetailAuth />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-course" 
          element={
            <ProtectedRoute>
              <CreateCourse />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-instructor" 
          element={
            <ProtectedRoute>
              <CreateInstructor />
            </ProtectedRoute>
          } 
        />        <Route 
          path="/my-courses" 
          element={
            <ProtectedRoute>
              <MyCourses />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/users" 
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  )
}

export default App