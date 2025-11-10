import { ChangeDetectionStrategy, Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';

type AnalyzerMode = 'upload' | 'record';
type RecordingState = 'idle' | 'recording' | 'stopped';

@Component({
  selector: 'app-evidence-analyzer',
  templateUrl: './evidence-analyzer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class EvidenceAnalyzerComponent implements OnDestroy {
  private geminiService = inject(GeminiService);

  mode = signal<AnalyzerMode>('upload');
  prompt = signal<string>('');
  file = signal<File | null>(null);
  filePreview = signal<string | null>(null);
  fileType = signal<'image' | 'video' | 'audio' | 'other' | null>(null);
  
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  result = signal<string | null>(null);
  
  // Audio recording state
  recordingState = signal<RecordingState>('idle');
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  audioUrl = signal<string | null>(null);

  analysisPlaceholder = computed(() => {
    switch (this.fileType()) {
      case 'image':
        return 'e.g., Describe this image in detail. Are there any signs of tampering?';
      case 'video':
        return 'e.g., What are the key events in this video? Transcribe any speech.';
      case 'audio':
        return 'e.g., Transcribe the speech in this audio file. Identify the speakers.';
      default:
        return 'Select a file and provide a prompt for analysis...';
    }
  });

  analysisButtonText = computed(() => {
    switch (this.fileType()) {
      case 'image':
        return 'Analyze Image';
      case 'video':
        return 'Analyze Video';
      case 'audio':
        return 'Analyze Audio';
      default:
        return 'Analyze';
    }
  });


  ngOnDestroy() {
    this.stopRecordingStream();
  }

  setMode(newMode: AnalyzerMode) {
    this.resetState();
    this.mode.set(newMode);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const selectedFile = input.files[0];
      this.file.set(selectedFile);
      this.result.set(null);
      this.error.set(null);

      if (selectedFile.type.startsWith('image/')) {
        this.fileType.set('image');
        this.generatePreview(selectedFile);
      } else if (selectedFile.type.startsWith('video/')) {
        this.fileType.set('video');
        this.generatePreview(selectedFile);
      } else if (selectedFile.type.startsWith('audio/')) {
        this.fileType.set('audio');
        this.generatePreview(selectedFile);
      } else {
        this.fileType.set('other');
        this.filePreview.set(null);
      }
    }
  }

  private generatePreview(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => this.filePreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  }

  async analyzeFile() {
    const currentFile = this.file();
    const currentPrompt = this.prompt().trim();
    if (!currentFile || !currentPrompt) {
      this.error.set('Please select a file and enter a prompt.');
      return;
    }
    
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    
    try {
      const base64Data = await this.fileToBase64(currentFile);
      const response = await this.geminiService.analyzeMedia(currentPrompt, base64Data, currentFile.type);
      this.result.set(response.text);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      this.error.set(`Failed to analyze file: ${errorMessage}`);
    } finally {
      this.loading.set(false);
    }
  }

  async startRecording() {
    if (this.recordingState() === 'recording') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = event => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        this.audioUrl.set(audioUrl);
        const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
        this.file.set(audioFile);
        this.fileType.set('audio');
        this.prompt.set('Transcribe this audio recording.');
      };

      this.mediaRecorder.start();
      this.recordingState.set('recording');
      this.resetState(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      this.error.set("Could not start recording. Please ensure microphone permissions are granted.");
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.recordingState() === 'recording') {
      this.mediaRecorder.stop();
      this.recordingState.set('stopped');
      this.stopRecordingStream();
    }
  }

  private stopRecordingStream() {
    if(this.mediaRecorder && this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }

  resetState(keepRecordingState: boolean = false) {
    this.prompt.set('');
    this.file.set(null);
    this.filePreview.set(null);
    this.fileType.set(null);
    this.loading.set(false);
    this.error.set(null);
    this.result.set(null);
    this.audioUrl.set(null);
    if (!keepRecordingState) {
      this.recordingState.set('idle');
      this.audioChunks = [];
    }
  }
}