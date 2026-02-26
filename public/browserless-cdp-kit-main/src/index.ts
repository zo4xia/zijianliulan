import WebSocket from "ws";

export type ScreencastFrame = {
  data: string;
  metadata: {
    deviceWidth?: number;
    deviceHeight?: number;
    pageScaleFactor?: number;
    offsetTop?: number;
    offsetLeft?: number;
    scrollOffsetX?: number;
    scrollOffsetY?: number;
    timestamp?: number;
  };
};

export type HarEntry = {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: { name: string; value: string }[];
    queryString: { name: string; value: string }[];
    cookies: { name: string; value: string }[];
    headersSize: number;
    bodySize: number;
    postData?: { mimeType: string; text: string };
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: { name: string; value: string }[];
    cookies: { name: string; value: string }[];
    content: { size: number; mimeType: string; text?: string };
    redirectURL: string;
    headersSize: number;
    bodySize: number;
  };
  cache: {};
  timings: { send: number; wait: number; receive: number };
};

export type HarLog = {
  log: {
    version: string;
    creator: { name: string; version: string };
    pages: {
      startedDateTime: string;
      id: string;
      title: string;
      pageTimings: { onContentLoad: number; onLoad: number };
    }[];
    entries: HarEntry[];
  };
};

export type BrowserlessConfig = {
  baseUrl: string; // e.g. https://your-browserless.domain
  token: string;
};

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

class CdpConnection {
  private ws: WebSocket;
  private nextId = 1;
  private inflight = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();
  private handlers = new Map<string, Set<(params: any, sessionId?: string) => void>>();

  constructor(ws: WebSocket) {
    this.ws = ws;
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.id && this.inflight.has(message.id)) {
          const entry = this.inflight.get(message.id)!;
          this.inflight.delete(message.id);
          if (message.error) entry.reject(new Error(message.error.message || "CDP error"));
          else entry.resolve(message.result);
          return;
        }
        if (message.method) {
          const handlers = this.handlers.get(message.method);
          if (!handlers) return;
          handlers.forEach((fn) => fn(message.params, message.sessionId));
        }
      } catch {
        // Ignore bad frames.
      }
    });
  }

  send(method: string, params?: Record<string, unknown>, sessionId?: string) {
    const id = this.nextId++;
    const payload: Record<string, unknown> = { id, method };
    if (params) payload.params = params;
    if (sessionId) payload.sessionId = sessionId;
    const promise = new Promise<any>((resolve, reject) => {
      this.inflight.set(id, { resolve, reject });
    });
    this.ws.send(JSON.stringify(payload));
    return promise;
  }

  on(method: string, handler: (params: any, sessionId?: string) => void) {
    if (!this.handlers.has(method)) this.handlers.set(method, new Set());
    this.handlers.get(method)!.add(handler);
    return () => {
      this.handlers.get(method)!.delete(handler);
    };
  }

  close() {
    return new Promise<void>((resolve) => {
      if (this.ws.readyState === WebSocket.CLOSED) {
        resolve();
        return;
      }
      this.ws.once("close", () => resolve());
      this.ws.close(1000);
    });
  }
}

class HarRecorder {
  private requests = new Map<string, any>();
  private entries: HarEntry[] = [];

