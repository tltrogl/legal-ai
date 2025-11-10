import { ChangeDetectionStrategy, Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { CaseFileService } from '../../services/case-file.service';
import { NavigationService } from '../../services/navigation.service';
import { CaseFile, Motion, DiscoveryDocument, DiscoveryAnalysis } from '../../models/case-file.model';

type ViewMode = 'dashboard' | 'workspace';
type WorkspaceTab = 'motions' | 'discovery';

@Component({
  selector: 'app-case-management',
  templateUrl: './case-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class CaseManagementComponent implements OnInit {
  private geminiService = inject(GeminiService);
  private caseFileService = inject(CaseFileService);
  private navigationService = inject(NavigationService);

  view = signal<ViewMode>('dashboard');
  workspaceTab = signal<WorkspaceTab>('motions');
  
  // Dashboard State
  caseFiles = signal<CaseFile[]>([]);
  
  // New Case "Wizard" State
  newCaseName = signal<string>('');
  newJurisdiction = signal<'federal' | 'florida'>('federal');
  newCaseFacts = signal<string>('');

  // Workspace State
  activeCase = signal<CaseFile | null>(null);
  
  // Motion State
  selectedMotion = signal<Motion | null>(null);
  motionType = signal<string>('Motion to Suppress Evidence');
  factualBasis = signal<string>('');
  
  // Discovery State
  selectedDocument = signal<DiscoveryDocument | null>(null);
  selectedAnalysis = signal<DiscoveryAnalysis | null>(null);
  discoveryPrompt = signal<string>('');
  
  // UI State
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  constructor() {
    effect(() => {
      const caseIdToLoad = this.navigationService.caseToLoad();
      if (caseIdToLoad && this.activeCase()?.id !== caseIdToLoad) {
        this.loadCase(caseIdToLoad);
      }
    });
  }

  ngOnInit() {
    this.loadCases();
  }

  loadCases() {
    this.caseFiles.set(this.caseFileService.getCaseFiles());
  }

  createCase() {
    if (this.newCaseName().trim() && this.newCaseFacts().trim()) {
      const newCase = this.caseFileService.saveNewCase({
        name: this.newCaseName(),
        jurisdiction: this.newJurisdiction(),
        caseFacts: this.newCaseFacts()
      });
      this.loadCases();
      this.loadCase(newCase.id);
      
      this.newCaseName.set('');
      this.newCaseFacts.set('');
      this.newJurisdiction.set('federal');
    }
  }
  
  loadCase(id: string) {
    const caseFile = this.caseFileService.getCaseFile(id);
    if (caseFile) {
      this.activeCase.set(caseFile);
      this.resetMotionForm();
      this.resetDiscoveryState();
      this.view.set('workspace');
      this.workspaceTab.set('motions');
    }
  }

  deleteCase(id: string, event: MouseEvent) {
    event.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this case file?')) {
      this.caseFileService.deleteCaseFile(id);
      this.loadCases();
    }
  }

  backToDashboard() {
    this.view.set('dashboard');
    this.activeCase.set(null);
    this.navigationService.caseToLoad.set(null); // Clear the loading signal
    this.loadCases();
  }

  exportCaseFile() {
    const caseFile = this.activeCase();
    if (!caseFile) return;

    const caseJson = JSON.stringify(caseFile, null, 2);
    const blob = new Blob([caseJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseFile.name.replace(/ /g, '_')}_export.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async onFileSelectedForImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      const fileContent = await file.text();
      const caseFileToImport = JSON.parse(fileContent) as CaseFile;
      // Basic validation
      if (caseFileToImport.id && caseFileToImport.name && caseFileToImport.caseFacts) {
        this.caseFileService.importCaseFile(caseFileToImport);
        this.loadCases();
      } else {
        throw new Error('Invalid case file format.');
      }
    } catch (e) {
      this.handleError(e, 'Failed to import case file');
    } finally {
      this.loading.set(false);
      input.value = ''; // Reset file input
    }
  }

  // Motion Methods
  async generateMotion() {
    const currentCase = this.activeCase();
    if (!this.factualBasis().trim() || !currentCase) return;

    this.loading.set(true);
    this.error.set(null);
    this.selectedMotion.set(null);

    try {
      const response = await this.geminiService.generateLegalDocument(
        currentCase, this.motionType(), this.factualBasis()
      );
      const newMotion: Motion = {
        id: self.crypto.randomUUID(), type: this.motionType(), factualBasis: this.factualBasis(),
        generatedText: response.text, createdAt: new Date().toISOString()
      };
      currentCase.motions.unshift(newMotion);
      this.activeCase.set(this.caseFileService.updateCaseFile(currentCase));
      this.selectedMotion.set(newMotion);
      this.resetMotionForm();
    } catch (e) { this.handleError(e, 'Failed to generate motion'); } 
      finally { this.loading.set(false); }
  }
  
  viewMotion(motion: Motion) { this.selectedMotion.set(motion); }
  copyMotionText() { if (this.selectedMotion()?.generatedText) navigator.clipboard.writeText(this.selectedMotion()!.generatedText); }

  // Discovery Methods
  async onFileSelectedForDiscovery(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.activeCase()) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      let content: string;
      const mimeType = file.type;

      if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
        content = await this.fileToBase64(file);
      } else if (mimeType === 'application/pdf') {
        content = await this.readPdfAsText(file);
      } else {
        content = await file.text();
      }

      const newDocument: DiscoveryDocument = {
        id: self.crypto.randomUUID(), name: file.name, content, mimeType, analyses: []
      };

      const currentCase = this.activeCase()!;
      currentCase.discoveryDocuments.unshift(newDocument);
      this.activeCase.set(this.caseFileService.updateCaseFile(currentCase));
      this.selectDocument(newDocument);

    } catch (e) { this.handleError(e, 'Failed to process file'); }
      finally { this.loading.set(false); }
    
    input.value = ''; // Reset file input
  }

  async runDiscoveryAnalysis() {
    const currentCase = this.activeCase();
    const currentDoc = this.selectedDocument();
    if (!this.discoveryPrompt().trim() || !currentDoc || !currentCase) return;
    
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const response = await this.geminiService.analyzeDiscoveryEvidence(
        currentCase, currentDoc, this.discoveryPrompt()
      );
      const newAnalysis: DiscoveryAnalysis = {
        id: self.crypto.randomUUID(), prompt: this.discoveryPrompt(),
        result: response.text, createdAt: new Date().toISOString()
      };

      currentDoc.analyses.unshift(newAnalysis);
      this.activeCase.set(this.caseFileService.updateCaseFile(currentCase));
      this.selectAnalysis(newAnalysis);
      this.discoveryPrompt.set('');

    } catch (e) { this.handleError(e, 'Failed to run analysis'); }
      finally { this.loading.set(false); }
  }

  selectDocument(doc: DiscoveryDocument) {
    this.selectedDocument.set(doc);
    this.selectedAnalysis.set(doc.analyses[0] || null);
    this.error.set(null);
  }

  selectAnalysis(analysis: DiscoveryAnalysis) { this.selectedAnalysis.set(analysis); }

  // Private Helper Methods
  private resetMotionForm() {
    this.motionType.set('Motion to Suppress Evidence');
    this.factualBasis.set('');
    this.selectedMotion.set(this.activeCase()?.motions[0] || null);
    this.error.set(null);
  }

  private resetDiscoveryState() {
    this.selectedDocument.set(this.activeCase()?.discoveryDocuments[0] || null);
    this.selectedAnalysis.set(this.selectedDocument()?.analyses[0] || null);
    this.discoveryPrompt.set('');
    this.error.set(null);
  }
  
  private handleError(e: unknown, prefix: string) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    this.error.set(`${prefix}: ${errorMessage}`);
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  }

  private async readPdfAsText(file: File): Promise<string> {
    try {
      // Dynamically import pdfjsLib
      const pdfjsLib = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let textContent = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map((s: any) => s.str).join(' ');
        textContent += '\n\n'; // Page break
      }
      return textContent;
    } catch (error) {
        console.error('Error reading PDF:', error);
        throw new Error('Could not parse the PDF file.');
    }
  }
}