
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeComponent } from './components/home/home.component';
import { CaseChatComponent } from './components/case-chat/case-chat.component';
import { EvidenceAnalyzerComponent } from './components/evidence-analyzer/evidence-analyzer.component';
import { LegalResearchComponent } from './components/legal-research/legal-research.component';
import { CaseManagementComponent } from './components/case-management/case-management.component';
import { NavigationService } from './services/navigation.service';

export type AppTab = 'home' | 'chat' | 'evidence' | 'research' | 'management';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    HomeComponent,
    CaseChatComponent,
    EvidenceAnalyzerComponent,
    LegalResearchComponent,
    CaseManagementComponent,
  ],
})
export class AppComponent {
  private navigationService = inject(NavigationService);
  activeTab = signal<AppTab>('home');

  constructor() {
    effect(() => {
      const caseToLoad = this.navigationService.caseToLoad();
      if (caseToLoad) {
        this.activeTab.set('management');
      }
    });
  }

  selectTab(tab: AppTab) {
    this.activeTab.set(tab);
    // Clear case loading signal if we navigate away manually
    if (tab !== 'management') {
      this.navigationService.caseToLoad.set(null);
    }
  }
}