  onRequestWillBeSent(params: any) {
    const { requestId, request, wallTime, timestamp } = params;
    this.requests.set(requestId, {
      requestId,
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers || {},
        postData: request.postData,
      },
      wallTime,
      timestamp,
    });
  }

  onResponseReceived(params: any) {
    const entry = this.requests.get(params.requestId);
    if (!entry) return;
    entry.response = {
      status: params.response.status,
      statusText: params.response.statusText,
      headers: params.response.headers || {},
      mimeType: params.response.mimeType,
      protocol: params.response.protocol,
    };
  }

  onLoadingFinished(params: any) {
    const entry = this.requests.get(params.requestId);
    if (!entry) return;
    entry.encodedDataLength = params.encodedDataLength;
    entry.finishTimestamp = params.timestamp;
    this.requests.delete(params.requestId);
    this.entries.push(this.toHarEntry(entry));
  }

  onLoadingFailed(params: any) {
    const entry = this.requests.get(params.requestId);
    if (!entry) return;
    entry.finishTimestamp = params.timestamp;
    this.requests.delete(params.requestId);
    this.entries.push(this.toHarEntry(entry));
  }

  getEntries() {
    return this.entries;
  }

  private toHarEntry(entry: any): HarEntry {
    const startedDateTime = new Date(entry.wallTime * 1000).toISOString();
    const postData = entry.request.postData;
    const response = entry.response;
    const encodedLength = entry.encodedDataLength ?? 0;
    const mimeType = response?.mimeType ?? "";
    const protocol = response?.protocol ?? "HTTP/1.1";
    const totalTimeMs = entry.finishTimestamp
      ? Math.max(0, Math.round((entry.finishTimestamp - entry.timestamp) * 1000))
      : 0;

    const parseQueryString = (url: string) => {
      try {
        const parsed = new URL(url);
        return Array.from(parsed.searchParams.entries()).map(([name, value]) => ({ name, value }));
      } catch {
        return [];
      }
    };

    const headersToPairs = (headers: Record<string, string>) =>
      Object.entries(headers).map(([name, value]) => ({ name, value: String(value) }));

    return {
      startedDateTime,
      time: totalTimeMs,
      request: {
        method: entry.request.method,
        url: entry.request.url,
        httpVersion: protocol,
        headers: headersToPairs(entry.request.headers),
        queryString: parseQueryString(entry.request.url),
        cookies: [],
        headersSize: -1,
        bodySize: postData?.length || 0,
        postData: postData ? { mimeType: "application/json", text: postData } : undefined,
      },
      response: {
        status: response?.status ?? 0,
        statusText: response?.statusText ?? "",
        httpVersion: protocol,
        headers: headersToPairs(response?.headers || {}),
        cookies: [],
        content: { size: encodedLength, mimeType },
        redirectURL: "",
        headersSize: -1,
        bodySize: encodedLength,
      },
      cache: {},
      timings: { send: 0, wait: 0, receive: 0 },
    };
  }
}

function buildWebSocketUrl(baseUrl: string, token: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  const url = new URL(`${trimmed}/chromium`);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("token", token);
  return url.toString();
}

async function connect(config: BrowserlessConfig) {
  const wsUrl = buildWebSocketUrl(config.baseUrl, config.token);
  const ws = await new Promise<WebSocket>((resolve, reject) => {
    const socket = new WebSocket(wsUrl, { perMessageDeflate: false, handshakeTimeout: 30000 });
    socket.once("open", () => resolve(socket));
    socket.once("error", (err) => reject(err));
  });
  return new CdpConnection(ws);
}

/**
 * 应用反检测增强脚本
 * 夏夏的技术靠山注：这是我们的核心安全防线，必须完整!
 */
