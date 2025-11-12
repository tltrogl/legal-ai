// Background router: relays messages between the app tab (localhost) and ChatGPT tab.
let appTabId = null;
let chatgptTabId = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Lexi Bridge] Installed.');
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  try {
    // Registration from content scripts
    if (msg && msg.type === 'LEXI_REGISTER') {
      if (msg.role === 'app') {
        appTabId = sender.tab?.id ?? null;
        console.log('[Lexi Bridge] Registered app tab', appTabId);
        sendResponse({ ok: true });
        return true;
      }
      if (msg.role === 'chatgpt') {
        chatgptTabId = sender.tab?.id ?? null;
        console.log('[Lexi Bridge] Registered chatgpt tab', chatgptTabId);
        sendResponse({ ok: true });
        return true;
      }
    }

    // Router envelope: { router: true, to: 'app'|'chatgpt', payload: {...} }
    if (msg && msg.router === true) {
      if (msg.to === 'chatgpt') {
        if (chatgptTabId != null) {
          chrome.tabs.sendMessage(chatgptTabId, msg.payload);
        }
        return true;
      }
      if (msg.to === 'app') {
        if (appTabId != null) {
          chrome.tabs.sendMessage(appTabId, msg.payload);
        }
        return true;
      }
    }
  } catch (e) {
    console.warn('[Lexi Bridge] Routing error', e);
  }
  return false;
});