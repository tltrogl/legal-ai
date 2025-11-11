/**
 * Groq Service - FREE Fast AI API
 * 
 * Groq provides fast, free API access to open-source models!
 * 
 * Setup Instructions:
 * 1. Go to https://console.groq.com
 * 2. Sign up for free account
 * 3. Generate API key (free tier: ~14,400 tokens/min)
 * 4. Set GROQ_API_KEY in your environment
 * 
 * Available models (all free):
 * - llama-3.3-70b-versatile - Best quality
 * - llama-3.1-8b-instant - Fastest
 * - mixtral-8x7b-32768 - Great for legal reasoning
 */

import { Injectable } from '@angular/core';
import { AIProvider, ChatMessage, GenerateResponse } from './ai-provider.interface';

@Injectable({
    providedIn: 'root',
})
export class GroqService implements AIProvider {
    readonly providerName = 'Groq (Free API)';
    readonly cost = 'free' as const;

    private apiKey = '';
    private baseUrl = 'https://api.groq.com/openai/v1';
    private model = 'llama-3.3-70b-versatile'; // Default to best free model
    private _isAvailable = false;

    get isAvailable(): boolean {
        return this._isAvailable;
    }

    async initialize(): Promise<void> {
        // Check for API key in environment or localStorage
        this.apiKey = process.env.GROQ_API_KEY || localStorage.getItem('groq_api_key') || '';

        if (this.apiKey) {
            await this.checkHealth();
        } else {
            console.warn('⚠️ Groq API key not found. Get free API key at https://console.groq.com');
            this._isAvailable = false;
        }
    }

    async checkHealth(): Promise<boolean> {
        if (!this.apiKey) {
            this._isAvailable = false;
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            this._isAvailable = response.ok;

            if (this._isAvailable) {
                console.log('✅ Groq API available (Free tier)');
            }

            return this._isAvailable;
        } catch (error) {
            console.error('❌ Groq API check failed:', error);
            this._isAvailable = false;
            return false;
        }
    }

    async generateChatResponse(
        messages: ChatMessage[],
        options?: {
            temperature?: number;
            maxTokens?: number;
            stream?: boolean;
        }
    ): Promise<GenerateResponse> {
        if (!this._isAvailable || !this.apiKey) {
            throw new Error('Groq API is not available. Please set your API key.');
        }

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 4096,
                stream: false,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API error: ${error}`);
        }

        const data = await response.json();

        return {
            text: data.choices[0].message.content,
            usage: {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
            },
        };
    }

    async analyzeMedia(
        prompt: string,
        mediaData: string,
        mimeType: string,
        options?: {
            temperature?: number;
            maxTokens?: number;
        }
    ): Promise<GenerateResponse> {
        // Groq doesn't support vision yet, so we'll return an error message
        if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
            throw new Error('Groq does not support image/video analysis yet. Use Ollama with llava model or another provider.');
        }

        // For text-based analysis
        return this.generateChatResponse([
            {
                role: 'user',
                content: prompt,
            },
        ], options);
    }

    async performResearch(
        query: string,
        options?: {
            includeWebSearch?: boolean;
            maxResults?: number;
        }
    ): Promise<GenerateResponse> {
        // Groq doesn't have built-in web search
        // But we can use the model to provide information based on training data
        return this.generateChatResponse([
            {
                role: 'system',
                content: 'You are an expert legal researcher. Provide detailed, accurate answers based on established legal principles and case law.',
            },
            {
                role: 'user',
                content: query,
            },
        ]);
    }

    /**
     * Set the API key (can be called from settings UI)
     */
    setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
        localStorage.setItem('groq_api_key', apiKey);
        this.checkHealth();
    }

    /**
     * Set the model to use
     */
    setModel(modelName: string): void {
        this.model = modelName;
    }

    /**
     * Get available models
     */
    async getAvailableModels(): Promise<string[]> {
        if (!this.apiKey) return [];

        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data.data.map((m: any) => m.id);
            }
            return [];
        } catch {
            return [];
        }
    }
}
