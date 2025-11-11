/**
 * AI Provider Service - Orchestrates Multiple FREE AI Providers
 * 
 * This service manages multiple AI providers and allows easy switching:
 * - Ollama (100% free, local)
 * - Groq (free API tier)
 * - ChatGPT Extension (free with ChatGPT account)
 * 
 * Default priority: Ollama > Groq > ChatGPT Extension
 */

import { Injectable, inject } from '@angular/core';
import { AIProvider, ChatMessage, GenerateResponse, AIProviderConfig } from './ai-provider.interface';
import { OllamaService } from './ollama.service';
import { GroqService } from './groq.service';
import { ChatGPTExtensionService } from './chatgpt-extension.service';
import { CaseFile, DiscoveryDocument } from '../models/case-file.model';

@Injectable({
    providedIn: 'root',
})
export class AIProviderService {
    private ollamaService = inject(OllamaService);
    private groqService = inject(GroqService);
    private chatgptExtensionService = inject(ChatGPTExtensionService);

    private currentProvider: AIProvider | null = null;
    private currentProviderName: string = 'ollama'; // Default to local/free

    async initialize(): Promise<void> {
        // Try to initialize all providers
        await Promise.all([
            this.ollamaService.initialize().catch(() => { }),
            this.groqService.initialize().catch(() => { }),
            this.chatgptExtensionService.initialize().catch(() => { }),
        ]);

        // Select first available provider
        await this.selectBestAvailableProvider();
    }

    private async selectBestAvailableProvider(): Promise<void> {
        const preference = localStorage.getItem('preferred_ai_provider');

        if (preference) {
            // User has a preference, try that first
            const success = await this.setProvider(preference);
            if (success) return;
        }

        // Try providers in priority order
        if (this.ollamaService.isAvailable) {
            this.currentProvider = this.ollamaService;
            this.currentProviderName = 'ollama';
            console.log('✅ Using Ollama (Local AI)');
        } else if (this.groqService.isAvailable) {
            this.currentProvider = this.groqService;
            this.currentProviderName = 'groq';
            console.log('✅ Using Groq (Free API)');
        } else if (this.chatgptExtensionService.isAvailable) {
            this.currentProvider = this.chatgptExtensionService;
            this.currentProviderName = 'chatgpt-extension';
            console.log('✅ Using ChatGPT Extension');
        } else {
            console.warn('⚠️ No AI providers available. Please configure one in Settings.');
            this.currentProvider = null;
        }
    }

    async setProvider(providerName: string): Promise<boolean> {
        let provider: AIProvider | null = null;

        switch (providerName.toLowerCase()) {
            case 'ollama':
                if (!this.ollamaService.isAvailable) {
                    await this.ollamaService.initialize();
                }
                if (this.ollamaService.isAvailable) {
                    provider = this.ollamaService;
                }
                break;

            case 'groq':
                if (!this.groqService.isAvailable) {
                    await this.groqService.initialize();
                }
                if (this.groqService.isAvailable) {
                    provider = this.groqService;
                }
                break;
            case 'chatgpt-extension':
                if (!this.chatgptExtensionService.isAvailable) {
                    await this.chatgptExtensionService.initialize();
                }
                if (this.chatgptExtensionService.isAvailable) {
                    provider = this.chatgptExtensionService;
                }
                break;

            default:
                throw new Error(`Unknown provider: ${providerName}`);
        }

        if (provider) {
            this.currentProvider = provider;
            this.currentProviderName = providerName;
            localStorage.setItem('preferred_ai_provider', providerName);
            return true;
        }

        return false;
    }

    getCurrentProvider(): string {
        return this.currentProviderName;
    }

    async getProviderStatus(): Promise<Array<{ name: string, available: boolean, cost: string }>> {
        return [
            {
                name: 'ollama',
                available: this.ollamaService.isAvailable,
                cost: 'free',
            },
            {
                name: 'groq',
                available: this.groqService.isAvailable,
                cost: 'free',
            },
            {
                name: 'chatgpt-extension',
                available: this.chatgptExtensionService.isAvailable,
                cost: 'free',
            },
        ];
    }

    async testProvider(providerName: string): Promise<boolean> {
        switch (providerName.toLowerCase()) {
            case 'ollama':
                return this.ollamaService.checkHealth();
            case 'groq':
                return this.groqService.checkHealth();
            default:
                return false;
        }
    }

    // Gemini-compatible API methods (so we don't have to change existing components much)

    async generateChatResponse(
        history: any[],
        newContent: any[],
        deepAnalysis: boolean
    ): Promise<any> {
        if (!this.currentProvider) {
            throw new Error('No AI provider available. Please configure one in Settings.');
        }

        // Convert to standard chat format
        const messages: ChatMessage[] = [
            ...history.map((msg: any) => ({
                role: msg.role as 'system' | 'user' | 'assistant',
                content: typeof msg.parts === 'string' ? msg.parts : msg.parts.map((p: any) => p.text).join(' '),
            })),
            {
                role: 'user' as const,
                content: newContent.map((p: any) => p.text).join(' '),
            },
        ];

        const response = await this.currentProvider.generateChatResponse(messages, {
            temperature: deepAnalysis ? 0.3 : 0.7,
            maxTokens: deepAnalysis ? 8000 : 4000,
        });

        return { text: response.text };
    }

    async analyzeMedia(
        prompt: string,
        base64Data: string,
        mimeType: string
    ): Promise<any> {
        if (!this.currentProvider) {
            throw new Error('No AI provider available. Please configure one in Settings.');
        }

        const response = await this.currentProvider.analyzeMedia(prompt, base64Data, mimeType);
        return { text: response.text };
    }

