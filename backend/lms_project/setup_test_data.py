"""
Setup script to create test users and sample data
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lms_project.settings')
django.setup()

from accounts.models import User
from lms.models import Category, Course, Enrollment

def create_users():
    """Create test users"""
    print("Creating users...")
    
    # Create instructor
    if not User.objects.filter(email='instructor1@example.com').exists():
        instructor = User.objects.create_user(
            email='instructor1@example.com',
            full_name='Test Instructor',
            role='instructor',
            password='instructor123'
        )
        print(f"✓ Created instructor: {instructor.email}")
    else:
        instructor = User.objects.get(email='instructor1@example.com')
        instructor.set_password('instructor123')
        instructor.save()
        print(f"✓ Updated instructor password: {instructor.email}")
    
    # Create students
    for i in range(1, 4):
        email = f'student{i}@example.com'
        if not User.objects.filter(email=email).exists():
            student = User.objects.create_user(
                email=email,
                full_name=f'Test Student {i}',
                role='student',
                password='student123'
            )
            print(f"✓ Created student: {student.email}")
        else:
            student = User.objects.get(email=email)
            student.set_password('student123')
            student.save()
            print(f"✓ Updated student password: {student.email}")

def create_categories():
    """Create sample categories"""
    print("\nCreating categories...")
    
    categories_data = [
        {"name": "Programming", "description": "Programming and software development courses"},
        {"name": "Data Science", "description": "Data science and analytics courses"},
        {"name": "Web Development", "description": "Web development courses"},
        {"name": "Mobile Development", "description": "Mobile app development courses"},
    ]
    
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            name=cat_data['name'],
            defaults={'description': cat_data['description']}
        )
        if created:
            print(f"✓ Created category: {category.name}")
        else:
            print(f"✓ Category exists: {category.name}")

def create_courses():
    """Create sample courses"""
    print("\nCreating courses...")
    
    instructor = User.objects.get(email='instructor1@example.com')
    
    courses_data = [
        {
            "title": "Introduction to Python",
            "description": "Learn Python programming from scratch",
            "category": "Programming"
        },
        {
            "title": "Web Development with React",
            "description": "Build modern web applications with React",
            "category": "Web Development"
        },
        {
            "title": "Data Analysis with Pandas",
            "description": "Master data analysis using Python and Pandas",
            "category": "Data Science"
        },
    ]
    
    for course_data in courses_data:
        category = Category.objects.get(name=course_data['category'])
        course, created = Course.objects.get_or_create(
            title=course_data['title'],
            defaults={
                'description': course_data['description'],
                'category': category,
                'instructor': instructor
            }
        )
        if created:
            print(f"✓ Created course: {course.title}")
        else:
            print(f"✓ Course exists: {course.title}")

def create_enrollments():
    """Create sample enrollments"""
    print("\nCreating enrollments...")
    
    student1 = User.objects.get(email='student1@example.com')
    courses = Course.objects.all()[:2]
    
    for course in courses:
        enrollment, created = Enrollment.objects.get_or_create(
            student=student1,
            course=course
        )
        if created:
            print(f"✓ Enrolled {student1.email} in {course.title}")
        else:
            print(f"✓ Enrollment exists: {student1.email} in {course.title}")

if __name__ == "__main__":
    print("=" * 60)
    print("Setting up test data for LMS")
    print("=" * 60)
    
    create_users()
    create_categories()
    create_courses()
    create_enrollments()
    
    print("\n" + "=" * 60)
    print("Setup complete!")
    print("=" * 60)
    print(f"Total Users: {User.objects.count()}")
    print(f"Total Categories: {Category.objects.count()}")
    print(f"Total Courses: {Course.objects.count()}")
    print(f"Total Enrollments: {Enrollment.objects.count()}")
