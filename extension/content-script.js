// Runs on ChatGPT pages. Receives requests via background, automates UI, streams replies back.
(function () {
  const HEARTBEAT_MS = 10000;

  // Register with background as "chatgpt" endpoint
  chrome.runtime.sendMessage({ type: 'LEXI_REGISTER', role: 'chatgpt' }, () => {
    console.log('[Lexi CS] Registered on ChatGPT page');
  });

  // Emit heartbeat to app (via background router)
  function heartbeat() {
    chrome.runtime.sendMessage({
      router: true,
      to: 'app',
      payload: { __LEXI_EXTENSION__: true, type: 'LEXI_EXTENSION_HEARTBEAT' }
    });
  }
  heartbeat();
  setInterval(heartbeat, HEARTBEAT_MS);

  // Active request state by id
  const active = new Map(); // id -> { lastText: string, doneTimer: any }

  // Utility: extract latest assistant text (heuristic)
  function extractLatestReply() {
    const roleNodes = document.querySelectorAll('div[data-message-author-role="assistant"]');
    let candidate = roleNodes.length ? roleNodes[roleNodes.length - 1] : null;
    if (!candidate) {
      const md = document.querySelectorAll('div.markdown');
      candidate = md.length ? md[md.length - 1] : null;
    }
    return candidate ? candidate.innerText.trim() : null;
  }

  // Diff helper
  function delta(prev, curr) {
    if (!prev) return curr;
    return curr.startsWith(prev) ? curr.slice(prev.length) : curr;
  }

  // Observe mutations to stream text
  let observer;
  function startObserver() {
    const target = document.querySelector('main') || document.body;
    if (!target) return setTimeout(startObserver, 750);
    observer = new MutationObserver(() => {
      if (active.size === 0) return;
      const latest = extractLatestReply();
      if (!latest) return;
      for (const [id, st] of active.entries()) {
        const d = delta(st.lastText, latest);
        if (d) {
          st.lastText = latest;
          chrome.runtime.sendMessage({
            router: true,
            to: 'app',
            payload: { __LEXI_EXTENSION__: true, type: 'LEXI_CHAT_RESPONSE_CHUNK', id, textChunk: d }
          });
        }
        clearTimeout(st.doneTimer);
        st.doneTimer = setTimeout(() => {
          chrome.runtime.sendMessage({
            router: true,
            to: 'app',
            payload: { __LEXI_EXTENSION__: true, type: 'LEXI_CHAT_RESPONSE_DONE', id }
          });
          active.delete(id);
        }, 2000);
      }
    });
    observer.observe(target, { childList: true, subtree: true });
    console.log('[Lexi CS] MutationObserver started');
  }
  startObserver();

  // Send prompt to ChatGPT UI
  function sendPromptToChatGPT(prompt) {
    const textarea = document.querySelector('textarea');
    const editor = textarea || document.querySelector('[contenteditable="true"]');
    if (!editor) return false;

    if (textarea) {
      textarea.value = prompt;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
      return true;
    }

    // contenteditable fallback
    if (editor && editor.isContentEditable) {
      editor.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'insertText', data: prompt }));
      editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
      return true;
    }
    return false;
  }

  // Receive requests from background (originating from the app)
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || typeof msg !== 'object') return;

    // Preferred new protocol
    if (msg.type === 'LEXI_CHAT_REQUEST' && msg.id && Array.isArray(msg.messages)) {
      const text = msg.messages.map(m => `[${String(m.role || '').toUpperCase()}] ${m.content || ''}`).join('\n\n');
      if (!sendPromptToChatGPT(text)) {
        chrome.runtime.sendMessage({
          router: true,
          to: 'app',
          payload: { __LEXI_EXTENSION__: true, type: 'LEXI_CHAT_RESPONSE_ERROR', id: msg.id, error: 'Input not found' }
        });
        return;
      }
      active.set(msg.id, { lastText: '', doneTimer: null });
      return;
    }

    // Legacy compatibility: direct prompt
    if (msg.type === 'LEXI_EXTENSION_SEND_PROMPT' && typeof msg.prompt === 'string') {
      sendPromptToChatGPT(msg.prompt);
      // No id to track; streaming still goes out as chunks without mapping
      return;
    }

    // Ping compatibility
    if (msg.type === 'LEXI_EXTENSION_PING') {
      chrome.runtime.sendMessage({
        router: true,
        to: 'app',
        payload: { __LEXI_EXTENSION__: true, type: 'LEXI_EXTENSION_HEARTBEAT' }
      });
      return;
    }
  });
})();