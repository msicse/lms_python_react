from django.shortcuts import render
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer, ProfileSerializer, LoginSerializer
from accounts.models import User
from lms.models import Course, Category, Enrollment

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsAdmin, IsInstructor, IsStudent

# Create your views here.

class RegisterAPIView(APIView):
    """
    Public registration endpoint - creates student accounts only.
    Instructor and admin accounts must be created by administrators.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Student account registered successfully"}, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreateInstructorAPIView(APIView):
    """
    Admin-only endpoint to create instructor or admin accounts.
    Security: Only admins can create instructor and admin accounts.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def post(self, request):
        data = request.data.copy()
        
        # Get role from request, default to instructor
        role = data.get('role', 'instructor')
        
        # Validate role
        if role not in ['instructor', 'admin']:
            return Response(
                {"error": "Role must be either 'instructor' or 'admin'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate required fields
        if not all([data.get('email'), data.get('full_name'), data.get('password')]):
            return Response(
                {"error": "Email, full name, and password are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if User.objects.filter(email=data.get('email')).exists():
            return Response(
                {"error": "A user with this email already exists."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password strength
        if len(data.get('password', '')) < 8:
            return Response(
                {"error": "Password must be at least 8 characters long."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create user with specified role
            user = User(
                email=data['email'],
                full_name=data['full_name'],
                role=role
            )
            user.set_password(data['password'])
            user.save()
            
            return Response(
                {
                    "message": f"{role.capitalize()} account created successfully",
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "full_name": user.full_name,
                        "role": user.role
                    }
                }, 
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to create {role} account: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data.get('email')
        password = serializer.validated_data.get('password')

        user = authenticate(request, email=email, password=password)
        if not user:
            return Response(
                {"error": "Invalid email or password"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user is active
        if not user.is_active:
            return Response(
                {"error": "This account is inactive"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "message": "Login successful",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role,
                }
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
            
            # Combine uid and token into a single token string for simpler frontend handling
            combined_token = f"{uid}:{token}"
            
            # Create reset link (matches frontend route /reset-password?token=...)
            reset_link = f"{settings.FRONTEND_URL}/reset-password?token={combined_token}"
            
            # Send email with HTML template
            try:
                html_message = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }}
        .email-container {{
            max-width: 600px;
            margin: 40px auto;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }}
        .header {{
            background: rgba(255,255,255,0.1);
            padding: 30px;
            text-align: center;
        }}
        .header h1 {{
            color: white;
            margin: 0;
            font-size: 32px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }}
        .content {{
            background: white;
            padding: 40px 30px;
        }}
        .greeting {{
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }}
        .message {{
            font-size: 16px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }}
        .button-container {{
            text-align: center;
            margin: 35px 0;
        }}
        .reset-button {{
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: transform 0.2s;
        }}
        .reset-button:hover {{
            transform: translateY(-2px);
        }}
        .link-text {{
            font-size: 12px;
            color: #999;
            margin-top: 20px;
            word-break: break-all;
        }}
        .warning {{
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 25px 0;
            border-radius: 4px;
        }}
        .warning p {{
            margin: 0;
            color: #856404;
            font-size: 14px;
        }}
        .footer {{
            background: #f8f9fa;
            padding: 25px;
            text-align: center;
            font-size: 13px;
            color: #666;
            border-top: 1px solid #e0e0e0;
        }}
        .footer p {{
            margin: 5px 0;
        }}
        .security-info {{
            background: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .security-info p {{
            margin: 0;
            color: #0d47a1;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🎓 LMS Platform</h1>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello <strong>{user.full_name}</strong>,
            </div>
            
            <div class="message">
                We received a request to reset your password for your LMS account. Click the button below to create a new password.
            </div>
            
            <div class="button-container">
                <a href="{reset_link}" class="reset-button">Reset Password</a>
            </div>
            
            <div class="link-text">
                Or copy and paste this link in your browser:<br>
                <a href="{reset_link}" style="color: #667eea;">{reset_link}</a>
            </div>
            
            <div class="warning">
                <p><strong>⚠️ Security Note:</strong> This password reset link will expire in 24 hours.</p>
            </div>
            
            <div class="security-info">
                <p><strong>🔒 Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>LMS Learning Management System</strong></p>
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>© 2025 LMS Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
'''
                
                plain_message = f'''Hello {user.full_name},

We received a request to reset your password for your LMS account.

Click the link below to reset your password:
{reset_link}

This link will expire in 24 hours.

If you did not request this password reset, please ignore this email.

Best regards,
LMS Team'''

                from django.core.mail import EmailMultiAlternatives
                
                email_msg = EmailMultiAlternatives(
                    subject='🔐 Password Reset Request - LMS Platform',
                    body=plain_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[email]
                )
                email_msg.attach_alternative(html_message, "text/html")
                email_msg.send(fail_silently=False)
                
                print(f"Password reset email sent successfully to {email}")
            except Exception as e:
                # Log the error but don't expose it to user
                print(f"Email sending failed: {e}")
                # In development, you might want to return the error
                if settings.DEBUG:
                    return Response(
                        {"error": f"Failed to send email: {str(e)}"}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
        
        except User.DoesNotExist:
            # Don't reveal if email exists (security best practice)
            print(f"Password reset attempted for non-existent email: {email}")
            pass
        
        # Always return same message to prevent email enumeration
        return Response(
            {"message": "If an account exists with this email, a password reset link has been sent."}, 
            status=status.HTTP_200_OK
        )
    
class ResetPasswordAPIView(APIView):
    """
    Reset password using token from email.
    Accepts combined token (uid:token format) or separate uid and token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token_param = request.data.get('token')
        new_password = request.data.get('new_password')
        
        # Validate required fields
        if not token_param or not new_password:
            return Response(
                {"error": "Token and new_password are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password strength
        if len(new_password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters long."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Split combined token (uid:token format)
            if ':' in token_param:
                uid, token = token_param.split(':', 1)
            else:
                # Fallback: try to get separate uid and token
                uid = request.data.get('uid', token_param)
                token = token_param
            
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
            
            print(f"Password reset successful for user: {user.email}")
            
            return Response(
                {"message": "Password reset successfully. You can now login with your new password."}, 
                status=status.HTTP_200_OK
            )
            
        except (User.DoesNotExist, ValueError, TypeError) as e:
            print(f"Password reset failed: {e}")
            return Response(
                {"error": "Invalid or expired reset link."}, 
                status=status.HTTP_400_BAD_REQUEST
            )


# ==================== Dashboard & Reports Views ====================

class DashboardSummaryAPIView(APIView):
    """
    Dashboard summary with all key metrics
    Available to: Authenticated users (different data based on role)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Common metrics for all roles
        total_courses = Course.objects.count()
        total_categories = Category.objects.count()
        
        # Role-specific data
        if user.role == 'admin':
            # Admin gets full system statistics
            total_users = User.objects.count()
            total_enrollments = Enrollment.objects.count()
            
            # Role-wise user count
            users_by_role = User.objects.values('role').annotate(count=Count('id'))
            role_counts = {item['role']: item['count'] for item in users_by_role}
            
            # Recent enrollments
            recent_enrollments = Enrollment.objects.select_related('student', 'course').order_by('-enrolled_at')[:5]
            recent_enrollments_data = [{
                'student': e.student.full_name,
                'course': e.course.title,
                'enrolled_at': e.enrolled_at
            } for e in recent_enrollments]
            
            # Courses with most enrollments
            popular_courses = Course.objects.annotate(
                enrollment_count=Count('enrollments')
            ).order_by('-enrollment_count')[:5]
            
            popular_courses_data = [{
                'id': c.id,
                'title': c.title,
                'enrollments': c.enrollment_count
            } for c in popular_courses]
            
            return Response({
                'role': user.role,
                'summary': {
                    'total_users': total_users,
                    'total_courses': total_courses,
                    'total_categories': total_categories,
                    'total_enrollments': total_enrollments,
                },
                'users_by_role': role_counts,
                'recent_enrollments': recent_enrollments_data,
                'popular_courses': popular_courses_data
            }, status=status.HTTP_200_OK)
        
        elif user.role == 'instructor':
            # Instructor gets their course statistics
            my_courses = Course.objects.filter(instructor=user)
            total_my_courses = my_courses.count()
            total_my_students = Enrollment.objects.filter(course__instructor=user).count()
            
            # My courses with enrollment counts
            my_courses_data = my_courses.annotate(
                enrollment_count=Count('enrollments')
            ).values('id', 'title', 'enrollment_count')
            
            return Response({
                'role': user.role,
                'summary': {
                    'my_courses': total_my_courses,
                    'my_students': total_my_students,
                    'total_courses': total_courses,
                    'total_categories': total_categories,
                },
                'courses': list(my_courses_data)
            }, status=status.HTTP_200_OK)
        
        elif user.role == 'student':
            # Student gets their enrollment statistics
            my_enrollments = Enrollment.objects.filter(student=user)
            total_enrolled = my_enrollments.count()
            
            # Recent enrollments
            recent_enrollments = my_enrollments.select_related('course__category', 'course__instructor').order_by('-enrolled_at')[:5]
            recent_enrollments_data = [{
                'id': e.id,
                'course_id': e.course.id,
                'course_title': e.course.title,
                'category': e.course.category.name,
                'instructor': e.course.instructor.full_name,
                'enrolled_at': e.enrolled_at
            } for e in recent_enrollments]
            
            return Response({
                'role': user.role,
                'summary': {
                    'enrolled_courses': total_enrolled,
                    'available_courses': total_courses,
                    'total_categories': total_categories,
                },
                'my_enrollments': recent_enrollments_data
            }, status=status.HTTP_200_OK)
        
        return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)


class UserStatisticsAPIView(APIView):
    """
    Get user statistics (Admin only)
    Returns total users and role-wise breakdown
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        total_users = User.objects.count()
        
        # Count by role
        role_counts = User.objects.values('role').annotate(count=Count('id'))
        users_by_role = {item['role']: item['count'] for item in role_counts}
        
        # Active vs inactive users
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = User.objects.filter(is_active=False).count()
        
        # Recent registrations
        recent_users = User.objects.order_by('-date_joined')[:10].values(
            'id', 'email', 'full_name', 'role', 'date_joined'
        )
        
        return Response({
            'total_users': total_users,
            'users_by_role': users_by_role,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'recent_registrations': list(recent_users)
        }, status=status.HTTP_200_OK)


class CourseStatisticsAPIView(APIView):
    """
    Get course statistics (Admin and Instructors)
    Admin: All courses
    Instructor: Own courses only
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.role == 'admin':
            courses = Course.objects.all()
        elif user.role == 'instructor':
            courses = Course.objects.filter(instructor=user)
        else:
            return Response(
                {'error': 'Only admins and instructors can access course statistics'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        total_courses = courses.count()
        
        # Courses by category
        courses_by_category = courses.values('category__name').annotate(
            count=Count('id')
        )
        
        # Enrollment statistics
        total_enrollments = Enrollment.objects.filter(course__in=courses).count()
        
        # Average enrollments per course
        avg_enrollments = total_enrollments / total_courses if total_courses > 0 else 0
        
        # Courses with enrollment counts
        courses_with_enrollments = courses.annotate(
            enrollment_count=Count('enrollments')
        ).values('id', 'title', 'category__name', 'instructor__full_name', 'enrollment_count').order_by('-enrollment_count')
        
        return Response({
            'total_courses': total_courses,
            'total_enrollments': total_enrollments,
            'average_enrollments_per_course': round(avg_enrollments, 2),
            'courses_by_category': list(courses_by_category),
            'courses': list(courses_with_enrollments)
        }, status=status.HTTP_200_OK)


class EnrollmentStatisticsAPIView(APIView):
    """
    Get enrollment statistics (Admin and Instructors)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.role == 'admin':
            enrollments = Enrollment.objects.all()
        elif user.role == 'instructor':
            enrollments = Enrollment.objects.filter(course__instructor=user)
        else:
            return Response(
                {'error': 'Only admins and instructors can access enrollment statistics'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        total_enrollments = enrollments.count()
        
        # Enrollments by course
        enrollments_by_course = enrollments.values('course__title').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Recent enrollments
        recent_enrollments = enrollments.select_related(
            'student', 'course'
        ).order_by('-enrolled_at')[:10].values(
            'id', 'student__full_name', 'student__email', 
            'course__title', 'enrolled_at'
        )
        
        # Unique students enrolled
        unique_students = enrollments.values('student').distinct().count()
        
        return Response({
            'total_enrollments': total_enrollments,
            'unique_students': unique_students,
            'enrollments_by_course': list(enrollments_by_course),
            'recent_enrollments': list(recent_enrollments)
        }, status=status.HTTP_200_OK)


class ReportsAPIView(APIView):
    """
    Comprehensive reports endpoint (Admin only)
    Provides detailed analytics and insights
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        # User metrics
        total_users = User.objects.count()
        users_by_role = dict(User.objects.values('role').annotate(count=Count('id')).values_list('role', 'count'))
        
        # Course metrics
        total_courses = Course.objects.count()
        total_categories = Category.objects.count()
        courses_by_category = dict(
            Course.objects.values('category__name').annotate(
                count=Count('id')
            ).values_list('category__name', 'count')
        )
        
        # Enrollment metrics
        total_enrollments = Enrollment.objects.count()
        avg_enrollments_per_course = total_enrollments / total_courses if total_courses > 0 else 0
        avg_enrollments_per_student = total_enrollments / users_by_role.get('student', 1)
        
        # Most popular courses
        popular_courses = Course.objects.annotate(
            enrollment_count=Count('enrollments')
        ).order_by('-enrollment_count')[:10].values(
            'id', 'title', 'instructor__full_name', 'enrollment_count'
        )
        
        # Most active instructors
        active_instructors = User.objects.filter(role='instructor').annotate(
            course_count=Count('courses'),
            total_students=Count('courses__enrollments')
        ).order_by('-total_students')[:10].values(
            'id', 'full_name', 'email', 'course_count', 'total_students'
        )
        
        return Response({
            'users': {
                'total': total_users,
                'by_role': users_by_role
            },
            'courses': {
                'total': total_courses,
                'total_categories': total_categories,
                'by_category': courses_by_category
            },
            'enrollments': {
                'total': total_enrollments,
                'avg_per_course': round(avg_enrollments_per_course, 2),
                'avg_per_student': round(avg_enrollments_per_student, 2)
            },
            'popular_courses': list(popular_courses),
            'active_instructors': list(active_instructors)
        }, status=status.HTTP_200_OK)


class UserListAPIView(APIView):
    """
    Get list of all users (Admin only)
    GET /api/users/
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        users = User.objects.all().values(
            'id', 'email', 'full_name', 'role', 'date_joined'
        ).order_by('-date_joined')
        return Response(list(users), status=status.HTTP_200_OK)