from rest_framework import serializers
from accounts.models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'full_name', 'role', 'password')

    def create(self, validated_data):
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