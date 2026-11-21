from rest_framework import serializers
from .models import LearningGoal, LearningNode, StudyLog, SelfAssessment

class LearningNodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningNode
        fields = '__all__'
        read_only_fields = ('goal',) # 节点归属于目标，创建时通过 URL 传入

class LearningGoalSerializer(serializers.ModelSerializer):
    # 嵌套显示节点，方便前端一次性拿到完整数据
    nodes = LearningNodeSerializer(many=True, read_only=True)

    class Meta:
        model = LearningGoal
        fields = '__all__'
        read_only_fields = ('user',) # 所属用户由后端自动填入

class StudyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyLog
        fields = '__all__'
        read_only_fields = ('user',)

class SelfAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SelfAssessment
        fields = '__all__'