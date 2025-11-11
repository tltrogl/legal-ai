import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Switched from GeminiService to AIProviderService (free providers: Ollama/Groq/ChatGPT-ext)
import { AIProviderService } from '../../services/ai-provider.service';
import { ChatMessage, ChatPart } from '../../models/chat.model';

@Component({
  selector: 'app-case-chat',
  templateUrl: './case-chat.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class CaseChatComponent {
  private aiService = inject(AIProviderService);

  prompt = signal<string>('');
  history = signal<ChatMessage[]>([
    {
      role: 'model',
      parts: [{ text: 'Hello! I am Lexi, your AI legal assistant. How can I help you analyze your case today? You can now attach images for analysis.' }],
    },
  ]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  useDeepAnalysis = signal<boolean>(true);

  attachedFile = signal<File | null>(null);
  filePreview = signal<string | null>(null);

  placeholderText = computed(() =>
    this.useDeepAnalysis()
      ? 'Ask a complex question with deep analysis...'
      : 'Ask a quick question...'
  );

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.attachedFile.set(file);
      const reader = new FileReader();
      reader.onload = (e) => this.filePreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
      this.error.set(null);
    } else {
      this.removeFile();
      this.error.set('Please select a valid image file.');
    }
    input.value = '';
  }

  removeFile() {
    this.attachedFile.set(null);
    this.filePreview.set(null);
  }

  async sendMessage() {
    const currentPrompt = this.prompt().trim();
    const currentFile = this.attachedFile();
    if ((!currentPrompt && !currentFile) || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const userParts: ChatPart[] = [];
    if (currentPrompt) {
      userParts.push({ text: currentPrompt });
    }
    if (currentFile) {
      try {
        const base64Data = await this.fileToBase64(currentFile);
        userParts.push({
          inlineData: {
            mimeType: currentFile.type,
            data: base64Data,
          },
        });
      } catch (e) {
        this.handleError(e, 'Failed to read file');
        this.loading.set(false);
        return;
      }
    }

    const userMessage: ChatMessage = { role: 'user', parts: userParts };
    this.history.update((h) => [...h, userMessage]);

    // Reset inputs
    this.prompt.set('');
    this.removeFile();

    try {
      // Initialize provider lazily if not yet selected
      // (Safe to call repeatedly; underlying impl can no-op if already ready.)
      await this.ensureProviderInitialized();
      const pastMessages = this.history().slice(0, -1);
      const response = await this.aiService.generateChatResponse(pastMessages as any, userParts as any, this.useDeepAnalysis());
      const modelMessage: ChatMessage = { role: 'model', parts: [{ text: response.text }] };
      this.history.update((h) => [...h, modelMessage]);
    } catch (e) {
      this.handleError(e, 'Failed to get response');
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      const modelMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: `Sorry, I encountered an error. Please try again. \n\n<${errorMessage}>` }],
      };
      this.history.update((h) => [...h, modelMessage]);
    } finally {
      this.loading.set(false);
    }
  }

  private async ensureProviderInitialized() {
    // If AIProviderService hasn’t selected a provider yet, attempt initialization.
    // We rely on internal logic to pick first available (Ollama → Groq).
    try {
      // @ts-ignore accessing potential initialize if exposed
      if ((this.aiService as any).initialize) {
        await (this.aiService as any).initialize();
      }
    } catch (e) {
      // Non-fatal; downstream call will surface error.
      console.warn('AI provider initialization warning:', e);
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  }

  private handleError(e: unknown, prefix: string) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    this.error.set(`${prefix}: ${errorMessage}`);
  }

  toggleDeepAnalysis() {
    this.useDeepAnalysis.update((v) => !v);
  }
}
