import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { CaseFileService } from '../../services/case-file.service';
import { CaseFile, Motion } from '../../models/case-file.model';

type ViewMode = 'dashboard' | 'workspace';

@Component({
  selector: 'app-case-management',
  templateUrl: './case-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class CaseManagementComponent implements OnInit {
  private geminiService = inject(GeminiService);
  private caseFileService = inject(CaseFileService);

  view = signal<ViewMode>('dashboard');
  
  // Dashboard State
  caseFiles = signal<CaseFile[]>([]);
  
  // New Case "Wizard" State
  newCaseName = signal<string>('');
  newJurisdiction = signal<'federal' | 'florida'>('federal');
  newCaseFacts = signal<string>('');

  // Workspace State
  activeCase = signal<CaseFile | null>(null);
  selectedMotion = signal<Motion | null>(null);

  // Motion Generation Form State
  motionType = signal<string>('Motion to Suppress Evidence');
  factualBasis = signal<string>('');
  
  // UI State
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
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
      
      // Reset form
      this.newCaseName.set('');
      this.newCaseFacts.set('');
      this.newJurisdiction.set('federal');
    }
  }
  
  loadCase(id: string) {
    const caseFile = this.caseFileService.getCaseFile(id);
    if (caseFile) {
      this.activeCase.set(caseFile);
      this.selectedMotion.set(null);
      this.resetMotionForm();
      this.view.set('workspace');
    }
  }

  deleteCase(id: string, event: MouseEvent) {
    event.stopPropagation(); // Prevent card click
    if (confirm('Are you sure you want to permanently delete this case file?')) {
      this.caseFileService.deleteCaseFile(id);
      this.loadCases();
    }
  }

  async generateMotion() {
    if (!this.factualBasis().trim() || !this.activeCase()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.selectedMotion.set(null);

    const currentCase = this.activeCase()!;

    try {
      const response = await this.geminiService.generateLegalDocument(
        currentCase.jurisdiction,
        currentCase.name,
        currentCase.caseFacts,
        this.motionType(),
        this.factualBasis()
      );

      const newMotion: Motion = {
        id: self.crypto.randomUUID(),
        type: this.motionType(),
        factualBasis: this.factualBasis(),
        generatedText: response.text,
        createdAt: new Date().toISOString()
      };
      
      currentCase.motions.unshift(newMotion); // Add to beginning of array
      const updatedCase = this.caseFileService.updateCaseFile(currentCase);
      
      this.activeCase.set(updatedCase);
      this.selectedMotion.set(newMotion);
      this.resetMotionForm();

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      this.error.set(`Failed to generate motion: ${errorMessage}`);
    } finally {
      this.loading.set(false);
    }
  }
  
  viewMotion(motion: Motion) {
    this.selectedMotion.set(motion);
  }

  backToDashboard() {
    this.view.set('dashboard');
    this.activeCase.set(null);
    this.loadCases();
  }

  copyMotionText() {
    if (this.selectedMotion()?.generatedText) {
      navigator.clipboard.writeText(this.selectedMotion()!.generatedText);
    }
  }

  private resetMotionForm() {
    this.motionType.set('Motion to Suppress Evidence');
    this.factualBasis.set('');
    this.error.set(null);
  }
}
