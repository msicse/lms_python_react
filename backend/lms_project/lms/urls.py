from django.urls import path
from .views import (
    # Category views
    CategoryListCreateView,
    CategoryDetailView,
    # Course views
    CourseListView,
    CourseDetailView,
    CourseCreateView,
    CourseUpdateView,
    CourseDeleteView,
    InstructorCoursesView,
    # Enrollment views
    StudentEnrollView,
    StudentUnenrollView,
    StudentEnrollmentsView,
    CourseEnrollmentsView,
)

urlpatterns = [
    # Category endpoints
    path('categories/', CategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),
    
    # Course endpoints
    path('courses/', CourseListView.as_view(), name='course-list'),
    path('courses/<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('courses/create/', CourseCreateView.as_view(), name='course-create'),
    path('courses/<int:pk>/update/', CourseUpdateView.as_view(), name='course-update'),
    path('courses/<int:pk>/delete/', CourseDeleteView.as_view(), name='course-delete'),
    path('instructor/courses/', InstructorCoursesView.as_view(), name='instructor-courses'),
    
    # Enrollment endpoints
    path('courses/<int:course_id>/enroll/', StudentEnrollView.as_view(), name='student-enroll'),
    path('courses/<int:course_id>/unenroll/', StudentUnenrollView.as_view(), name='student-unenroll'),
    path('student/enrollments/', StudentEnrollmentsView.as_view(), name='student-enrollments'),
    path('courses/<int:course_id>/enrollments/', CourseEnrollmentsView.as_view(), name='course-enrollments'),
]