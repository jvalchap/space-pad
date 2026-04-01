import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
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
}
