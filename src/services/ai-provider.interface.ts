/**
 * Abstract interface for AI providers
 * Supports multiple backends: Ollama (local), ChatGPT (web), Groq (free API), etc.
 */

export interface AIProviderConfig {
    provider: 'ollama' | 'chatgpt-extension' | 'groq' | 'huggingface' | 'gemini';
    apiKey?: string;
    baseUrl?: string;
    model?: string;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface GenerateResponse {
    text: string;
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
    sources?: Array<{
        title: string;
        url: string;
        snippet: string;
    }>;
}

export interface AIProvider {
    readonly providerName: string;
    readonly isAvailable: boolean;
    readonly cost: 'free' | 'paid';

    /**
     * Initialize the provider (check availability, setup connection, etc.)
     */
    initialize(): Promise<void>;

    /**
     * Check if the provider is currently available and working
     */
    checkHealth(): Promise<boolean>;

    /**
     * Generate a chat response with conversation history
     */
    generateChatResponse(
        messages: ChatMessage[],
        options?: {
            temperature?: number;
            maxTokens?: number;
            stream?: boolean;
        }
    ): Promise<GenerateResponse>;

    /**
     * Analyze media (image, video, audio) with a prompt
     */
    analyzeMedia(
        prompt: string,
        mediaData: string,
        mimeType: string,
        options?: {
            temperature?: number;
            maxTokens?: number;
        }
    ): Promise<GenerateResponse>;

    /**
     * Perform web search or research
     */
    performResearch?(
        query: string,
        options?: {
            includeWebSearch?: boolean;
            maxResults?: number;
        }
    ): Promise<GenerateResponse>;
}

export interface AIProviderFactory {
    createProvider(config: AIProviderConfig): AIProvider;
    getAvailableProviders(): Promise<string[]>;
}
