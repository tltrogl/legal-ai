# Lexi ChatGPT Bridge Extension (Draft)

This Chrome/Edge Manifest V3 extension enables the Angular app to leverage the ChatGPT web interface without using the paid OpenAI API.

## Status
Early draft. Provides basic one-way prompt sending and heuristic response capture using DOM observation.

## How It Works
1. Content script runs on `https://chat.openai.com/*` pages.
2. Angular app posts `window.postMessage` events (`LEXI_EXTENSION_SEND_PROMPT`).
3. Content script injects prompt into ChatGPT textarea and triggers Enter.
4. DOM mutations are observed; latest assistant reply text is sent back via `window.postMessage` events (`LEXI_EXTENSION_RESPONSE_CHUNK`).
5. App assembles chunks and exposes them as AI provider responses.

## Installation
1. Clone repository.
2. Open Chrome/Edge Extensions page (`chrome://extensions`).
3. Enable Developer Mode.
4. Click "Load Unpacked" and select the `legal-ai/extension` directory.
5. Open ChatGPT in a tab and keep it active/logged in.

## Messaging Contract
Outbound (App -> ChatGPT page):
- `LEXI_EXTENSION_PING` -> content script replies with `LEXI_EXTENSION_PONG`.
- `LEXI_EXTENSION_SEND_PROMPT` `{ prompt: string }`

Inbound (Content script -> App):
- `LEXI_EXTENSION_READY`
- `LEXI_EXTENSION_PONG`
- `LEXI_EXTENSION_RESPONSE_CHUNK` `{ chunk: string }`
- `LEXI_EXTENSION_ERROR` `{ error: string }`

## Security & Warnings
- This approach automates a consumer UI; subject to change without notice.
- May violate OpenAI Terms if used for production workloads or high-volume scraping; use for personal experimentation.
- No API keys are stored; relies on existing user session cookies.
- Do NOT expose privileged internal data into ChatGPT prompts.

## Next Steps
- Robust diffing to avoid sending duplicate full replies as chunks.
- Rate limiting / cooldown handling.
- Separate injection script for more reliable DOM hooks.
- Configurable origin validation instead of `*`.
- Better parsing of streaming tokens rather than full container text.

## Disclaimer
This is for exploration and free-tier enablement only. Evaluate compliance and legal considerations before broader use.
