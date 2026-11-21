# src/users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserRegisterSerializer(serializers.ModelSerializer):
    # 密码只写不读，要求至少 6 位
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('username', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "两次输入的密码不一致"})
        return attrs

    def create(self, validated_data):
        # 移除确认密码字段，剩下的交给 create_user 处理（会自动 Hash 密码）
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user