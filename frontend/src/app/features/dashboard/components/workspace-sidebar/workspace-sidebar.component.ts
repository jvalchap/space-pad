import { AsyncPipe } from '@angular/common';
import { Component, inject, output, signal } from '@angular/core';
import { LucideMoreVertical, LucideTrash2 } from '@lucide/angular';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-workspace-sidebar',
  standalone: true,
  imports: [AsyncPipe, LucideMoreVertical, LucideTrash2],
  templateUrl: './workspace-sidebar.component.html',
  styleUrl: './workspace-sidebar.component.scss',
})
export class WorkspaceSidebarComponent {
  readonly dashboard = inject(DashboardService);

  readonly workspace$ = this.dashboard.workspace$;
  readonly openMenuForDashboardId = signal<string | null>(null);

  /** Emitted after a navigation action so the parent can close the mobile drawer. */
  readonly mobileCloseRequest = output<void>();
  readonly pageSelect = output<string>();
  readonly newDashboard = output<void>();
  readonly dashboardDelete = output<string>();

  selectPageAndCloseMobile(pageId: string): void {
    this.pageSelect.emit(pageId);
    this.mobileCloseRequest.emit();
    this.openMenuForDashboardId.set(null);
  }

  openNewDashboardAndCloseMobile(): void {
    this.newDashboard.emit();
    this.mobileCloseRequest.emit();
    this.openMenuForDashboardId.set(null);
  }

  toggleMenu(dashboardId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuForDashboardId.update((current) =>
      current === dashboardId ? null : dashboardId,
    );
  }

  requestDelete(dashboardId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuForDashboardId.set(null);
    this.dashboardDelete.emit(dashboardId);
  }
}
