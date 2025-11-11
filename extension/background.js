// Background service worker for Lexi ChatGPT Bridge
// Relays messages between page/scripts if needed (future expansion)

chrome.runtime.onInstalled.addListener(() => {
    console.log('[Lexi Bridge] Extension installed.');
});

// Placeholder: could maintain connection ports later
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
    if (msg && msg.type === 'LEXI_BG_PING') {
        reply({ ok: true });
    }
});
