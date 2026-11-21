from django.db import models
from django.conf import settings

class LearningGoal(models.Model):
    """学习目标"""
    STATUS_CHOICES = [
        ('active', '进行中'),
        ('completed', '已完成'),
        ('archived', '已归档'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='goals', verbose_name="所属用户")
    title = models.CharField(max_length=200, verbose_name="目标名称")
    description = models.TextField(blank=True, verbose_name="目标描述")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name="状态")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    ai_prompt_raw_text = models.TextField(blank=True, verbose_name="AI原始文本")

    class Meta:
        verbose_name = "学习目标"
        verbose_name_plural = "学习目标"

    def __str__(self):
        return self.title


class LearningNode(models.Model):
    """学习节点"""
    STATUS_CHOICES = [
        ('todo', '未开始'),
        ('in_progress', '进行中'),
        ('done', '已完成'),
    ]
    
    goal = models.ForeignKey(LearningGoal, on_delete=models.CASCADE, related_name='nodes', verbose_name="所属目标")
    title = models.CharField(max_length=200, verbose_name="节点标题")
    content = models.TextField(blank=True, verbose_name="节点内容/学习要求")
    order = models.PositiveIntegerField(default=0, verbose_name="排序")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo', verbose_name="状态")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "学习节点"
        verbose_name_plural = "学习节点"
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.goal.title} - {self.title}"


class StudyLog(models.Model):
    """学习记录/笔记/打卡"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='logs', verbose_name="所属用户")
    node = models.ForeignKey(LearningNode, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs', verbose_name="关联节点")
    study_date = models.DateField(verbose_name="打卡日期")
    duration_minutes = models.PositiveIntegerField(default=0, verbose_name="学习时长(分钟)")
    content = models.TextField(blank=True, verbose_name="笔记/心得")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="记录时间")

    class Meta:
        verbose_name = "学习记录"
        verbose_name_plural = "学习记录"
        ordering = ['-study_date', '-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.study_date} 打卡"


class SelfAssessment(models.Model):
    """自我考核"""
    goal = models.ForeignKey(LearningGoal, on_delete=models.CASCADE, related_name='assessments', verbose_name="所属目标")
    title = models.CharField(max_length=200, verbose_name="考核名称")
    scheduled_date = models.DateField(verbose_name="预定考核日期")
    is_completed = models.BooleanField(default=False, verbose_name="是否已考核")
    score = models.PositiveIntegerField(null=True, blank=True, verbose_name="自评得分")
    reflection = models.TextField(blank=True, verbose_name="考核总结/反思")

    class Meta:
        verbose_name = "自我考核"
        verbose_name_plural = "自我考核"
        ordering = ['scheduled_date']

    def __str__(self):
        return f"{self.goal.title} - {self.title}"