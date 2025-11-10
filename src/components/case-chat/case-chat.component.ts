import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { ChatMessage } from '../../models/chat.model';

@Component({
  selector: 'app-case-chat',
  templateUrl: './case-chat.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class CaseChatComponent {
  private geminiService = inject(GeminiService);

  prompt = signal<string>('');
  history = signal<ChatMessage[]>([
    {
      role: 'model',
      parts: [{ text: 'Hello! I am Lexi, your AI legal assistant. How can I help you analyze your case today?' }],
    },
  ]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  useDeepAnalysis = signal<boolean>(true);

  placeholderText = computed(() =>
    this.useDeepAnalysis()
      ? 'Ask a complex question with deep analysis...'
      : 'Ask a quick question...'
  );

  async sendMessage() {
    const currentPrompt = this.prompt().trim();
    if (!currentPrompt || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: currentPrompt }] };
    this.history.update(h => [...h, userMessage]);
    this.prompt.set('');

    try {
      const pastMessages = this.history().slice(0, -1); // Don't include the latest user message
      const response = await this.geminiService.generateChatResponse(pastMessages, currentPrompt, this.useDeepAnalysis());
      const modelMessage: ChatMessage = { role: 'model', parts: [{ text: response.text }] };
      this.history.update(h => [...h, modelMessage]);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      this.error.set(`Failed to get response: ${errorMessage}`);
      // Add error message to history to inform user
       const modelMessage: ChatMessage = { role: 'model', parts: [{ text: `Sorry, I encountered an error. Please try again. \n\n<${errorMessage}>` }] };
       this.history.update(h => [...h, modelMessage]);
    } finally {
      this.loading.set(false);
    }
  }

  toggleDeepAnalysis() {
    this.useDeepAnalysis.update(v => !v);
  }
}
