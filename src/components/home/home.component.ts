import { ChangeDetectionStrategy, Component, computed, inject, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CaseFile } from '../../models/case-file.model';
import { CaseFileService } from '../../services/case-file.service';
import { AppTab } from '../../app.component';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class HomeComponent implements OnInit {
  private caseFileService = inject(CaseFileService);
  private navigationService = inject(NavigationService);

  allCases = signal<CaseFile[]>([]);
  recentCases = computed(() => this.allCases().slice(0, 3));
  totalCaseCount = computed(() => this.allCases().length);

  navigateTo = output<AppTab>();

  ngOnInit() {
    this.allCases.set(this.caseFileService.getCaseFiles());
  }

  openCase(caseId: string) {
    this.navigationService.caseToLoad.set(caseId);
  }

  goTo(tab: AppTab) {
    this.navigateTo.emit(tab);
  }
}
