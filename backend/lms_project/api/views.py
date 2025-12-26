from django.shortcuts import render
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer, ProfileSerializer
from accounts.models import User

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsAdmin, IsInstructor, IsStudent

# Create your views here.

class RegisterAPIView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully"}, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        user  = authenticate(request, email=email, password=password)
        if not user:
            return Response(
                {"error": "Invalid email or password"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "role": user.role,
            },
            status=status.HTTP_200_OK
        )

class ProtectedAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {"message": f"Hello, {request.user.full_name}! This is a protected view."}, 
            status=status.HTTP_200_OK
        )
    
class AdminAPIVIew(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(
            {"message": f"Hello, {request.user.full_name}! This is an admin view."}, 
            status=status.HTTP_200_OK
        )
    

class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request):
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class ForgotPasswordAPIView(APIView):
    """
    Send password reset token to user's email.
    Security: Always returns success message to prevent email enumeration.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {"error": "Email is required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
            
            # Generate password reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Create reset link (adjust domain as needed)
            reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
            
            # Send email (configure EMAIL settings in settings.py)
            try:
                send_mail(
                    subject='Password Reset Request',
                    message=f'Click the link to reset your password: {reset_link}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
            except Exception as e:
                # Log the error but don't expose it to user
                print(f"Email sending failed: {e}")
        
        except User.DoesNotExist:
            # Don't reveal if email exists (security best practice)
            pass
        
        # Always return same message to prevent email enumeration
        return Response(
            {"message": "If an account exists with this email, a password reset link has been sent."}, 
            status=status.HTTP_200_OK
        )
    
class ResetPasswordAPIView(APIView):
    """
    Reset password using token from email.
    Requires: uid (user ID), token, and new_password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        # Validate required fields
        if not all([uid, token, new_password]):
            return Response(
                {"error": "uid, token, and new_password are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password strength
        if len(new_password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters long."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Decode user ID
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            
            # Validate token
            if not default_token_generator.check_token(user, token):
                return Response(
                    {"error": "Invalid or expired reset token."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Reset password
            user.set_password(new_password)
            user.save()
            
            return Response(
                {"message": "Password reset successfully."}, 
                status=status.HTTP_200_OK
            )
            
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                {"error": "Invalid reset link."}, 
                status=status.HTTP_400_BAD_REQUEST
            )