    async performLegalResearch(
        prompt: string,
        documentContent?: string
    ): Promise<any> {
        if (!this.currentProvider) {
            throw new Error('No AI provider available. Please configure one in Settings.');
        }

        if (documentContent) {
            const messages: ChatMessage[] = [
                {
                    role: 'system',
                    content: 'You are an expert legal researcher. Provide detailed, accurate answers based on the document provided.',
                },
                {
                    role: 'user',
                    content: `Based on the following document, please answer this question: "${prompt}"\n\n--- DOCUMENT ---\n${documentContent}`,
                },
            ];
            const response = await this.currentProvider.generateChatResponse(messages);
            return { text: response.text };
        } else {
            const response = await this.currentProvider.performResearch?.(prompt);
            return { text: response?.text || 'Research not supported by this provider' };
        }
    }

    async generateCaseIntakePrompts(jurisdiction: 'federal' | 'florida'): Promise<any> {
        if (!this.currentProvider) {
            throw new Error('No AI provider available.');
        }

        const messages: ChatMessage[] = [
            {
                role: 'user',
                content: `Generate a short checklist of key questions and topics a defense attorney should cover when writing a case summary for a new criminal case in ${jurisdiction} jurisdiction. Focus on the most critical information needed for an initial case file.`,
            },
        ];

        const response = await this.currentProvider.generateChatResponse(messages);
        return { text: response.text };
    }

    async extractCaseFactsFromFile(document: { content: string; mimeType: string }): Promise<any> {
        if (!this.currentProvider) {
            throw new Error('No AI provider available.');
        }

        // For media files, use analyzeMedia
        if (document.mimeType.startsWith('image/') || document.mimeType.startsWith('video/')) {
            return this.analyzeMedia(
                'You are an expert paralegal. Analyze this document and extract a concise summary of the case facts. Focus on key events, dates, individuals, and alleged offenses.',
                document.content,
                document.mimeType
            );
        }

        // For text, use chat
        const messages: ChatMessage[] = [
            {
                role: 'system',
                content: 'You are an expert paralegal. Extract concise, well-structured summaries of case facts.',
            },
            {
                role: 'user',
                content: `Please extract the case facts from this document:\n\n${document.content}`,
            },
        ];

        const response = await this.currentProvider.generateChatResponse(messages);
        return { text: response.text };
    }

    async generateLegalDocument(
        caseFile: CaseFile,
        motionType: string,
        factualBasis: string
    ): Promise<any> {
        if (!this.currentProvider) {
            throw new Error('No AI provider available.');
        }

        const context = this.buildCaseContext(caseFile);
        const messages: ChatMessage[] = [
            {
                role: 'system',
                content: 'You are an expert defense paralegal drafting legal motions. Your response MUST be only the text of the legal motion itself, properly formatted. Cite relevant case law and statutes based on the specified jurisdiction.',
            },
            {
                role: 'user',
                content: `Case Context:\n${context}\n\n---\nDraft a "${motionType}".\nFactual Basis: ${factualBasis}\n---\nGenerate the full text of the motion now.`,
            },
        ];

        const response = await this.currentProvider.generateChatResponse(messages, {
            temperature: 0.3,
            maxTokens: 8000,
        });

        return { text: response.text };
    }

    async analyzeDiscoveryEvidence(
        caseFile: CaseFile,
        document: DiscoveryDocument,
        prompt: string
    ): Promise<any> {
        if (!this.currentProvider) {
            throw new Error('No AI provider available.');
        }

        const context = this.buildCaseContext(caseFile);

        // For images/video, use analyzeMedia
        if (document.mimeType.startsWith('image/') || document.mimeType.startsWith('video/')) {
            const fullPrompt = `Case Context:\n${context}\n\n---\nAnalysis Request: "${prompt}"\n---\nAnalyze the attached discovery document now.`;
            return this.analyzeMedia(fullPrompt, document.content, document.mimeType);
        }

        // For text documents
        const messages: ChatMessage[] = [
            {
                role: 'system',
                content: 'You are an expert defense paralegal analyzing discovery evidence. Provide clear, concise analysis based on the full case context.',
            },
            {
                role: 'user',
                content: `Case Context:\n${context}\n\n---\nDocument Content:\n${document.content}\n\n---\nAnalysis Request: "${prompt}"\n---\nProvide your analysis now.`,
            },
        ];

        const response = await this.currentProvider.generateChatResponse(messages);
        return { text: response.text };
    }

    private buildCaseContext(caseFile: CaseFile): string {
        let context = `Jurisdiction: ${caseFile.jurisdiction}\nCase Facts Summary: ${caseFile.caseFacts}`;

        if (caseFile.motions.length > 0) {
            context += `\n\nExisting Motions in File:\n` + caseFile.motions.map(m => `- ${m.type}`).join('\n');
        }
        if (caseFile.discoveryDocuments.length > 0) {
            context += `\n\nExisting Discovery Documents:\n` + caseFile.discoveryDocuments.map(d => `- ${d.name} (${d.mimeType})`).join('\n');
        }
        return context;
    }

    // Provider-specific methods

    setGroqApiKey(apiKey: string): void {
        this.groqService.setApiKey(apiKey);
    }

    async getOllamaModels(): Promise<string[]> {
        return this.ollamaService.getAvailableModels();
    }

    setOllamaModel(modelName: string): void {
        this.ollamaService.setModel(modelName);
    }
}
