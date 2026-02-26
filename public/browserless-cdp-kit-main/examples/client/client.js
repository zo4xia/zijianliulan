const statusEl = document.getElementById('status');
const frameEl = document.getElementById('frame');
const urlInput = document.getElementById('url');
let ws = null;
let active = false;
let meta = null;

function send(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

function mapCoords(clientX, clientY) {
  if (!meta?.deviceWidth || !meta?.deviceHeight) return { x: clientX, y: clientY };
  const rect = frameEl.getBoundingClientRect();
  const scaleX = meta.deviceWidth / rect.width;
  const scaleY = meta.deviceHeight / rect.height;
  return {
    x: Math.round((clientX - rect.left) * scaleX),
    y: Math.round((clientY - rect.top) * scaleY),
  };
}

function connect() {
  const wsUrl = prompt('Enter WS URL (e.g. ws://localhost:8787)');
  if (!wsUrl) return;
  ws = new WebSocket(wsUrl);
  statusEl.textContent = 'Connecting…';
  ws.onopen = () => { statusEl.textContent = 'Connected'; };
  ws.onclose = () => { statusEl.textContent = 'Disconnected'; };
  ws.onerror = () => { statusEl.textContent = 'Error'; };
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'frame') {
      meta = msg.frame.metadata || null;
      frameEl.innerHTML = '';
      const img = document.createElement('img');
      img.src = `data:image/jpeg;base64,${msg.frame.data}`;
      frameEl.appendChild(img);
    } else if (msg.type === 'nav') {
      urlInput.value = msg.url;
    }
  };
}

document.getElementById('connect').onclick = connect;
document.getElementById('back').onclick = () => send({ type: 'command', command: 'back' });
document.getElementById('forward').onclick = () => send({ type: 'command', command: 'forward' });
document.getElementById('reload').onclick = () => send({ type: 'command', command: 'reload' });
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const url = normalizeUrl(urlInput.value);
    urlInput.value = url;
    send({ type: 'command', command: 'navigate', url });
  }
});

frameEl.addEventListener('pointerenter', () => { active = true; });
frameEl.addEventListener('pointerleave', () => { active = false; });

frameEl.addEventListener('mousemove', (e) => {
  if (!active) return;
  const { x, y } = mapCoords(e.clientX, e.clientY);
  send({ type: 'input', event: { kind: 'mouse', action: 'move', x, y, button: 'left', clickCount: 1 } });
});
frameEl.addEventListener('mousedown', (e) => {
  if (!active) return;
  const { x, y } = mapCoords(e.clientX, e.clientY);
  send({ type: 'input', event: { kind: 'mouse', action: 'down', x, y, button: 'left', clickCount: 1 } });
});
frameEl.addEventListener('mouseup', (e) => {
  if (!active) return;
  const { x, y } = mapCoords(e.clientX, e.clientY);
  send({ type: 'input', event: { kind: 'mouse', action: 'up', x, y, button: 'left', clickCount: 1 } });
});
frameEl.addEventListener('wheel', (e) => {
  if (!active) return;
  e.preventDefault();
  const { x, y } = mapCoords(e.clientX, e.clientY);
  send({ type: 'input', event: { kind: 'wheel', x, y, deltaX: e.deltaX, deltaY: e.deltaY } });
}, { passive: false });

window.addEventListener('keydown', (e) => {
  if (!active) return;
  e.preventDefault();
  send({ type: 'input', event: { kind: 'key', action: 'down', key: e.key, code: e.code, keyCode: e.keyCode } });
  if (e.key.length === 1) {
    send({ type: 'input', event: { kind: 'text', text: e.key } });
  }
});
window.addEventListener('keyup', (e) => {
  if (!active) return;
  e.preventDefault();
  send({ type: 'input', event: { kind: 'key', action: 'up', key: e.key, code: e.code, keyCode: e.keyCode } });
});
