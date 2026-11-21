from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LearningGoalViewSet, 
    LearningNodeViewSet, 
    StudyLogViewSet, 
    SelfAssessmentViewSet
)

router = DefaultRouter()
router.register(r'goals', LearningGoalViewSet, basename='goals')
router.register(r'nodes', LearningNodeViewSet, basename='nodes')
router.register(r'logs', StudyLogViewSet, basename='logs')
router.register(r'assessments', SelfAssessmentViewSet, basename='assessments')

urlpatterns = [
    path('', include(router.urls)),
]