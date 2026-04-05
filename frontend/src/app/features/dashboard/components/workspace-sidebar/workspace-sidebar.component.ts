import { AsyncPipe } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-workspace-sidebar',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './workspace-sidebar.component.html',
  styleUrl: './workspace-sidebar.component.scss',
})
export class WorkspaceSidebarComponent {
  readonly dashboard = inject(DashboardService);

  readonly workspace$ = this.dashboard.workspace$;

  /** Emitted after a navigation action so the parent can close the mobile drawer. */
  readonly mobileCloseRequest = output<void>();

  selectPageAndCloseMobile(pageId: string): void {
    this.dashboard.selectPage(pageId);
    this.mobileCloseRequest.emit();
  }

  addPageAndCloseMobile(): void {
    this.dashboard.addPage();
    this.mobileCloseRequest.emit();
  }
}
