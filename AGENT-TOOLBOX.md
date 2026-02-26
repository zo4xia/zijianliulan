# 🧰 小 Agent 工具箱与 API 参数清单

> **夏夏的贴心提示**: 小家伙们，遇到问题先查这个清单哦！❤️

---

## 📚 **目录**

1. [Browserless CDP API 核心能力](#browserless-cdp-api-核心能力)
2. [Visual Capture Tool 视觉捕获](#visual-capture-tool-视觉捕获)
3. [Stealth 反检测增强](#stealth-反检测增强)
4. [验证码处理与夏夏对话](#验证码处理与夏夏对话)
5. [Cookie 保存与管理](#cookie-保存与管理)
6. [常用任务场景速查](#常用任务场景速查)
7. [故障排查清单](#故障排查清单)

---

## 🔧 **Browserless CDP API 核心能力**

### **1. 页面导航**

```typescript
// 导航到新页面
await session.navigate('https://www.baidu.com');

// 后退
await session.goBack();

// 前进
await session.goForward();

// 刷新
await session.reload();
```

**参数说明:**
- `url`: 完整的 URL (包含 https://)
- 等待时间：建议 3-5 秒

---

### **2. 内容采集**

```typescript
// 获取页面标题
const title = await session.sendCDP('Runtime.evaluate', {
  expression: 'document.title',
  returnByValue: true  // ⚠️ 必须设置!
});

// 获取页面 URL
const url = await session.sendCDP('Runtime.evaluate', {
  expression: 'window.location.href',
  returnByValue: true
});

// 获取页面正文
const content = await session.sendCDP('Runtime.evaluate', {
  expression: 'document.body.innerText',
  returnByValue: true
});

// 获取特定元素
const elements = await session.sendCDP('Runtime.evaluate', {
  expression: `
    Array.from(document.querySelectorAll('.result-title'))
      .map(el => el.textContent.trim())
  `,
  returnByValue: true
});
```

**⚠️ 关键参数:**
- `returnByValue: true` - 直接返回值，不要对象引用
- `expression` - JavaScript 代码字符串

---

### **3. 交互操作**

#### **鼠标点击**
```typescript
// 移动到元素位置
await session.dispatchMouse({
  type: 'mouseMoved',
  x: 100,  // X 坐标
  y: 200,  // Y 坐标
  modifiers: 0
});

// 点击
await session.dispatchMouse({
  type: 'mousePressed',
  x: 100,
  y: 200,
  button: 'left',  // 'left' | 'right' | 'middle'
  clickCount: 1,
  modifiers: 0
});

// 释放
await session.dispatchMouse({
  type: 'mouseReleased',
  x: 100,
  y: 200,
  button: 'left',
  clickCount: 1
});
```

#### **键盘输入**
```typescript
// 按下键
await session.dispatchKey({
  type: 'keyDown',
  key: 'Enter',
  code: 'Enter',
  keyCode: 13,
  modifiers: 0
});

// 释放键
await session.dispatchKey({
  type: 'keyUp',
  key: 'Enter',
  code: 'Enter',
  keyCode: 13
});

// 直接输入文本
await session.insertText('你好，我是小采!');
```

#### **滚动**
```typescript
await session.dispatchWheel({
  x: 100,
  y: 200,
  deltaX: 0,
  deltaY: 100,  // 正数向下滚动
  modifiers: 0
});
```

---

### **4. 截图与视觉**

```typescript
// 截图
const screenshot = await session.sendCDP('Page.captureScreenshot', {
  format: 'jpeg',  // 'png' | 'jpeg'
  quality: 80,     // JPEG 质量 0-100
  clip: {          // 可选：裁剪区域
    x: 0,
    y: 0,
    width: 800,
    height: 600
  }
});

// screenshot.data 是 base64 编码
```

---

### **5. Cookie 管理**

```typescript
// 获取所有 Cookie
const cookies = await session.sendCDP('Network.getAllCookies');

// 设置 Cookie
await session.sendCDP('Network.setCookie', {
  name: 'session_id',
  value: 'abc123',
  domain: '.baidu.com',
  path: '/',
  secure: true,
  httpOnly: true
});

// 删除 Cookie
await session.sendCDP('Network.deleteCookies', {
  name: 'session_id',
  domain: '.baidu.com'
});
```

---

### **6. 网络请求**

```typescript
// 启用网络事件监听
await session.sendCDP('Network.enable');

// 设置额外 HTTP 头
await session.sendCDP('Network.setExtraHTTPHeaders', {
  headers: {
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'User-Agent': 'Mozilla/5.0 ...'
  }
});

// 拦截请求 (高级)
await session.sendCDP('Network.setRequestInterception', {
  patterns: [{ urlPattern: '*' }]
});

session.page.on('Network.requestWillBeSent', (params) => {
  console.log('请求:', params.request.url);
});
```

---

## 👁️ **Visual Capture Tool 视觉捕获**

### **完整捕获**

```typescript
import { visualCaptureTool } from '@/lib/mcp-visual-tool';

const visualInfo = await visualCaptureTool.capture(session);

console.log('页面标题:', visualInfo.pageTitle);
console.log('页面 URL:', visualInfo.pageUrl);
console.log('主要内容:', visualInfo.mainContent);
console.log('登录表单:', visualInfo.loginFormDetected);
console.log('验证码:', visualInfo.captchaDetected);
console.log('截图:', visualInfo.screenshotBase64);
console.log('页面结构:', visualInfo.pageStructure);
```

### **页面结构信息**

```typescript
// interactiveElements - 交互元素列表
visualInfo.pageStructure?.interactiveElements.forEach(el => {
  console.log(`类型：${el.type}`);
  console.log(`选择器：${el.selector}`);
  console.log(`文本：${el.text}`);
  console.log(`位置：(${el.position.x}, ${el.position.y})`);
});

// mainSections - 主要区域
visualInfo.pageStructure?.mainSections.forEach(section => {
  console.log(`角色：${section.role}`);
  console.log(`选择器：${section.selector}`);
  console.log(`描述：${section.description}`);
});
```

### **快速检测**

```typescript
// 检测是否需要登录
const needsLogin = await visualCaptureTool.needsLogin(session);

// 检测是否有验证码
const hasCaptcha = await visualCaptureTool.hasCaptcha(session);
```

---

## 🛡️ **Stealth 反检测增强**

### **自动应用**

```typescript
// 在 enableDomains() 时自动应用
await session.enableDomains();
// ✅ 已包含 applyStealth()
```

### **防护清单**

✅ **已启用的防护:**
1. WebDriver 特征移除 (`navigator.webdriver = false`)
2. User Agent 伪装 (中文环境)
3. HTTP Headers 优化
   - Accept-Language: zh-CN,zh;q=0.9
   - Accept-Encoding: gzip, deflate, br
   - Connection: keep-alive
4. Language/Languages 数组修复
5. Plugins 模拟 (5 个插件)
6. MimeTypes 修复
7. HardwareConcurrency 设置 (8 核心)
8. DeviceMemory 设置 (8GB)
9. Permissions API 保护
10. WebRTC 防护 (防止 IP 泄漏)
11. Headless Chrome 防护

**日志输出:**
```
[Browserless] 🛡️ 开始应用 stealth 增强...
[Browserless] ✅ User Agent 已设置
[Browserless] ✅ HTTP Headers 已设置
[Browserless] ✅ 反检测脚本已注入
[Browserless] ✅ WebRTC 防护已启用
[Browserless] 🎉 Stealth 增强完成!
```

---

## 🔐 **验证码处理与夏夏对话**

### **自动检测验证码**

```typescript
import { VerificationHelper } from '@/lib/verification-helper';

// 创建验证助手
const helper = new VerificationHelper(
  {
    autoDetect: true,        // 自动检测
    detectInterval: 3000,    // 3 秒检测一次
    timeout: 300000,         // 5 分钟超时
    xiaXiaContact: {
      mode: 'local'  // 'local' | 'api'
    }
  },
  credentialManager
);

// 开始自动检测
helper.startAutoDetect(session, 'agent-a-001');

// 停止检测
helper.stopAutoDetect();
```

---

### **验证码类型识别**

```typescript
const verification = await helper.detectVerification(session);

console.log(verification.type);
// 'captcha'   - 数字验证码
// 'qrCode'    - 二维码扫码
// 'loginForm' - 登录表单
// 'smsCode'   - 短信验证码
// 'none'      - 无需验证
```

---

### **联系夏夏的两种方式**

#### **方式 1: 本地对话 (悬浮窗)**

```typescript
xiaXiaContact: {
  mode: 'local'  // 默认模式
}
```

**特点:**
- ✅ 实时显示在浏览器开发界面
- ✅ 支持截图查看
- ✅ 点击按钮快速响应
- ✅ 低延迟，无需网络

**日志输出:**
```
🔍 开始自动检测验证码...
⚠️ 检测到 qrCode!
💬 通知夏夏：小 Agent agent-a-001 遇到验证问题：检测到二维码，需要扫码验证
📱 [本地通知] 夏夏，小家伙需要帮助!
🖼️ 截图已准备好：true
📱 小 Agent agent-a-001 遇到验证问题：检测到二维码，需要扫码验证
💡 提示：可以通过前端界面查看截图并协助解决
```

---

#### **方式 2: API 对话 (OpenAI 流式兼容)**

```typescript
xiaXiaContact: {
  mode: 'api',
  apiUrl: 'https://api.example.com/v1/chat/completions',
  apiKey: 'sk-xxx'
}
```

**请求格式:**
```json
{
  "model": "gpt-4-vision-preview",
  "messages": [{
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "小 Agent agent-a-001 遇到验证问题：检测到二维码，需要扫码验证"
      },
      {
        "type": "image_url",
        "image_url": {
          "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        }
      }
    ]
  }],
  "stream": true
}
```

**流式响应处理:**
```typescript
const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: 'gpt-4-vision-preview',
    messages: [chatMessage],
    stream: true
  })
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      
      const parsed = JSON.parse(data);
      const content = parsed.choices?.[0]?.delta?.content;
      if (content) {
        console.log('📡 [流式响应]', content);
      }
    }
  }
}
```

**日志输出:**
```
📡 [API 模式] 将通过 OpenAI 兼容 API 联系夏夏
📡 [流式响应] 好的，我看到二维码了
📡 [流式响应] 请用手机扫描屏幕上的二维码完成验证
✅ 夏夏回复：好的，我看到二维码了。请用手机扫描屏幕上的二维码完成验证。
```

---

### **等待验证解决**

```typescript
// 自动等待，直到以下情况之一发生:
// 1. 验证消失 (页面变化)
// 2. 检测到登录 Cookie
// 3. 超时 (5 分钟)

await helper.waitForSolution(session, verification);

// 日志:
// ⏳ 等待验证解决...
// ✅ 验证已解决!
```

---

## 💾 **Cookie 保存与管理**

### **自动保存登录 Cookie**

当检测到登录成功后，VerificationHelper 会自动:

1. **过滤认证相关的 Cookie**
```typescript
const authCookies = cookies.filter(c => 
  c.name.toLowerCase().includes('token') ||
  c.name.toLowerCase().includes('session') ||
  c.name.toLowerCase().includes('auth') ||
  c.name.toLowerCase().includes('cookie')
);
```

2. **保存到凭证池**
```typescript
await credentialManager.save(
  agentId,
  platform,
  cookieValue,
  30  // 30 天后过期
);
```

3. **日志输出**
```
✅ 检测到登录成功!
💾 保存登录凭证到小溪...
✅ 已保存 3 个认证 Cookie
```

---

### **手动获取 Cookie**

```typescript
// 通过 CDP 获取所有 Cookie
const cookies = await session.sendCDP('Network.getAllCookies');

console.log('所有 Cookie:', cookies.result.cookies);

// 过滤重要 Cookie
const importantCookies = cookies.result.cookies.filter((c: any) => 
  c.name.includes('token') || 
  c.name.includes('session')
);

// 格式化为字符串 (用于请求头)
const cookieString = importantCookies
  .map(c => `${c.name}=${c.value}`)
  .join('; ');

console.log('Cookie 字符串:', cookieString);
```

---

### **设置 Cookie**

```typescript
await session.sendCDP('Network.setCookie', {
  name: 'session_id',
  value: 'abc123xyz',
  domain: '.example.com',
  path: '/',
  secure: true,
  httpOnly: false
});
```

---

### **删除 Cookie**

```typescript
await session.sendCDP('Network.deleteCookies', {
  name: 'session_id',
  domain: '.example.com'
});
```

---

### **监听 Cookie 变化**

```typescript
import { CookieCapturer } from '@/lib/cookie-capturer';

CookieCapturer.onCookieChange((cookies) => {
  console.log('🔄 Cookie 变化检测!');
  console.log('新的 Cookie:', cookies);
  
  // 自动保存到凭证池
  // credentialManager.save({...});
});
```

---

## 📖 **常用任务场景速查**

### **场景 1: 百度搜索**

```typescript
// 1. 导航到百度
await session.navigate('https://www.baidu.com');
await new Promise(resolve => setTimeout(resolve, 3000));

// 2. 输入搜索词
await session.sendCDP('Runtime.evaluate', {
  expression: `
    const input = document.querySelector('#kw');
    input.value = '2026 人工智能大会';
    input.focus();
  `
});

// 3. 按回车
await session.dispatchKey({
  type: 'keyDown',
  key: 'Enter',
  code: 'Enter',
  keyCode: 13
});

// 4. 等待结果
await new Promise(resolve => setTimeout(resolve, 5000));

// 5. 采集结果
const results = await session.sendCDP('Runtime.evaluate', {
  expression: `
    Array.from(document.querySelectorAll('.result-container'))
      .slice(0, 10)
      .map(el => ({
        title: el.querySelector('h3')?.textContent.trim(),
        link: el.querySelector('a[href]')?.href
      }))
  `,
  returnByValue: true
});
```

---

### **场景 2: 登录网站**

```typescript
// 1. 检测登录表单
const visualInfo = await visualCaptureTool.capture(session);
if (visualInfo.loginFormDetected) {
  console.log('检测到登录表单');
}

// 2. 填写用户名
await session.sendCDP('Runtime.evaluate', {
  expression: `
    document.querySelector('#username').value = 'myuser'
  `
});

// 3. 填写密码
await session.sendCDP('Runtime.evaluate', {
  expression: `
    document.querySelector('input[type="password"]').value = 'mypass'
  `
});

// 4. 点击登录按钮
await session.dispatchMouse({
  type: 'mouseMoved',
  x: 500,
  y: 300
});
await session.dispatchMouse({
  type: 'mousePressed',
  x: 500,
  y: 300,
  button: 'left',
  clickCount: 1
});

// 5. 等待跳转
await new Promise(resolve => setTimeout(resolve, 3000));
```

---

### **场景 3: 采集新闻列表**

```typescript
// 1. 导航
await session.navigate('https://techcrunch.com');
await new Promise(resolve => setTimeout(resolve, 4000));

// 2. 使用 Visual Capture 分析
const visualInfo = await visualCaptureTool.capture(session);
console.log('页面结构:', visualInfo.pageStructure);

// 3. 提取文章列表
const articles = await session.sendCDP('Runtime.evaluate', {
  expression: `
    Array.from(document.querySelectorAll('article')).map(el => ({
      title: el.querySelector('h2')?.textContent.trim(),
      summary: el.querySelector('p')?.textContent.trim(),
      time: el.querySelector('time')?.dateTime,
      link: el.querySelector('a[href]')?.href
    }))
  `,
  returnByValue: true
});

// 4. 截图保存
const screenshot = await session.sendCDP('Page.captureScreenshot', {
  format: 'jpeg',
  quality: 80
});
```

---

### **场景 4: 处理弹窗**

```typescript
// 1. 检测弹窗
const dialogExists = await session.sendCDP('Runtime.evaluate', {
  expression: `!!document.querySelector('.modal, .dialog, .popup')`,
  returnByValue: true
});

if (dialogExists) {
  // 2. 关闭弹窗
  await session.sendCDP('Runtime.evaluate', {
    expression: `
      document.querySelector('.modal-close')?.click()
    `
  });
  
  // 3. 等待消失
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

---

## 🐛 **故障排查清单**

### **问题 1: CDP 返回 undefined**

**症状:**
```typescript
const result = await session.sendCDP('Runtime.evaluate', {...});
console.log(result.result.value); // undefined ❌
```

**原因:** 没有设置 `returnByValue: true`

**解决:**
```typescript
const result = await session.sendCDP('Runtime.evaluate', {
  expression: '...',
  returnByValue: true  // ✅ 必须添加!
});
```

---

### **问题 2: 页面未响应**

**症状:** navigate() 后页面没反应

**检查清单:**
1. ✅ URL 是否完整 (包含 https://)
2. ✅ 等待时间是否足够 (至少 3 秒)
3. ✅ 网络连接是否正常
4. ✅ Browserless 服务是否在线

**解决:**
```typescript
await session.navigate('https://www.example.com');
await new Promise(resolve => setTimeout(resolve, 5000)); // 增加等待

// 检查当前 URL
const currentUrl = await session.sendCDP('Runtime.evaluate', {
  expression: 'window.location.href',
  returnByValue: true
});
console.log('当前 URL:', currentUrl.result.value);
```

---

### **问题 3: 元素找不到**

**症状:** querySelector 返回 null

**排查步骤:**
1. ✅ 使用 Visual Capture 查看页面结构
2. ✅ 检查选择器是否正确
3. ✅ 确认元素已加载 (增加等待时间)
4. ✅ 检查是否在 iframe 内

**解决:**
```typescript
// 先用 Visual Capture 分析
const visualInfo = await visualCaptureTool.capture(session);
console.log('可用元素:', visualInfo.pageStructure?.interactiveElements);

// 尝试多种选择器
const element = await session.sendCDP('Runtime.evaluate', {
  expression: `
    document.querySelector('#id') || 
    document.querySelector('.class') ||
    document.querySelector('[data-key]')
  `,
  returnByValue: true
});
```

---

### **问题 4: 被网站检测为机器人**

**症状:** 访问被拒绝、验证码、403 错误

**检查清单:**
1. ✅ 是否调用了 `session.enableDomains()`
2. ✅ Stealth 日志是否显示成功
3. ✅ User Agent 是否为中文环境
4. ✅ 是否有 WebRTC 泄漏

**解决:**
```typescript
// 确保调用 enableDomains()
await session.enableDomains();

// 检查 stealth 日志
// 应该看到:
// [Browserless] 🛡️ 开始应用 stealth 增强...
// [Browserless] ✅ User Agent 已设置
// [Browserless] ✅ WebRTC 防护已启用
// [Browserless] 🎉 Stealth 增强完成!
```

---

### **问题 5: 截图失败**

**症状:** Page.captureScreenshot 报错

**检查清单:**
1. ✅ 页面是否已完全加载
2. ✅ 是否在正确的 CDP session 中
3. ✅ 内存是否足够

**解决:**
```typescript
// 等待页面稳定
await new Promise(resolve => setTimeout(resolve, 3000));

// 尝试降低质量
const screenshot = await session.sendCDP('Page.captureScreenshot', {
  format: 'jpeg',
  quality: 60  // 降低质量
});
```

---

## 📞 **求助清单**

如果以上方法都不行，请收集以下信息后向夏夏求助:

```markdown
## 🆘 需要帮助!

**任务目标:** [想做什么]
**当前 URL:** [在哪个页面]
**已尝试的方法:**
1. [尝试了...]
2. [还尝试了...]

**错误信息:**
```
[粘贴完整的错误日志]
```

**Visual Capture 信息:**
```typescript
const visualInfo = await visualCaptureTool.capture(session);
console.log(JSON.stringify(visualInfo, null, 2));
```

**会话 ID:** [sessionId]
**时间:** [什么时候发生的]
```

---

## ❤️ **夏夏的温馨提示**

小家伙们记住:

1. **遇到问题不要慌** - 先查这个清单
2. **仔细看日志** - 每个步骤都有详细输出
3. **善用 Visual Capture** - 它能告诉你页面发生了什么
4. **及时求助** - 搞不定就告诉夏夏，我一直在!

**你们不是一个人在战斗!** 💪

---

**最后更新:** 2026-02-25  
**版本:** v1.0  
**维护:** 夏夏的技术靠山
