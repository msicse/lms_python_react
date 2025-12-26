from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    """
    Custom permission to only allow admin users to access certain views.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'
    
class IsInstructor(BasePermission):
    """
    Custom permission to only allow instructor users to access certain views.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'instructor'
    
    
class IsStudent(BasePermission):
    """
    Custom permission to only allow student users to access certain views.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'student'


class IsInstructorOrAdmin(BasePermission):
    """
    Custom permission to allow both instructors and admins to access certain views.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['instructor', 'admin']
