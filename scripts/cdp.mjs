// Shared Chrome DevTools Protocol harness for the audits. Both audit scripts
// opened with the same eight lines of WebSocket plumbing; this is that, once.
//
// Assumes a headless Chrome on :9222 and a served build on AUDIT_URL.

export async function openPage({ width = 1280, height = 1200, settle = 4500 } = {}) {
  const target = await (
    await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })
  ).json();

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let id = 0;

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('could not connect to Chrome on :9222'));
  });
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m.result);
      pending.delete(m.id);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const i = ++id;
      pending.set(i, resolve);
      ws.send(JSON.stringify({ id: i, method, params }));
    });

  await send('Page.enable');
  // A rebuilt site keeps its URLs, so a cached page would load the last
  // build's scripts.
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: false
  });

  const url = process.env.AUDIT_URL || 'http://localhost:4173/';
  await send('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, settle));

  return {
    url,
    /** Evaluate an expression in the page and return it by value. */
    eval: async (expression) =>
      (await send('Runtime.evaluate', { expression, returnByValue: true })).result.value,
    /** PNG of the viewport, as a Buffer. Used by cards.mjs. */
    screenshot: async () =>
      Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'),
    close: () => ws.close()
  };
}