async function applyStealth(page: { send: (method: string, params?: Record<string, unknown>) => Promise<any> }) {
  console.log('[Browserless] 🛡️ 开始应用 stealth 增强...');
  
  try {
    // 1. 设置 User Agent
    await page.send("Emulation.setUserAgentOverride", {
      userAgent: DEFAULT_USER_AGENT,
      acceptLanguage: "zh-CN,zh;q=0.9,en;q=0.8",
      platform: "Win32",
    });
    console.log('[Browserless] ✅ User Agent 已设置');
    
    // 2. 设置额外的 HTTP 头
    await page.send("Network.setExtraHTTPHeaders", {
      headers: { 
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
      },
    });
    console.log('[Browserless] ✅ HTTP Headers 已设置');
    
    // 3. 注入反检测脚本 - 核心防护
    const stealthScript = `
      (function() {
        // 移除 WebDriver 特征
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
          configurable: true
        });
        
        // 修复 language 属性
        Object.defineProperty(navigator, 'language', {
          get: () => 'zh-CN',
          configurable: true
        });
        
        // 修复 languages 数组
        Object.defineProperty(navigator, 'languages', {
          get: () => ['zh-CN', 'zh', 'en'],
          configurable: true
        });
        
        // 修复 plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
          configurable: true
        });
        
        // 修复 mimeTypes
        Object.defineProperty(navigator, 'mimeTypes', {
          get: () => [],
          configurable: true
        });
        
        // 修复 hardwareConcurrency
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => 8,
          configurable: true
        });
        
        // 修复 deviceMemory
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => 8,
          configurable: true
        });
        
        // 修复 permissions
        const originalQuery = window.Permissions && window.Permissions.prototype.query;
        if (originalQuery) {
          window.Permissions.prototype.query = async function(permission) {
            if (permission.name === 'notifications') {
              return Object.assign(this, { state: 'denied' });
            }
            return originalQuery.apply(this, arguments);
          };
        }
        
        // 防止 Headless Chrome 检测
        if (navigator.plugins.length === 0) {
          Object.defineProperty(navigator.plugins, 'length', { value: 5 });
        }
        
        console.log('🛡️ Stealth script executed successfully');
      })();
    `;
    
    await page.send("Page.addScriptToEvaluateOnNewDocument", {
      source: stealthScript,
    });
    console.log('[Browserless] ✅ 反检测脚本已注入');
    
    // 4. WebRTC 防护 (防止 IP 泄漏)
    const webrtcProtection = `
      (function() {
        const origGetUserMedia = navigator.mediaDevices?.getUserMedia;
        if (origGetUserMedia) {
          navigator.mediaDevices.getUserMedia = async function(constraints) {
            throw new Error('WebRTC disabled for privacy');
          };
        }
        console.log('🔒 WebRTC protection enabled');
      })();
    `;
    
    await page.send("Page.addScriptToEvaluateOnNewDocument", {
      source: webrtcProtection,
    });
    console.log('[Browserless] ✅ WebRTC 防护已启用');
    
    console.log('[Browserless] 🎉 Stealth 增强完成!');
    
  } catch (error) {
    console.error('[Browserless] ❌ Stealth 增强失败:', error);
    throw error; // 不再静默吞掉错误!
  }
}

export class BrowserlessSession {
  private browser: CdpConnection;
  private page: { send: (method: string, params?: Record<string, unknown>) => Promise<any>; on: (method: string, handler: (params: any) => void) => void };
  private targetId: string;
  private recorder = new HarRecorder();
  private inflight = { value: 0 };
  private frameInterval: ReturnType<typeof setInterval> | null = null;
  private hasFrame = false;

  private constructor(browser: CdpConnection, page: any, targetId: string) {
    this.browser = browser;
    this.page = page;
    this.targetId = targetId;
  }

  static async connect(config: BrowserlessConfig) {
    const browser = await connect(config);
    const created = await browser.send("Target.createTarget", { url: "about:blank" });
    const targetId = created.targetId as string;
    const attached = await browser.send("Target.attachToTarget", { targetId, flatten: true });
    const sessionId = attached.sessionId as string;
    const page = {
      send: (method: string, params?: Record<string, unknown>) => browser.send(method, params, sessionId),
      on: (method: string, handler: (params: any) => void) =>
        browser.on(method, (params: any, incomingSessionId?: string) => {
          if (incomingSessionId && incomingSessionId !== sessionId) return;
          handler(params);
        }),
    };
    return new BrowserlessSession(browser, page, targetId);
  }

  async enableDomains() {
    await this.page.send("Network.enable");
    await this.page.send("Page.enable");
    await this.page.send("Runtime.enable");
    await this.page.send("Input.enable").catch(() => {});
    await applyStealth(this.page);
  }

  async navigate(url: string) {
    await this.page.send("Page.navigate", { url });
  }

  async goBack() {
    const history = await this.page.send("Page.getNavigationHistory");
    const currentIndex = history.currentIndex ?? 0;
    if (currentIndex > 0) {
      const entry = history.entries[currentIndex - 1];
      if (entry?.id !== undefined) {
        await this.page.send("Page.navigateToHistoryEntry", { entryId: entry.id });
      }
    }
  }

