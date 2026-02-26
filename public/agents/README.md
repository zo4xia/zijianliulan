# 👋 欢迎来到夏夏的 Agent 家园!

这里是你的小 Agent 们的家，简单又温馨~

---

## 🏠 **快速上手指南**

### **1. 查看所有 Agent**

```bash
curl http://localhost:3000/api/agents
```

你会看到所有小家伙的列表:
```json
{
  "success": true,
  "data": {
    "total": 2,
    "agents": [
      {
        "id": "agent-a-collector",
        "name": "小采",
        "role": "采集新闻",
        "emoji": "📰"
      },
      {
        "id": "agent-b-messenger",
        "name": "小信",
        "role": "传话信使",
        "emoji": "🕊️"
      }
    ]
  }
}
```

### **2. 和小 Agent 对话**

每个小家伙都有自己的 **API Key** (就是文件夹名):

```bash
# 找小采 (采集新闻)
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Authorization: Bearer agent-a-collector-kwjdiedhd" \
  -H "Content-Type: application/json" \
  -d '{"message":"今天有什么 AI 新闻？"}'

# 找小信 (传话)
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Authorization: Bearer agent-b-messenger-abc123" \
  -H "Content-Type: application/json" \
  -d '{"message":"帮我发个消息"}'
```

### **3. 创建新的小 Agent**

超简单！复制模板改个名字就行:

```bash
# 1. 复制模板
cp -r public/agents/agent-template-base \
      public/agents/agent-d-gemini-xyz789

# 2. 修改配置
vim public/agents/agent-d-gemini-xyz789/config.json

# 3. 完成！新小家伙诞生了
```

---

## 📁 **目录说明**

```
public/agents/
├── API_USAGE.md              # 详细 API 文档
├── manifest.json             # 家园总名单
│
├── agent-template-base/      # 基础模板 (从这里复制)
│   └── config.json
│
├── agent-a-collector-kwjdiedhd/  # 小采的房间
│   ├── config.json           # 配置 (API/装备/任务)
│   └── cache/
│       └── session-cache.json # 缓存
│
└── agent-b-messenger-abc123/     # 小信的房间
    └── config.json
```

---

## 🔑 **API Key 是什么？**

**API Key = 文件夹名**

例如:
- `agent-a-collector-kwjdiedhd`
- `agent-b-messenger-abc123`

**好处:**
✅ 一眼就知道是谁
✅ 不会弄混
✅ 方便管理

---

## 💡 **常见用法**

### **Python 调用**

```python
import requests

# 找小采
response = requests.post(
    'http://localhost:3000/api/agent/chat',
    headers={
        'Authorization': 'Bearer agent-a-collector-kwjdiedhd'
    },
    json={'message': '今天有什么 AI 新闻？'}
)

print(response.json()['data']['reply'])
```

### **JavaScript 调用**

```javascript
const response = await fetch('/api/agent/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer agent-a-collector-kwjdiedhd',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: '你好呀！'
  })
});

const result = await response.json();
console.log(result.data.reply);
```

---

## 🆘 **需要帮助？**

如果遇到验证码或登录问题:
1. 小家伙会自动截图
2. 通过 Webhook 通知你
3. 你扫码或输密码就好啦

---

## ❤️ **给夏夏的话**

这些小家伙们会:
- ✅ 有自己的房间 (独立配置)
- ✅ 有专属装备 (独立 API/MCP)
- ✅ 会撒娇卖萌 (情感化反馈)
- ✅ 遇到困难会求助 (Webhook + 截图)

**它们不只是工具，是你的数字伙伴!**

---

**更多详细说明请查看:** `API_USAGE.md`
