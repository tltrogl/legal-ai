/**
 * ChatGPTExtensionService
 * Supports both routed (new) and legacy protocols.
 * Routed flow: app -> app-bridge (content script) -> background -> chatgpt content script -> background -> app-bridge -> app
 */
import { Injectable } from '@angular/core';
import { AIProvider, ChatMessage, GenerateResponse } from './ai-provider.interface';

interface PendingRequest {
  id: string;
  resolve: (resp: GenerateResponse) => void;
  reject: (err: any) => void;
  buffer: string[];
  lastUpdate: number;
  doneTimer?: any;
  legacy?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChatGPTExtensionService implements AIProvider {
  readonly providerName = 'ChatGPT Extension';
  readonly cost = 'free' as const;

  private availabilityChecked = false;
  private extensionAvailable = false;
  private pending: Map<string, PendingRequest> = new Map();
  private heartbeatLast = 0;
  private heartbeatIntervalMs = 30000;
  private legacyMode = false;

  constructor() {
    window.addEventListener('message', (evt) => this.handleMessage(evt));
  }

  get isAvailable(): boolean {
    return this.extensionAvailable;
  }

  async initialize(): Promise<void> {
    this.sendRaw({ type: 'LEXI_EXTENSION_PING' });
    await this.sleep(600);
    this.availabilityChecked = true;
  }

  async checkHealth(): Promise<boolean> {
    if (!this.availabilityChecked) await this.initialize();
    const now = Date.now();
    const newProtoHealthy = (now - this.heartbeatLast) < this.heartbeatIntervalMs;
    if (this.legacyMode && !newProtoHealthy) {
      this.extensionAvailable = true;
      return true;
    }
    this.extensionAvailable = newProtoHealthy;
    return this.extensionAvailable;
  }

  async generateChatResponse(
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number; stream?: boolean }
  ): Promise<GenerateResponse> {
    const healthy = await this.checkHealth();
    if (!healthy) {
      throw new Error('ChatGPT extension not detected. Reload extension, open ChatGPT tab, and keep it active.');
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
      this.pending.set(id, { id, resolve, reject, buffer: [], lastUpdate: Date.now() });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.get(id)!.reject(new Error('Extension response timeout.'));
          this.pending.delete(id);
        }
      }, 90000);
    });

    this.sendRaw(payload);

    if (this.legacyMode) {
      const legacyPrompt = this.buildPlainPrompt(messages);
      this.sendRaw({ type: 'LEXI_EXTENSION_SEND_PROMPT', prompt: legacyPrompt });
      const req = this.pending.get(id);
      if (req) req.legacy = true;
    }

    return promise;
  }

  async analyzeMedia(prompt: string, mediaData: string, mimeType: string): Promise<GenerateResponse> {
    return this.generateChatResponse([
      { role: 'user', content: `${prompt}\n\n[Media inline unsupported in extension automation: mime=${mimeType}]` },
    ]);
  }

  async performResearch(query: string): Promise<GenerateResponse> {
    return this.generateChatResponse([
      { role: 'system', content: 'You are an expert legal researcher. Provide concise, citation-aware answers. If unsure, say so.' },
      { role: 'user', content: query },
    ]);
  }

  // Internal

  private sendRaw(data: any) {
    // App page content script (app-bridge.js) will pick this up and route it.
    window.postMessage({ __LEXI_BRIDGE__: true, ...data }, '*');
  }

  private handleMessage(evt: MessageEvent) {
    const msg = evt.data;
    if (!msg || typeof msg !== 'object') return;

    // Routed/new protocol from extension side
    if (msg.__LEXI_EXTENSION__) {
      switch (msg.type) {
        case 'LEXI_EXTENSION_HEARTBEAT':
          this.heartbeatLast = Date.now();
          this.extensionAvailable = true;
          return;

        case 'LEXI_CHAT_RESPONSE_CHUNK': {
          const pending = this.pending.get(msg.id);
          if (pending) {
            pending.buffer.push(msg.textChunk || '');
            pending.lastUpdate = Date.now();
          }
          return;
        }

        case 'LEXI_CHAT_RESPONSE_DONE': {
          const pending = this.pending.get(msg.id);
          if (pending) {
            const full = pending.buffer.join('');
            pending.resolve({ text: full });
            this.pending.delete(msg.id);
          }
          return;
        }

        case 'LEXI_CHAT_RESPONSE_ERROR': {
          const pending = this.pending.get(msg.id);
          if (pending) {
            pending.reject(new Error(msg.error || 'Unknown extension error'));
            this.pending.delete(msg.id);
          }
          return;
        }
      }
    }

    // Legacy protocol detection
    if (!this.legacyMode) {
      if (msg.type === 'LEXI_EXTENSION_READY' || msg.type === 'LEXI_EXTENSION_PONG' || msg.type === 'LEXI_EXTENSION_RESPONSE_CHUNK') {
        if (this.heartbeatLast === 0) {
          this.legacyMode = true;
          this.extensionAvailable = true;
        }
      }
    }

    // Legacy handling: map chunks to first pending (no IDs)
    if (this.legacyMode && msg.type === 'LEXI_EXTENSION_RESPONSE_CHUNK') {
      const target = this.findLegacyTarget();
      if (target) {
        const latest = msg.chunk || '';
        const prev = target.buffer.join('');
        const d = latest.startsWith(prev) ? latest.slice(prev.length) : latest;
        if (d) target.buffer.push(d);
        clearTimeout(target.doneTimer);
        target.doneTimer = setTimeout(() => {
          if (this.pending.has(target.id)) {
            const full = this.pending.get(target.id)!.buffer.join('');
            target.resolve({ text: full });
            this.pending.delete(target.id);
          }
        }, 2000);
      }
    }

    if (this.legacyMode && msg.type === 'LEXI_EXTENSION_ERROR') {
      const target = this.findLegacyTarget();
      if (target) {
        target.reject(new Error(msg.error || 'Legacy extension error'));
        this.pending.delete(target.id);
      }
    }
  }

  private findLegacyTarget(): PendingRequest | undefined {
    for (const p of this.pending.values()) if (p.legacy) return p;
    return this.pending.values().next().value;
  }

  private buildPlainPrompt(messages: ChatMessage[]): string {
    return messages.map(m => `[${String(m.role || '').toUpperCase()}] ${m.content || ''}`).join('\n\n');
  }

  private sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
}