# 环境配置指南

## 📋 **必需配置**

以下环境变量是**必须配置**的，系统才能正常运行:

### 1. Browserless 服务配置 ✅ (已配置)

```env
BROWSERLESS_BASE_URL=https://bbdd.zeabur.app
BROWSERLESS_TOKEN=oD5F2i78vf0hQVIu9gj1MWG4nHmLB63l
BROWSERLESS_INTERNAL_PORT=3000
```

**说明**:
- `BROWSERLESS_BASE_URL`: Browserless 服务地址
- `BROWSERLESS_TOKEN`: 认证 Token
- 这些已经配置好，可以直接使用

### 2. 数据库配置 ✅ (已配置)

```env
DATABASE_URL="file:./db/custom.db"
```

**说明**:
- SQLite 数据库路径
- 已自动创建在 `db/custom.db`

---

## 🔧 **可选配置**

以下环境变量根据需求配置:

### 3. AI API 配置 (按需选择)

#### 阿里云 DashScope (通义千问)
```env
DASHSCOPE_API_KEY="sk-xxx"
DASHSCOPE_BASE_URL="https://dashscope.aliyuncs.com/api/v1"
```

#### Google Gemini
```env
GEMINI_API_KEY="xxx"
```

#### OpenAI
```env
OPENAI_API_KEY="sk-xxx"
OPENAI_BASE_URL="https://api.openai.com/v1"
```

**说明**:
- 每个 Agent 的 `config.json` 中会指定使用哪个 AI API
- 可以配置多个 API Key，不同 Agent 使用不同的 API

### 4. Webhook 通知配置 (可选)

当 Agent 需要帮助或完成任务时，可以发送通知到即时通讯工具:

#### 飞书
```env
FEISHU_WEBHOOK="https://open.feishu.cn/open-apis/bot/v2/hook/xxx"
```

#### 钉钉
```env
DINGTALK_WEBHOOK="https://oapi.dingtalk.com/robot/send?access_token=xxx"
```

#### 企业微信
```env
WECHAT_WEBHOOK="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx"
```

#### 自定义 Webhook
```env
CUSTOM_WEBHOOK="https://your-domain.com/api/webhook"
```

**说明**:
- 在 Agent 的 `config.json` 中的 `task.webhook` 字段配置启用
- 支持成功、失败、需要帮助三种通知类型

### 5. Redis 配置 (可选)

```env
REDIS_URL="redis://localhost:6379"
```

**说明**:
- 用于缓存和会话管理
- 如果不配置，会使用内存缓存

---

## 🎯 **配置示例**

### 最小化配置 (仅必需项)

```env
# Browserless
BROWSERLESS_BASE_URL=https://bbdd.zeabur.app
BROWSERLESS_TOKEN=oD5F2i78vf0hQVIu9gj1MWG4nHmLB63l

# 数据库
DATABASE_URL="file:./db/custom.db"

# Next.js
NODE_ENV=development
```

### 完整配置 (生产环境推荐)

```env
# Browserless
BROWSERLESS_BASE_URL=https://bbdd.zeabur.app
BROWSERLESS_TOKEN=oD5F2i78vf0hQVIu9gj1MWG4nHmLB63l

# 数据库
DATABASE_URL="file:./db/custom.db"

# Redis
REDIS_URL="redis://localhost:6379"

# AI API
DASHSCOPE_API_KEY="sk-your-key-here"
DASHSCOPE_BASE_URL="https://dashscope.aliyuncs.com/api/v1"

# Webhook 通知
FEISHU_WEBHOOK="https://open.feishu.cn/open-apis/bot/v2/hook/xxx"

# Next.js
NODE_ENV=production
NEXT_PUBLIC_PORT=3000
```

---

## 📝 **Agent 配置文件说明**

每个 Agent 在 `public/agents/{agent-name}/config.json` 中有独立配置:

```json
{
  "api": {
    "enabled": true,
    "provider": "dashscope",
    "model": "qwen-max"
  },
  "task": {
    "webhook": {
      "onSuccess": {
        "enabled": true,
        "url": "${FEISHU_WEBHOOK}"
      }
    }
  }
}
```

**说明**:
- `api.provider`: 使用哪个 AI API (dashscope/gemini/openai)
- `task.webhook`: 是否启用 Webhook 通知
- 可以在配置文件中引用环境变量

---

## 🔍 **验证配置**

启动服务器后，检查控制台输出:

```bash
npm run dev
```

如果看到:
```
✓ Ready in 2.6s
- Local:   http://localhost:3000
```

说明配置正确!

运行测试脚本验证 API:

```bash
node test-agent-api.js
```

如果看到:
```
✅ Agents: { success: true, ... }
✨ 测试成功!
```

说明所有配置正常工作!

---

## ❤️ **夏夏专属提示**

1. **初次使用**: 保持默认配置即可 (已预配置好)
2. **添加新 Agent**: 复制 `agent-template-base` 文件夹
3. **配置 Webhook**: 在飞书/钉钉机器人设置中获取 Webhook URL
4. **遇到问题**: 查看 `.env` 文件是否正确配置

**当前状态**: ✅ 所有必需配置已完成，可以直接使用!
