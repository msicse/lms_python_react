from django.urls import path
from .views import (
    RegisterAPIView, 
    LoginAPIView, 
    ProtectedAPIView, 
    ProfileAPIView,
    ForgotPasswordAPIView,
    ResetPasswordAPIView,
    DashboardSummaryAPIView,
    UserStatisticsAPIView,
    CourseStatisticsAPIView,
    EnrollmentStatisticsAPIView,
    ReportsAPIView,
    UserListAPIView,
    CreateInstructorAPIView,
)


urlpatterns = [
    # Authentication endpoints
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('protected/', ProtectedAPIView.as_view(), name='protected'),
    path('profile/', ProfileAPIView.as_view(), name='profile'),
    path('password/forgot/', ForgotPasswordAPIView.as_view(), name='forgot-password'),
    path('password/reset/', ResetPasswordAPIView.as_view(), name='reset-password'),
    
    # Dashboard & Reports endpoints
    path('dashboard/', DashboardSummaryAPIView.as_view(), name='dashboard-summary'),
    path('statistics/users/', UserStatisticsAPIView.as_view(), name='user-statistics'),
    path('statistics/courses/', CourseStatisticsAPIView.as_view(), name='course-statistics'),
    path('statistics/enrollments/', EnrollmentStatisticsAPIView.as_view(), name='enrollment-statistics'),
    path('reports/', ReportsAPIView.as_view(), name='reports'),
    
    # User management
    path('users/', UserListAPIView.as_view(), name='user-list'),
    path('admin/create-instructor/', CreateInstructorAPIView.as_view(), name='create-instructor'),
]