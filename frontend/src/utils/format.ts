import axios from 'axios';
import type { GoalStatus, NodeStatus } from '../api/types';

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  active: '进行中',
  completed: '已完成',
  archived: '已归档',
};

export const NODE_STATUS_LABEL: Record<NodeStatus, string> = {
  todo: '未开始',
  in_progress: '进行中',
  done: '已完成',
};

/** 点击进度按钮时的状态流转 */
export function nextNodeStatus(status: NodeStatus): NodeStatus {
  if (status === 'todo') return 'in_progress';
  if (status === 'in_progress') return 'done';
  return 'todo';
}

/** 今天的日期，格式 YYYY-MM-DD（用于 <input type="date">） */
export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** 只取日期部分，兼容 "2026-11-21" 和 ISO 时间戳 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return value.length >= 10 ? value.slice(0, 10) : value;
}

/** 分钟数转成 "1 小时 30 分钟" */
export function formatMinutes(total: number): string {
  if (!total) return '0 分钟';
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (!hours) return `${minutes} 分钟`;
  if (!minutes) return `${hours} 小时`;
  return `${hours} 小时 ${minutes} 分钟`;
}

/** 把 axios / DRF 的错误揉成一句人话 */
export function apiErrorMessage(error: unknown, fallback = '操作失败，请稍后重试'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return '无法连接后端服务，请确认 Django 已启动（http://127.0.0.1:8000）';
    }

    const { status, data } = error.response;

    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      if (typeof record.detail === 'string') return record.detail;
      if (typeof record.error === 'string') return record.error;
      if (Array.isArray(record.non_field_errors) && typeof record.non_field_errors[0] === 'string') {
        return record.non_field_errors[0];
      }
      for (const [field, value] of Object.entries(record)) {
        if (Array.isArray(value) && typeof value[0] === 'string') {
          return `${field}：${value[0]}`;
        }
        if (typeof value === 'string') {
          return `${field}：${value}`;
        }
      }
    }

    if (status === 401) return '登录已过期，请重新登录';
    if (status === 403) return '没有权限执行该操作';
    if (status === 404) return '数据不存在，可能已被删除';
    return `请求失败（HTTP ${status}）`;
  }

  if (error instanceof Error) return error.message;
  return fallback;
}

/** 复制文本，非安全上下文时退化为手动选中 */
export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', 'readonly');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(area);

  if (!copied) {
    throw new Error('浏览器不允许自动复制，请手动选中文本复制');
  }
}
