/**
 * AI Provider Settings Component
 * 
 * Allows users to configure and switch between FREE AI providers:
 * - Ollama (Local) - 100% free, runs on your computer
 * - Groq API - Free tier with rate limits
 * - ChatGPT Extension - Uses free ChatGPT web interface
 */

import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIProviderService } from '../../services/ai-provider.service';

@Component({
    selector: 'app-ai-settings',
    templateUrl: './ai-settings.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule],
})
export class AISettingsComponent implements OnInit {
    private aiProviderService = inject(AIProviderService);

    currentProvider = signal<string>('ollama');
    availableProviders = signal<Array<{ name: string, available: boolean, cost: string }>>([]);

    // Groq settings
    groqApiKey = signal<string>('');

    // Ollama settings
    ollamaModels = signal<string[]>([]);
    selectedOllamaModel = signal<string>('llama3.1:8b');

    // Status
    loading = signal<boolean>(false);
    message = signal<string>('');
    messageType = signal<'success' | 'error' | 'info'>('info');

    async ngOnInit() {
        await this.loadProviderStatus();
        this.currentProvider.set(this.aiProviderService.getCurrentProvider());
        this.groqApiKey.set(localStorage.getItem('groq_api_key') || '');
    }

    async loadProviderStatus() {
        this.loading.set(true);
        try {
            const providers = await this.aiProviderService.getProviderStatus();
            this.availableProviders.set(providers);
        } catch (e) {
            this.showMessage('Failed to load provider status', 'error');
        } finally {
            this.loading.set(false);
        }
    }

    async selectProvider(providerName: string) {
        this.loading.set(true);
        try {
            await this.aiProviderService.setProvider(providerName);
            this.currentProvider.set(providerName);
            this.showMessage(`Switched to ${providerName}`, 'success');

            // Load provider-specific data
            if (providerName === 'ollama') {
                await this.loadOllamaModels();
            }
        } catch (e) {
            const error = e instanceof Error ? e.message : 'Unknown error';
            this.showMessage(`Failed to switch provider: ${error}`, 'error');
        } finally {
            this.loading.set(false);
        }
    }

    async saveGroqApiKey() {
        if (!this.groqApiKey().trim()) {
            this.showMessage('Please enter a valid API key', 'error');
            return;
        }

        this.loading.set(true);
        try {
            this.aiProviderService.setGroqApiKey(this.groqApiKey());
            await this.loadProviderStatus();
            this.showMessage('Groq API key saved successfully!', 'success');
        } catch (e) {
            this.showMessage('Failed to save API key', 'error');
        } finally {
            this.loading.set(false);
        }
    }

    async loadOllamaModels() {
        try {
            const models = await this.aiProviderService.getOllamaModels();
            this.ollamaModels.set(models);
            if (models.length > 0 && !this.selectedOllamaModel()) {
                this.selectedOllamaModel.set(models[0]);
            }
        } catch (e) {
            this.showMessage('Failed to load Ollama models', 'error');
        }
    }

    async changeOllamaModel() {
        this.loading.set(true);
        try {
            this.aiProviderService.setOllamaModel(this.selectedOllamaModel());
            this.showMessage(`Switched to model: ${this.selectedOllamaModel()}`, 'success');
        } catch (e) {
            this.showMessage('Failed to change model', 'error');
        } finally {
            this.loading.set(false);
        }
    }

    async testConnection(providerName: string) {
        this.loading.set(true);
        try {
            const isAvailable = await this.aiProviderService.testProvider(providerName);
            if (isAvailable) {
                this.showMessage(`${providerName} is working!`, 'success');
            } else {
                this.showMessage(`${providerName} is not available`, 'error');
            }
            await this.loadProviderStatus();
        } catch (e) {
            this.showMessage(`Test failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
        } finally {
            this.loading.set(false);
        }
    }

    private showMessage(text: string, type: 'success' | 'error' | 'info') {
        this.message.set(text);
        this.messageType.set(type);
        setTimeout(() => this.message.set(''), 5000);
    }

    openOllamaGuide() {
        window.open('https://ollama.ai', '_blank');
    }

    openGroqConsole() {
        window.open('https://console.groq.com', '_blank');
    }
}
