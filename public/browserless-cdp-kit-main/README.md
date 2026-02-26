# browserless-cdp-kit

Minimal **CDP-only** toolkit for Browserless. No Puppeteer. No Playwright. Just raw CDP over WebSocket.

## Features
- Connect to Browserless via WebSocket
- Stream live frames (screencast + screenshot fallback)
- Record network into a HAR
- Send mouse/keyboard/wheel input
- Navigate / back / forward / reload
- Run custom CDP commands

## Install

```bash
pnpm add browserless-cdp-kit
# or
npm i browserless-cdp-kit
```

## Usage (server side)

```ts
import { BrowserlessSession } from "browserless-cdp-kit";

const session = await BrowserlessSession.connect({
  baseUrl: "https://your-browserless.domain",
  token: "your-token",
});

await session.enableDomains();
session.startHarRecording();
await session.navigate("https://example.com");

session.startStreaming((frame) => {
  // frame.data is base64 JPEG
}, (url) => {
  // navigation updates
});

// send input
await session.dispatchMouse({ type: "mouseMoved", x: 120, y: 240 });
await session.dispatchWheel({ x: 120, y: 240, deltaX: 0, deltaY: 120 });
await session.dispatchKey({ type: "keyDown", key: "Enter", code: "Enter", keyCode: 13 });
await session.insertText("hello");

const har = session.getHar("example.com");
await session.close();
```

## Frontend display

Frames are base64 JPEGs. Render them in any client:

```html
<img id="frame" />
<script>
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "frame") {
      document.getElementById("frame").src = `data:image/jpeg;base64,${msg.frame.data}`;
    }
  };
</script>
```

A tiny demo client is included in `examples/client`:

```bash
# Start server
BROWSERLESS_URL="https://your-browserless.domain" \
BROWSERLESS_TOKEN="your-token" \
node --loader ts-node/esm examples/server.ts

# Open the client
open examples/client/index.html
```

## Custom CDP commands

Run any CDP method directly:

```ts
await session.sendCDP("Network.setCacheDisabled", { cacheDisabled: true });
await session.sendCDP("Emulation.setDeviceMetricsOverride", {
  width: 1280,
  height: 720,
  deviceScaleFactor: 1,
  mobile: false,
});
```

## Example

Run a sample WS server:

```bash
BROWSERLESS_URL="https://your-browserless.domain" \
BROWSERLESS_TOKEN="your-token" \
node --loader ts-node/esm examples/server.ts
```

Then connect from any client to `ws://localhost:8787`.

## Notes
- The toolkit applies basic anti-headless settings (UA override + hides navigator.webdriver)
- Uses screencast frames with a screenshot fallback for reliability

## License

MIT
# browserless-cdp-kit
