from django.db import models
from django.contrib.auth.models import AbstractUser


# Create your models here.
class User(AbstractUser):
    # Add any additional fields you want for your custom user model
    display_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="显示名称")
    bio = models.TextField(blank=True, null=True, verbose_name="个人简介")

    def __str__(self):
        return self.display_name or self.username
