from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from .models import LearningGoal, LearningNode
from .services import parse_ai_text_to_nodes

User = get_user_model()


class TestAIParserService(TestCase):
    """测试纯解析函数（不涉及数据库和网络请求）"""

    def test_parse_standard_json(self):
        """测试标准的 JSON 数组解析"""
        raw_text = '[{"title": "节点1", "content": "内容1"}, {"title": "节点2", "content": "内容2"}]'
        nodes, error = parse_ai_text_to_nodes(raw_text)
        
        self.assertIsNone(error)
        self.assertEqual(len(nodes), 2)
        self.assertEqual(nodes[0]['title'], '节点1')
        self.assertEqual(nodes[1]['order'], 1)

    def test_parse_json_with_markdown(self):
        """测试带 Markdown 代码块包裹的 JSON (AI 常见输出)"""
        raw_text = (
            "没问题，这是为你定制的学习计划：\n"
            "```json\n"
            "[\n"
            '    {"title": "第一章", "content": "入门"}\n'
            "]\n"
            "```\n"
            "祝你学习顺利！"
        )
        nodes, error = parse_ai_text_to_nodes(raw_text)
        
        self.assertIsNone(error)
        self.assertEqual(len(nodes), 1)
        self.assertEqual(nodes[0]['title'], '第一章')

    def test_parse_invalid_json(self):
        """测试乱码或非 JSON 文本"""
        raw_text = "抱歉，我无法理解你的问题。"
        nodes, error = parse_ai_text_to_nodes(raw_text)
        
        self.assertIsNone(nodes)
        self.assertIsNotNone(error)
        self.assertIn("解析失败", error)

    def test_parse_missing_keys(self):
        """测试 AI 偷懒少输出了 key (比如只有 title 没有 content)"""
        raw_text = '[{"title": "只有标题"}]'
        nodes, error = parse_ai_text_to_nodes(raw_text)
        
        self.assertIsNone(error)
        self.assertEqual(nodes[0]['title'], '只有标题')
        self.assertEqual(nodes[0]['content'], '')


class TestLearningGoalAPI(TestCase):
    """测试 API 接口"""

    def setUp(self):
        # 每次运行测试前，准备测试数据
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.goal = LearningGoal.objects.create(user=self.user, title="测试目标")
        
        # 强制登录该用户
        self.client.force_authenticate(user=self.user)

    def test_get_prompt(self):
        """测试获取 AI 提示词接口"""
        url = reverse('goals-get-prompt', kwargs={'pk': self.goal.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("测试目标", response.data['prompt'])

    def test_parse_nodes_api_success(self):
        """测试粘贴文本并成功解析创建节点"""
        url = reverse('goals-parse-nodes', kwargs={'pk': self.goal.id})
        payload = {
            "raw_text": '[{"title": "API节点1", "content": "API内容1"}]'
        }
        response = self.client.post(url, payload, format='json')
        
        # 断言接口返回 201
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("成功解析并创建了 1 个节点", response.data['message'])
        
        # 断言数据库里确实多了一个节点
        self.assertEqual(LearningNode.objects.filter(goal=self.goal).count(), 1)
        
        # 断言目标记录了原始文本
        self.goal.refresh_from_db()
        self.assertEqual(self.goal.ai_prompt_raw_text, payload['raw_text'])

    def test_parse_nodes_api_invalid_text(self):
        """测试解析失败的 API 响应"""
        url = reverse('goals-parse-nodes', kwargs={'pk': self.goal.id})
        payload = {"raw_text": "这不是JSON"}
        response = self.client.post(url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        # 断言解析失败时，数据库里不会产生脏数据
        self.assertEqual(LearningNode.objects.count(), 0)

    def test_unauthorized_access(self):
        """测试未登录用户无法访问接口"""
        self.client.force_authenticate(user=None)
        url = reverse('goals-parse-nodes', kwargs={'pk': self.goal.id})
        response = self.client.post(url, {"raw_text": "[]"}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)