
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CaseChatComponent } from './components/case-chat/case-chat.component';
import { EvidenceAnalyzerComponent } from './components/evidence-analyzer/evidence-analyzer.component';
import { LegalResearchComponent } from './components/legal-research/legal-research.component';
import { CaseManagementComponent } from './components/case-management/case-management.component';

type AppTab = 'chat' | 'evidence' | 'research' | 'management';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CaseChatComponent,
    EvidenceAnalyzerComponent,
    LegalResearchComponent,
    CaseManagementComponent,
  ],
})
export class AppComponent {
  activeTab = signal<AppTab>('chat');

  selectTab(tab: AppTab) {
    this.activeTab.set(tab);
  }
}
