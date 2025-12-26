from django.urls import path
from .views import (
    RegisterAPIView, 
    LoginAPIView, 
    ProtectedAPIView, 
    ProfileAPIView,
    ForgotPasswordAPIView,
    ResetPasswordAPIView
)


urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('protected/', ProtectedAPIView.as_view(), name='protected'),
    path('profile/', ProfileAPIView.as_view(), name='profile'),
    path('password/forgot/', ForgotPasswordAPIView.as_view(), name='forgot-password'),
    path('password/reset/', ResetPasswordAPIView.as_view(), name='reset-password'),
]