import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { EditorService } from '../../services/editor.service';

@Component({
  selector: 'app-workspace-sidebar',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './workspace-sidebar.component.html',
  styleUrl: './workspace-sidebar.component.scss',
})
export class WorkspaceSidebarComponent {
  readonly editor = inject(EditorService);

  readonly workspace$ = this.editor.workspace$;
}
