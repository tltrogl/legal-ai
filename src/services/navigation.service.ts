import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  /**
   * Signal to indicate which case should be loaded in the CaseManagementComponent.
   * This is set by other components (like HomeComponent) to trigger navigation.
   */
  caseToLoad = signal<string | null>(null);
}
