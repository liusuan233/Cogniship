# src/learning/services.py
import json
import re

def parse_ai_text_to_nodes(raw_text):
    """
    将 AI 返回的文本解析为学习节点列表。
    预期 AI 返回格式：标准的 JSON 数组，如 [{"title": "...", "content": "..."}]
    """
    # 1. 清洗数据：AI 经常喜欢把 JSON 包在 ```json ... ``` 里面
    # 使用正则提取最外层的 [] 或 {}
    match = re.search(r'\[.*\]', raw_text, re.DOTALL)
    if match:
        clean_text = match.group(0)
    else:
        # 如果没找到方括号，可能用户直接贴了纯 JSON 或者格式完全乱了
        clean_text = raw_text.strip()

    try:
        # 2. 尝试解析 JSON
        data = json.loads(clean_text)
        
        # 确保解析出来的是一个列表
        if not isinstance(data, list):
            raise ValueError("解析结果不是一个列表")
            
        nodes = []
        for index, item in enumerate(data):
            # 兼容处理：防止 AI 没有按规范输出键名
            title = item.get("title") or item.get("name") or item.get("节点") or f"未命名节点 {index+1}"
            content = item.get("content") or item.get("description") or item.get("内容") or ""
            
            nodes.append({
                "title": title.strip(),
                "content": content.strip(),
                "order": index
            })
        return nodes, None
        
    except json.JSONDecodeError:
        return None, "解析失败：请确保您粘贴的文本是标准的 JSON 格式。"
    except Exception as e:
        return None, f"解析异常：{str(e)}"


# 提供给前端复制给 AI 的提示词模板
AI_PROMPT_TEMPLATE = """
你是一个专业的学习规划师。请帮我将以下学习目标拆解为具体的学习节点。

【学习目标】：{goal_title}

【输出要求】：
1. 必须严格输出一个 JSON 数组格式，不要输出任何其他多余的解释文字。
2. 数组中的每一个对象代表一个学习节点，包含 "title"（节点标题，简短）和 "content"（学习要求或详细内容）。
3. 按照学习的先后顺序排列。

【输出示例】：
[
  {{"title": "第一章：基础语法", "content": "掌握变量、循环和函数的使用。"}},
  {{"title": "第二章：面向对象", "content": "理解类、对象、继承和多态的概念。"}}
]
"""