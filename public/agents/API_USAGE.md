# Agent API 使用指南

## 🚀 快速开始

### 1. 获取你的 API Key

每个 Agent 房间文件夹的名称就是 API Key:

```
public/agents/agent-a-collector-kwjdiedhd/
                              ↑
API Key = agent-a-collector-kwjdiedhd
```

### 2. 调用 API

```bash
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Authorization: Bearer agent-a-collector-kwjdiedhd" \
  -H "Content-Type: application/json" \
  -d '{"message":"你好"}'
```

## 📋 完整使用方式

### 方式 1: 使用 API Key (推荐) ✅

```javascript
// JavaScript fetch
const response = await fetch('http://localhost:3000/api/agent/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer agent-a-collector-kwjdiedhd',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: '帮我分析一下这篇文章'
  })
});

const result = await response.json();
console.log(result.data.reply);
```

### 方式 2: Python

```python
import requests

API_KEY = 'agent-a-collector-kwjdiedhd'

response = requests.post(
    'http://localhost:3000/api/agent/chat',
    headers={
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    },
    json={'message': '你好'}
)

print(response.json()['data']['reply'])
```

## 🏠 查看所有 Agent

```bash
curl http://localhost:3000/api/agents
```

返回:
```json
{
  "success": true,
  "data": {
    "total": 3,
    "agents": [
      {
        "id": "agent-a-collector",
        "name": "小采",
        "role": "collector",
        "emoji": "📰",
        "status": "active"
      },
      {
        "id": "agent-b-messenger",
        "name": "小信",
        "role": "messenger",
        "emoji": "🕊️",
        "status": "active"
      }
    ]
  }
}
```

## 🆕 创建新 Agent

```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "agent-template-base",
    "newAgentId": "agent-d-gemini-abc123",
    "customConfig": {
      "agent": {
        "name": "Gemini 守护者",
        "emoji": "💎"
      },
      "api": {
        "provider": "gemini"
      }
    }
  }'
```

## 🔐 API Key 格式

```
格式：agent-{角色}-{随机前缀}

示例:
- agent-a-collector-kwjdiedhd
- agent-b-messenger-abc123def
- agent-c-social-xyz789

优点:
✅ 一眼识别 (看到前缀就知道是谁)
✅ 不会混淆 (每个 Agent 独立)
✅ 方便管理 (按文件夹分类)
```

## 📦 MCP 扩展

每个 Agent 可以有自己的 MCP 工具集:

```json
{
  "equipment": {
    "mcpServers": [
      {
        "name": "feishu-mcp",
        "type": "sse",
        "url": "https://...",
        "tools": ["send-message"]
      }
    ]
  }
}
```

## 🆘 Webhook 通知

在配置文件中设置:

```json
{
  "task": {
    "webhook": {
      "onNeedHelp": {
        "enabled": true,
        "url": "https://your-server.com/webhook",
        "includeScreenshot": true
      }
    }
  }
}
```

## 💡 常见场景

### 场景 1: 询问 Gemini

```bash
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Authorization: Bearer agent-a-collector-kwjdiedhd" \
  -d '{"message":"今天有什么 AI 新闻？"}'
```

### 场景 2: 采集信息

```bash
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Authorization: Bearer agent-a-collector-kwjdiedhd" \
  -d '{
    "message": "请访问 https://techcrunch.com 并提取最新新闻"
  }'
```

### 场景 3: 发布内容

```bash
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Authorization: Bearer agent-c-social-xyz789" \
  -d '{
    "message": "帮我把这条内容发到 X 站：今天天气真好！"
  }'
```

## 🌟 更多示例

查看 `src/lib/agent-api-examples.ts` 获取完整代码示例。
