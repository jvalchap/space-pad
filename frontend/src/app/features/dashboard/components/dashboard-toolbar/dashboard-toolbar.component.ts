import { booleanAttribute, Component, input, output } from '@angular/core';
import {
  LucideCheck,
  LucideCheckSquare,
  LucideFolderInput,
  LucideGripVertical,
  LucidePlus,
  LucideShare2,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';
import { ToolbarMode } from '../../models/toolbar.model';
import { ToolbarButtonComponent } from '../toolbar-button/toolbar-button.component';

@Component({
  selector: 'app-dashboard-toolbar',
  standalone: true,
  imports: [
    ToolbarButtonComponent,
    LucidePlus,
    LucideGripVertical,
    LucideCheckSquare,
    LucideShare2,
    LucideCheck,
    LucideTrash2,
    LucideFolderInput,
    LucideX,
  ],
  templateUrl: './dashboard-toolbar.component.html',
  styleUrl: './dashboard-toolbar.component.scss',
})
export class DashboardToolbarComponent {
  readonly mode = input<ToolbarMode>('default');
  readonly selectedCount = input(0);
  readonly selectDisabled = input(false);
  readonly boardMode = input(false, { transform: booleanAttribute });
  readonly addButtonLabel = input('Add block');

  readonly addBlock = output<void>();
  readonly reorderPressed = output<void>();
  readonly reorderDone = output<void>();
  readonly selectPressed = output<void>();
  readonly sharePressed = output<void>();
  readonly cancelSelect = output<void>();
  readonly deleteSelected = output<void>();
  readonly moveSelected = output<void>();

  onAddBlock(): void {
    this.addBlock.emit();
  }

  onReorderClick(): void {
    if (this.mode() === 'reorder') {
      return;
    }
    this.reorderPressed.emit();
  }

  onReorderDone(): void {
    this.reorderDone.emit();
  }

  onSelectClick(): void {
    if (this.selectDisabled()) {
      return;
    }
    this.selectPressed.emit();
  }

  onShare(): void {
    this.sharePressed.emit();
  }

  onCancelSelect(): void {
    this.cancelSelect.emit();
  }

  onDeleteSelected(): void {
    this.deleteSelected.emit();
  }

  onMoveSelected(): void {
    this.moveSelected.emit();
  }

  selectedSummaryLabel(): string {
    const count = this.selectedCount();
    if (count === 1) {
      return '1 selected';
    }
    return `${count} selected`;
  }
}
