// Content script injected on ChatGPT pages to enable Lexi bridge
// Listens for window messages from the Angular app and interacts with ChatGPT DOM

(function () {
    const APP_ORIGIN_ALLOWED = '*'; // adjust if you want stricter origin checks

    function postToApp(payload) {
        window.postMessage(payload, APP_ORIGIN_ALLOWED);
    }

    function log(...a) {
        console.log('[Lexi CS]', ...a);
    }

    // Observe ChatGPT response area for new messages
    let observer;
    function startObserver() {
        const target = document.querySelector('main');
        if (!target) {
            log('Main element not found yet, retrying...');
            setTimeout(startObserver, 1000);
            return;
        }
        observer = new MutationObserver(handleMutations);
        observer.observe(target, { childList: true, subtree: true });
        log('MutationObserver started');
    }

    function extractLatestReply() {
        // heuristic: last markdown block / message container
        const containers = document.querySelectorAll('div.markdown, .group div[data-message-author-role="assistant"]');
        if (containers.length === 0) return null;
        const last = containers[containers.length - 1];
        return last.innerText.trim();
    }

    function handleMutations(mutations) {
        for (const m of mutations) {
            if (m.addedNodes && m.addedNodes.length) {
                const reply = extractLatestReply();
                if (reply) {
                    postToApp({ type: 'LEXI_EXTENSION_RESPONSE_CHUNK', chunk: reply });
                }
            }
        }
    }

    function sendPromptToChatGPT(prompt) {
        // Find textarea and submit button
        const textarea = document.querySelector('textarea');
        if (!textarea) {
            postToApp({ type: 'LEXI_EXTENSION_ERROR', error: 'Textarea not found' });
            return;
        }
        textarea.value = prompt;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));

        // Press Enter programmatically
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true });
        textarea.dispatchEvent(enterEvent);
    }

    window.addEventListener('message', (event) => {
        const { data } = event;
        if (!data || typeof data !== 'object') return;
        switch (data.type) {
            case 'LEXI_EXTENSION_PING':
                postToApp({ type: 'LEXI_EXTENSION_PONG' });
                break;
            case 'LEXI_EXTENSION_SEND_PROMPT':
                sendPromptToChatGPT(data.prompt || '');
                break;
            default:
                break;
        }
    });

    // Initial ready signal
    postToApp({ type: 'LEXI_EXTENSION_READY' });
    startObserver();
})();
