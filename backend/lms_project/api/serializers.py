from rest_framework import serializers
from accounts.models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('email', 'full_name', 'role', 'password')
        read_only_fields = ('role',)  # Role is auto-set to student

    def validate_role(self, value):
        # Only allow student role during public registration
        # Instructors and admins must be created by existing admins
        if value not in ['student', None]:
            raise serializers.ValidationError(
                "Public registration is only available for students. "
                "Contact an administrator to create instructor or admin accounts."
            )
        return value

    def create(self, validated_data):
        # Force role to be student for public registration
        validated_data['role'] = 'student'
        
        user = User(
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            role=validated_data['role']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
    

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'full_name', 'role')
        read_only_fields = ('email', 'role')


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            raise serializers.ValidationError("Email and password are required.")
        
        return data