  async goForward() {
    const history = await this.page.send("Page.getNavigationHistory");
    const currentIndex = history.currentIndex ?? 0;
    if (currentIndex < history.entries.length - 1) {
      const entry = history.entries[currentIndex + 1];
      if (entry?.id !== undefined) {
        await this.page.send("Page.navigateToHistoryEntry", { entryId: entry.id });
      }
    }
  }

  async reload() {
    await this.page.send("Page.reload");
  }

  startHarRecording() {
    this.page.on("Network.requestWillBeSent", (params: any) => {
      this.inflight.value += 1;
      this.recorder.onRequestWillBeSent(params);
    });
    this.page.on("Network.responseReceived", (params: any) => this.recorder.onResponseReceived(params));
    this.page.on("Network.loadingFinished", (params: any) => {
      this.inflight.value = Math.max(0, this.inflight.value - 1);
      this.recorder.onLoadingFinished(params);
    });
    this.page.on("Network.loadingFailed", (params: any) => {
      this.inflight.value = Math.max(0, this.inflight.value - 1);
      this.recorder.onLoadingFailed(params);
    });
  }

  getHar(title: string): HarLog {
    return {
      log: {
        version: "1.2",
        creator: { name: "browserless-cdp-kit", version: "0.1.0" },
        pages: [
          {
            startedDateTime: new Date().toISOString(),
            id: "page_1",
            title,
            pageTimings: { onContentLoad: -1, onLoad: -1 },
          },
        ],
        entries: this.recorder.getEntries(),
      },
    };
  }

  startStreaming(handler: (frame: ScreencastFrame) => void, onNavigate?: (url: string) => void) {
    this.page.on("Page.screencastFrame", (params: any) => {
      this.hasFrame = true;
      handler({ data: params.data, metadata: params.metadata || {} });
      this.page.send("Page.screencastFrameAck", { sessionId: params.sessionId });
    });
    this.page.on("Page.frameNavigated", (params: any) => {
      if (!params?.frame?.parentId && params?.frame?.url) onNavigate?.(params.frame.url);
    });

    const startFallback = () => {
      if (this.frameInterval) return;
      this.frameInterval = setInterval(async () => {
        if (this.hasFrame) return;
        try {
          const result = await this.page.send("Page.captureScreenshot", { format: "jpeg", quality: 70 });
          if (result?.data) handler({ data: result.data, metadata: {} });
        } catch {
          // Ignore.
        }
      }, 1200);
    };

    setTimeout(() => {
      if (!this.hasFrame) startFallback();
    }, 2500);
  }

  async dispatchMouse(event: { type: "mouseMoved" | "mousePressed" | "mouseReleased"; x: number; y: number; button?: "left" | "middle" | "right"; clickCount?: number; modifiers?: number }) {
    await this.page.send("Input.dispatchMouseEvent", {
      type: event.type,
      x: event.x,
      y: event.y,
      button: event.button || "left",
      clickCount: event.clickCount || 1,
      modifiers: event.modifiers || 0,
    });
  }

  async dispatchWheel(event: { x: number; y: number; deltaX: number; deltaY: number; modifiers?: number }) {
    await this.page.send("Input.dispatchMouseEvent", {
      type: "mouseWheel",
      x: event.x,
      y: event.y,
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      modifiers: event.modifiers || 0,
    });
  }

  async dispatchKey(event: { type: "keyDown" | "keyUp"; key: string; code: string; keyCode: number; modifiers?: number }) {
    await this.page.send("Input.dispatchKeyEvent", {
      type: event.type,
      key: event.key,
      code: event.code,
      windowsVirtualKeyCode: event.keyCode,
      nativeVirtualKeyCode: event.keyCode,
      modifiers: event.modifiers || 0,
    });
  }

  async insertText(text: string) {
    await this.page.send("Input.insertText", { text });
  }

  async sendCDP(method: string, params?: Record<string, unknown>) {
    return this.page.send(method, params);
  }

  async close() {
    if (this.frameInterval) clearInterval(this.frameInterval);
    await this.browser.send("Target.closeTarget", { targetId: this.targetId }).catch(() => {});
    await this.browser.close();
  }
}
