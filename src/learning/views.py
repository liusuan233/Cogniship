from django.shortcuts import render



# Create your views here.
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from .models import LearningGoal, LearningNode, StudyLog, SelfAssessment
from .serializers import (
    LearningGoalSerializer, 
    LearningNodeSerializer, 
    StudyLogSerializer, 
    SelfAssessmentSerializer
)

from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .services import parse_ai_text_to_nodes, AI_PROMPT_TEMPLATE

class LearningGoalViewSet(viewsets.ModelViewSet):
    serializer_class = LearningGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # 用户只能看到自己的目标
        return LearningGoal.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # 保存时自动把当前登录用户绑定为目标的主人
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def get_prompt(self, request, pk=None):
        """前端调用此接口获取提示词，方便用户复制去问 AI"""
        goal = self.get_object()
        prompt = AI_PROMPT_TEMPLATE.format(goal_title=goal.title)
        return Response({"prompt": prompt})
    # 粘贴并解析的接口：POST /api/learning/goals/{id}/parse_nodes/
    @action(detail=True, methods=['post'])
    def parse_nodes(self, request, pk=None):
        """接收用户粘贴的 AI 文本，解析并批量生成节点"""
        goal = self.get_object()
        raw_text = request.data.get("raw_text", "")
        
        if not raw_text:
            return Response({"error": "粘贴的文本不能为空"}, status=status.HTTP_400_BAD_REQUEST)

        # 调用解析函数
        nodes_data, error = parse_ai_text_to_nodes(raw_text)
        
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        # 批量创建节点（为了避免阻塞，也可以用 bulk_create）
        # 先清空旧节点（可选，取决于你希望是覆盖还是追加）
        # goal.nodes.all().delete() 
        
        created_nodes = []
        for node_info in nodes_data:
            node = LearningNode.objects.create(
                goal=goal,
                title=node_info['title'],
                content=node_info['content'],
                order=node_info['order']
            )
            created_nodes.append(node)

        # 保存原始文本，方便追溯
        goal.ai_prompt_raw_text = raw_text
        goal.save()

        # 返回创建成功的节点数据
        serializer = LearningNodeSerializer(created_nodes, many=True)
        return Response({
            "message": f"成功解析并创建了 {len(created_nodes)} 个节点",
            "nodes": serializer.data
        }, status=status.HTTP_201_CREATED)

class LearningNodeViewSet(viewsets.ModelViewSet):
    serializer_class = LearningNodeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # 用户只能看到自己目标下的节点
        return LearningNode.objects.filter(goal__user=self.request.user).order_by('order')

class StudyLogViewSet(viewsets.ModelViewSet):
    serializer_class = StudyLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StudyLog.objects.filter(user=self.request.user).order_by('-study_date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SelfAssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = SelfAssessmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SelfAssessment.objects.filter(goal__user=self.request.user).order_by('scheduled_date')