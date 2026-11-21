from django.contrib import admin
from .models import LearningGoal, LearningNode, StudyLog, SelfAssessment

class LearningNodeInline(admin.TabularInline):
    model = LearningNode
    extra = 1

@admin.register(LearningGoal)
class LearningGoalAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'status', 'created_at')
    list_filter = ('status', 'user')
    search_fields = ('title', 'description')
    inlines = [LearningNodeInline]

@admin.register(LearningNode)
class LearningNodeAdmin(admin.ModelAdmin):
    list_display = ('title', 'goal', 'status', 'order')
    list_filter = ('status', 'goal')

@admin.register(StudyLog)
class StudyLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'study_date', 'duration_minutes', 'node')
    list_filter = ('study_date', 'user')
    search_fields = ('content',)

@admin.register(SelfAssessment)
class SelfAssessmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'goal', 'scheduled_date', 'is_completed', 'score')
    list_filter = ('is_completed', 'scheduled_date')