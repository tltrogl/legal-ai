/**
 * ChatGPTExtensionService
 * Implements AIProvider by automating the ChatGPT web UI via a browser extension.
 *
 * NOTE: This relies on a Chrome/Firefox extension injecting a content script into
 * https://chat.openai.com and relaying messages through window.postMessage or chrome.runtime messaging.
 *
 * High-level protocol:
 *  App (Angular) → ChatGPTExtensionService.generateChatResponse()
 *    -> window.postMessage({ type: 'LEXI_CHAT_REQUEST', id, messages })
 *  Content Script listens, populates textarea, sends, streams tokens
 *  Content Script posts back incremental or final response:
 *    window.postMessage({ type: 'LEXI_CHAT_RESPONSE', id, text, done })
 *
 * This service aggregates streamed chunks until done=true.
 * Falls back with an error if no extension heartbeat is detected.
 */

import { Injectable } from '@angular/core';
import { AIProvider, ChatMessage, GenerateResponse } from './ai-provider.interface';

interface PendingRequest {
    id: string;
    resolve: (resp: GenerateResponse) => void;
    reject: (err: any) => void;
    buffer: string[];
}

@Injectable({ providedIn: 'root' })
export class ChatGPTExtensionService implements AIProvider {
    readonly providerName = 'ChatGPT Extension';
    readonly cost = 'free' as const;
    private availabilityChecked = false;
    private extensionAvailable = false;
    private pending: Map<string, PendingRequest> = new Map();
    private heartbeatLast: number = 0;
    private heartbeatIntervalMs = 30000; // Expect heartbeat at least every 30s

    constructor() {
        // Listen for responses from extension/content script
        window.addEventListener('message', (evt) => this.handleMessage(evt));
    }

    get isAvailable(): boolean {
        return this.extensionAvailable;
    }

    async initialize(): Promise<void> {
        // Send a ping to extension; extension should answer with LEXI_EXTENSION_HEARTBEAT
        this.sendRaw({ type: 'LEXI_EXTENSION_PING' });
        // Give it a short window to respond
        await new Promise((res) => setTimeout(res, 500));
        this.availabilityChecked = true;
    }

    async checkHealth(): Promise<boolean> {
        if (!this.availabilityChecked) await this.initialize();
        // If heartbeat updated recently, mark available
        const now = Date.now();
        this.extensionAvailable = (now - this.heartbeatLast) < this.heartbeatIntervalMs;
        return this.extensionAvailable;
    }

    async generateChatResponse(
        messages: ChatMessage[],
        options?: { temperature?: number; maxTokens?: number; stream?: boolean }
    ): Promise<GenerateResponse> {
        const healthy = await this.checkHealth();
        if (!healthy) {
            throw new Error('ChatGPT extension not detected. Install/enable the browser extension to use this provider.');
        }
        const id = crypto.randomUUID();
        const payload = {
            type: 'LEXI_CHAT_REQUEST',
            id,
            messages,
            options: {
                temperature: options?.temperature ?? 0.7,
                maxTokens: options?.maxTokens ?? 2048,
                stream: true,
            },
        };

        const promise = new Promise<GenerateResponse>((resolve, reject) => {
            this.pending.set(id, { id, resolve, reject, buffer: [] });
            // Timeout safeguard
            setTimeout(() => {
                if (this.pending.has(id)) {
                    this.pending.get(id)!.reject(new Error('Extension response timeout.'));
                    this.pending.delete(id);
                }
            }, 60000); // 60s timeout initial implementation
        });

        this.sendRaw(payload);
        return promise;
    }

    async analyzeMedia(
        prompt: string,
        mediaData: string,
        mimeType: string,
        options?: { temperature?: number; maxTokens?: number }
    ): Promise<GenerateResponse> {
        // ChatGPT web UI does not natively accept arbitrary base64 media via automation; out of scope.
        // We fallback to textual description approach.
        return this.generateChatResponse([
            { role: 'user', content: `${prompt}\n\n[Media analysis unsupported in extension mode: mime=${mimeType}]` },
        ]);
    }

    async performResearch(query: string): Promise<GenerateResponse> {
        // Treat as a generic chat; instruct ChatGPT to answer as a legal researcher.
        return this.generateChatResponse([
            { role: 'system', content: 'You are an expert legal researcher. Provide concise, citation-aware answers. If unsure, say so.' },
            { role: 'user', content: query },
        ]);
    }

    // Helper to send window messages
    private sendRaw(data: any) {
        window.postMessage({ __LEXI_BRIDGE__: true, ...data }, '*');
    }

    private handleMessage(evt: MessageEvent) {
        const msg = evt.data;
        if (!msg || !msg.__LEXI_EXTENSION__) return;

        switch (msg.type) {
            case 'LEXI_EXTENSION_HEARTBEAT':
                this.heartbeatLast = Date.now();
                this.extensionAvailable = true;
                break;
            case 'LEXI_CHAT_RESPONSE_CHUNK': {
                const pending = this.pending.get(msg.id);
                if (pending) {
                    pending.buffer.push(msg.textChunk || '');
                }
                break;
            }
            case 'LEXI_CHAT_RESPONSE_DONE': {
                const pending = this.pending.get(msg.id);
                if (pending) {
                    const full = pending.buffer.join('');
                    pending.resolve({ text: full });
                    this.pending.delete(msg.id);
                }
                break;
            }
            case 'LEXI_CHAT_RESPONSE_ERROR': {
                const pending = this.pending.get(msg.id);
                if (pending) {
                    pending.reject(new Error(msg.error || 'Unknown extension error'));
                    this.pending.delete(msg.id);
                }
                break;
            }
        }
    }
}
