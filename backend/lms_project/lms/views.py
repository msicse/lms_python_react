from django.shortcuts import render
from .models import Category
from .serializers import CategorySerializer, CourseSerializer, EnrollmentSerializer
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from api.permissions import IsInstructor, IsStudent



# Create your views here.


# List all categories
class CategoryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)


# Instruct a new course
class InstructorCreateCourseView(APIView):
    permission_classes = [IsAuthenticated, IsInstructor]

    def post(self, request):
        data = request.data.copy()
        data['instructor'] = request.user.id
        serializer = CourseSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
class StudentEnrollCourseView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def post(self, request, course_id):
        data = {
            'student': request.user.id,
            'course': course_id
        }
        serializer = EnrollmentSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)