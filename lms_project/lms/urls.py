from django import path
from .views import CategoryListView, InstructorCreateCourseView, StudentEnrollCourseView


urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('instructor/courses/', InstructorCreateCourseView.as_view(), name='instructor-create-course'),
    path('student/enroll/<int:course_id>/', StudentEnrollCourseView.as_view(), name='student-enroll-course'),
]