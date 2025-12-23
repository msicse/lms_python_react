from django.urls import path
from .views import RegisterAPIView, LoginAPIView, ProtectedAPIView


urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('protected/', ProtectedAPIView.as_view(), name='protected'),
]