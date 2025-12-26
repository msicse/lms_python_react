from django.shortcuts import render, get_object_or_404
from .models import Category, Course, Enrollment
from .serializers import (
    CategorySerializer, 
    CourseListSerializer, 
    CourseDetailSerializer, 
    CourseCreateUpdateSerializer,
    EnrollmentSerializer,
    StudentEnrollmentSerializer
)
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from api.permissions import IsInstructor, IsStudent, IsAdmin, IsInstructorOrAdmin


# ==================== Category Views ====================

class CategoryListCreateView(APIView):
    """List all categories or create new (admin only)"""
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        return [AllowAny()]
    
    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryDetailView(APIView):
    """Get, update or delete a category (admin only for update/delete)"""
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'DELETE']:
            return [IsAuthenticated(), IsAdmin()]
        return [AllowAny()]
    
    def get(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        serializer = CategorySerializer(category)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        serializer = CategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        category.delete()
        return Response({"message": "Category deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


# ==================== Course Views ====================

class CourseListView(APIView):
    """List all courses (public)"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        courses = Course.objects.all().select_related('category', 'instructor')
        serializer = CourseListSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CourseDetailView(APIView):
    """Get course details (public)"""
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        serializer = CourseDetailSerializer(course, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CourseCreateView(APIView):
    """Create a new course (instructor or admin)"""
    permission_classes = [IsAuthenticated, IsInstructorOrAdmin]
    
    def post(self, request):
        serializer = CourseCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            # If admin is creating, they can specify instructor, otherwise use current user
            instructor = request.user if request.user.role == 'instructor' else None
            if request.user.role == 'admin' and 'instructor' in request.data:
                from accounts.models import User
                try:
                    instructor = User.objects.get(id=request.data['instructor'])
                except User.DoesNotExist:
                    instructor = request.user
            else:
                instructor = request.user
            
            serializer.save(instructor=instructor)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CourseUpdateView(APIView):
    """Update a course (instructor - own courses only, or admin - any course)"""
    permission_classes = [IsAuthenticated, IsInstructorOrAdmin]
    
    def put(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        
        # Check if instructor owns this course (admin can edit any course)
        if request.user.role == 'instructor' and course.instructor != request.user:
            return Response(
                {"error": "You can only update your own courses"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = CourseCreateUpdateSerializer(course, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CourseDeleteView(APIView):
    """Delete a course (instructor - own courses or admin)"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        
        # Check permissions: instructor can delete own courses, admin can delete any
        if request.user.role == 'instructor' and course.instructor != request.user:
            return Response(
                {"error": "You can only delete your own courses"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        elif request.user.role not in ['instructor', 'admin']:
            return Response(
                {"error": "Only instructors and admins can delete courses"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        course.delete()
        return Response({"message": "Course deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


class InstructorCoursesView(APIView):
    """List courses created by the logged-in instructor or all courses for admin"""
    permission_classes = [IsAuthenticated, IsInstructorOrAdmin]
    
    def get(self, request):
        # Admins can see all courses, instructors see only their own
        if request.user.role == 'admin':
            courses = Course.objects.all().select_related('category', 'instructor')
        else:
            courses = Course.objects.filter(instructor=request.user).select_related('category')
        
        serializer = CourseListSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ==================== Enrollment Views ====================

class StudentEnrollView(APIView):
    """Enroll student in a course"""
    permission_classes = [IsAuthenticated, IsStudent]
    
    def post(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        
        # Check if already enrolled
        if Enrollment.objects.filter(student=request.user, course=course).exists():
            return Response(
                {"error": "You are already enrolled in this course"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        enrollment = Enrollment.objects.create(student=request.user, course=course)
        serializer = EnrollmentSerializer(enrollment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StudentUnenrollView(APIView):
    """Unenroll student from a course"""
    permission_classes = [IsAuthenticated, IsStudent]
    
    def delete(self, request, course_id):
        enrollment = get_object_or_404(Enrollment, student=request.user, course_id=course_id)
        enrollment.delete()
        return Response({"message": "Successfully unenrolled from course"}, status=status.HTTP_204_NO_CONTENT)


class StudentEnrollmentsView(APIView):
    """List all enrollments for logged-in student"""
    permission_classes = [IsAuthenticated, IsStudent]
    
    def get(self, request):
        enrollments = Enrollment.objects.filter(student=request.user).select_related('course__category', 'course__instructor')
        serializer = StudentEnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CourseEnrollmentsView(APIView):
    """List all enrollments for a specific course (instructor of that course or admin)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        
        # Check permissions
        if request.user.role == 'instructor' and course.instructor != request.user:
            return Response(
                {"error": "You can only view enrollments for your own courses"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        elif request.user.role not in ['instructor', 'admin']:
            return Response(
                {"error": "Only instructors and admins can view course enrollments"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        enrollments = Enrollment.objects.filter(course=course).select_related('student')
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)