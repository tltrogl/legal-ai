
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { GroundingChunk } from '@google/genai';

interface ResearchMessage {
  role: 'user' | 'model';
  text: string;
  sources?: GroundingChunk[];
}

@Component({
  selector: 'app-legal-research',
  templateUrl: './legal-research.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class LegalResearchComponent {
  private geminiService = inject(GeminiService);

  prompt = signal<string>('');
  file = signal<File | null>(null);
  
  history = signal<ResearchMessage[]>([
    {
      role: 'model',
      text: 'Hello! I am your legal research assistant. You can ask me legal questions, and I will search for relevant information. You can also upload a document for context-aware research and analysis.',
    }
  ]);

  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const selectedFile = input.files[0];
      if (selectedFile.type.startsWith('text/') || selectedFile.name.endsWith('.md')) {
        this.file.set(selectedFile);
        this.error.set(null);
      } else {
        this.error.set('Please upload a valid text file (.txt, .md). Other formats are not yet supported.');
        this.file.set(null);
      }
      input.value = ''; 
    }
  }
  
  removeFile() {
    this.file.set(null);
  }

  async requestSummary() {
    if (!this.file()) return;
    await this._sendRequest('Please provide a concise summary of the attached document.');
  }

  async sendMessage() {
    const currentPrompt = this.prompt().trim();
    if (!currentPrompt) return;
    await this._sendRequest(currentPrompt);
    this.prompt.set(''); // Clear prompt after sending
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private async _sendRequest(prompt: string) {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const currentFile = this.file();
    let fileContent: string | undefined;
    let userMessageText = prompt;

    if (currentFile) {
      if (prompt === 'Please provide a concise summary of the attached document.') {
        userMessageText = `File: ${currentFile.name}\n\nSummarize this document.`;
      } else {
        userMessageText = `File: ${currentFile.name}\n\n${prompt}`;
      }
    }

    const userMessage: ResearchMessage = { role: 'user', text: userMessageText };
    this.history.update(h => [...h, userMessage]);

    try {
      if (currentFile) {
        fileContent = await this.readFileAsText(currentFile);
      }

      const response = await this.geminiService.performLegalResearch(prompt, fileContent);
      const modelMessage: ResearchMessage = {
        role: 'model',
        text: response.text,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
      };
      this.history.update(h => [...h, modelMessage]);

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      this.error.set(`Failed to get response: ${errorMessage}`);
      const modelMessage: ResearchMessage = { role: 'model', text: `Sorry, I encountered an error. Please try again. \n\n<${errorMessage}>` };
      this.history.update(h => [...h, modelMessage]);
    } finally {
      this.loading.set(false);
    }
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }
}