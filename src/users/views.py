from rest_framework import generics
from rest_framework.permissions import AllowAny
from .serializers import UserRegisterSerializer

class RegisterView(generics.CreateAPIView):
    """用户注册视图（允许未登录访问）"""
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]