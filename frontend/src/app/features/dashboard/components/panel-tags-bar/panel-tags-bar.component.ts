import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs/operators';
import { Panel } from '../../models/panel.model';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-panel-tags-bar',
  standalone: true,
  imports: [AsyncPipe, FormsModule],
  templateUrl: './panel-tags-bar.component.html',
  styleUrl: './panel-tags-bar.component.scss',
})
export class PanelTagsBarComponent {
  readonly dashboard = inject(DashboardService);

  readonly activePanel$ = this.dashboard.workspace$.pipe(
    map((workspace) => {
      const match = workspace.pages.find(
        (page) => page.id === workspace.activePageId,
      );
      return match ?? null;
    }),
  );

  draft = '';

  onAddTag(panel: Panel): void {
    const value = this.draft.trim();
    if (value === '') {
      return;
    }
    this.dashboard.addTagToPanel(panel.id, value);
    this.draft = '';
  }

  onRemoveTag(panel: Panel, tag: string): void {
    this.dashboard.removeTagFromPanel(panel.id, tag);
  }

  onFormSubmit(panel: Panel, event: Event): void {
    event.preventDefault();
    this.onAddTag(panel);
  }
}
