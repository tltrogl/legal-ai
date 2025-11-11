/**
 * Ollama Service - FREE Local AI Integration
 * 
 * Ollama runs AI models locally on your computer - 100% free forever!
 * 
 * Setup Instructions:
 * 1. Download Ollama from https://ollama.ai
 * 2. Install and run: `ollama serve`
 * 3. Pull a model: `ollama pull llama3.1:8b` (or llama3.1:70b for better quality)
 * 4. This service will automatically connect to http://localhost:11434
 * 
 * Recommended models:
 * - llama3.1:8b - Fast, good for most tasks
 * - llama3.1:70b - Slower but better reasoning (needs 32GB+ RAM)
 * - mistral:7b - Good for legal text
 * - phi3:mini - Smallest, fastest option
 */

import { Injectable } from '@angular/core';
import { AIProvider, ChatMessage, GenerateResponse } from './ai-provider.interface';

@Injectable({
    providedIn: 'root',
})
export class OllamaService implements AIProvider {
    readonly providerName = 'Ollama (Local)';
    readonly cost = 'free' as const;

    private baseUrl = 'http://localhost:11434';
    private model = 'llama3.1:8b'; // Default model
    private _isAvailable = false;

    get isAvailable(): boolean {
        return this._isAvailable;
    }

    async initialize(): Promise<void> {
        await this.checkHealth();
    }

    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
            });

            if (response.ok) {
                const data = await response.json();
                this._isAvailable = data.models && data.models.length > 0;

                if (this._isAvailable && data.models.length > 0) {
                    // Use the first available model
                    this.model = data.models[0].name;
                    console.log(`✅ Ollama available with model: ${this.model}`);
                }

                return this._isAvailable;
            }

            this._isAvailable = false;
            return false;
        } catch (error) {
            console.warn('⚠️ Ollama not available. Install from https://ollama.ai');
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
        if (!this._isAvailable) {
            throw new Error('Ollama is not available. Please install and run Ollama from https://ollama.ai');
        }

        // Convert messages to Ollama format
        const prompt = this.formatMessagesAsPrompt(messages);

        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: options?.temperature ?? 0.7,
                    num_predict: options?.maxTokens ?? 4096,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();

        return {
            text: data.response,
            usage: {
                promptTokens: data.prompt_eval_count,
                completionTokens: data.eval_count,
                totalTokens: data.prompt_eval_count + data.eval_count,
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
        if (!this._isAvailable) {
            throw new Error('Ollama is not available');
        }

        // Use vision model if analyzing images
        const isImage = mimeType.startsWith('image/');
        const modelToUse = isImage ? 'llava:latest' : this.model;

        const requestBody: any = {
            model: modelToUse,
            prompt: prompt,
            stream: false,
            options: {
                temperature: options?.temperature ?? 0.7,
                num_predict: options?.maxTokens ?? 4096,
            },
        };

        // Add image data if analyzing visual content
        if (isImage) {
            requestBody.images = [mediaData];
        } else {
            // For audio/video, we'll need to pass transcription or description
            requestBody.prompt = `${prompt}\n\n[Note: Video/audio analysis requires transcription first]`;
        }

        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();

        return {
            text: data.response,
            usage: {
                promptTokens: data.prompt_eval_count,
                completionTokens: data.eval_count,
                totalTokens: data.prompt_eval_count + data.eval_count,
            },
        };
    }

    async performResearch(
        query: string,
        options?: {
            includeWebSearch?: boolean;
            maxResults?: number;
        }
    ): Promise<GenerateResponse> {
        // Ollama doesn't have built-in web search, but we can use the model
        // to analyze and provide information based on its training
        const prompt = `Please answer this legal research question: ${query}\n\nProvide a detailed answer with relevant legal principles and considerations.`;

        return this.generateChatResponse([
            {
                role: 'system',
                content: 'You are an expert legal researcher. Provide accurate, well-reasoned answers based on established legal principles.',
            },
            {
                role: 'user',
                content: prompt,
            },
        ]);
    }

    /**
     * Get list of available models from Ollama
     */
    async getAvailableModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (response.ok) {
                const data = await response.json();
                return data.models.map((m: any) => m.name);
            }
            return [];
        } catch {
            return [];
        }
    }

    /**
     * Set the model to use for generation
     */
    setModel(modelName: string): void {
        this.model = modelName;
    }

    /**
     * Pull a new model from Ollama registry
     */
    async pullModel(modelName: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/api/pull`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: modelName,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to pull model: ${response.statusText}`);
        }

        // Note: This returns a stream, we're just initiating the pull
        console.log(`Started pulling model: ${modelName}`);
    }

    private formatMessagesAsPrompt(messages: ChatMessage[]): string {
        let prompt = '';

        for (const message of messages) {
            if (message.role === 'system') {
                prompt += `System: ${message.content}\n\n`;
            } else if (message.role === 'user') {
                prompt += `User: ${message.content}\n\n`;
            } else if (message.role === 'assistant') {
                prompt += `Assistant: ${message.content}\n\n`;
            }
        }

        prompt += 'Assistant: ';
        return prompt;
    }
}
