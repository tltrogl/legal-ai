// Injected on the app page (localhost). Bridges window.postMessage <-> background routing.
(function () {
  const ORIGIN = '*';

  // Register with background as "app" endpoint
  chrome.runtime.sendMessage({ type: 'LEXI_REGISTER', role: 'app' }, () => {
    console.log('[Lexi AppBridge] Registered');
    // Send initial heartbeat to app so it marks extension available (legacy or new)
    window.postMessage({ __LEXI_EXTENSION__: true, type: 'LEXI_EXTENSION_HEARTBEAT' }, ORIGIN);
  });

  // Forward app -> ChatGPT via background router
  window.addEventListener('message', (evt) => {
    const data = evt.data;
    if (!data || typeof data !== 'object') return;
    if (!data.__LEXI_BRIDGE__) return; // Only bridge Lexi messages from the app
    chrome.runtime.sendMessage({ router: true, to: 'chatgpt', payload: data });
  });

  // Forward ChatGPT -> app (payload already in Lexi extension format)
  chrome.runtime.onMessage.addListener((payload) => {
    if (!payload || typeof payload !== 'object') return;
    // Only accept the extension side messages
    if (!payload.__LEXI_EXTENSION__) return;
    window.postMessage(payload, ORIGIN);
  });
})();