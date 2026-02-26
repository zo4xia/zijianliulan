import { createServer } from "http";
import { WebSocketServer } from "ws";
import { BrowserlessSession } from "../src/index.js";

const config = {
  baseUrl: process.env.BROWSERLESS_URL || "https://your-browserless.domain",
  token: process.env.BROWSERLESS_TOKEN || "your-token",
};

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", async (ws) => {
  const session = await BrowserlessSession.connect(config);
  await session.enableDomains();
  session.startHarRecording();
  await session.navigate("https://example.com");

  session.startStreaming((frame) => {
    ws.send(JSON.stringify({ type: "frame", frame }));
  }, (url) => {
    ws.send(JSON.stringify({ type: "nav", url }));
  });

  ws.on("message", async (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === "command") {
      if (msg.command === "back") await session.goBack();
      if (msg.command === "forward") await session.goForward();
      if (msg.command === "reload") await session.reload();
      if (msg.command === "navigate" && msg.url) await session.navigate(msg.url);
      return;
    }
    if (msg.type !== "input") return;
    const event = msg.event;
    if (event.kind === "mouse") {
      await session.dispatchMouse({
        type: event.action === "move" ? "mouseMoved" : event.action === "down" ? "mousePressed" : "mouseReleased",
        x: event.x,
        y: event.y,
        button: event.button,
        clickCount: event.clickCount,
        modifiers: event.modifiers,
      });
    } else if (event.kind === "wheel") {
      await session.dispatchWheel(event);
    } else if (event.kind === "key") {
      await session.dispatchKey({
        type: event.action === "down" ? "keyDown" : "keyUp",
        key: event.key,
        code: event.code,
        keyCode: event.keyCode,
        modifiers: event.modifiers,
      });
    } else if (event.kind === "text") {
      await session.insertText(event.text || "");
    }
  });

  ws.on("close", async () => {
    const har = session.getHar("example.com");
    console.log(JSON.stringify(har).slice(0, 200) + "...");
    await session.close();
  });
});

server.listen(8787, () => {
  console.log("WS server on ws://localhost:8787");
});
