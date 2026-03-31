import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { BlocksApiService } from '../../core/api/blocks-api.service';
import { BottomDrawerComponent } from './components/bottom-drawer/bottom-drawer.component';
import { BlockListComponent } from './components/block-list/block-list.component';
import { WorkspaceSidebarComponent } from './components/workspace-sidebar/workspace-sidebar.component';
import {
  BlockContentChangePayload,
  BlocksReorderPayload,
  ChecklistItemKeydownPayload,
  ChecklistItemTextPayload,
  ChecklistTogglePayload,
  TextLikeFieldKeydownPayload,
} from './models/block-ui-payloads.model';
import { EditorFocusRequest, EditorService } from './services/editor.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AsyncPipe,
    WorkspaceSidebarComponent,
    BlockListComponent,
    BottomDrawerComponent,
  ],
  providers: [EditorService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly editor = inject(EditorService);

  private readonly blocksApi = inject(BlocksApiService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly platformId = inject(PLATFORM_ID);

  readonly blocks$ = this.editor.blocks$;

  readonly reorderMode = signal(false);

  constructor() {
    this.editor.focusRequest$.pipe(takeUntilDestroyed()).subscribe((request) => {
      queueMicrotask(() => this.focusEditorTarget(request));
    });

    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      this.blocksApi
        .getBlocks()
        .pipe(take(1), takeUntilDestroyed(this.destroyRef))
        .subscribe((blocks) => this.editor.loadBlocksFromApi(blocks));
    });
  }

  toggleReorderMode(): void {
    this.reorderMode.update((v) => !v);
  }

  onBlocksReordered(payload: BlocksReorderPayload): void {
    this.editor.reorderBlocks(payload.previousIndex, payload.currentIndex);
  }

  onTextLikeContent(payload: BlockContentChangePayload): void {
    this.editor.updateBlockContent(payload.blockId, payload.content);
  }

  onTextLikeFieldKeydown(payload: TextLikeFieldKeydownPayload): void {
    this.editor.handleBlockKeydown(
      payload.blockId,
      payload.keyboardEvent,
      payload.snapshot,
    );
  }

  onChecklistToggle(payload: ChecklistTogglePayload): void {
    this.editor.toggleChecklistItem(payload.blockId, payload.itemIndex);
  }

  onChecklistItemText(payload: ChecklistItemTextPayload): void {
    this.editor.updateChecklistItemText(
      payload.blockId,
      payload.itemIndex,
      payload.text,
    );
  }

  onChecklistItemKeydown(payload: ChecklistItemKeydownPayload): void {
    this.editor.handleChecklistItemKeydown(
      payload.blockId,
      payload.itemIndex,
      payload.keyboardEvent,
      payload.snapshot,
    );
  }

  private focusEditorTarget(request: EditorFocusRequest): void {
    if (typeof document === 'undefined') {
      return;
    }
    const selector =
      request.checklistItemIndex !== undefined
        ? `[data-block-id="${CSS.escape(request.blockId)}"][data-checklist-item="${request.checklistItemIndex}"]`
        : `textarea[data-block-id="${CSS.escape(request.blockId)}"]`;
    const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      selector,
    );
    if (!el) {
      return;
    }
    el.focus();
    const length = el.value.length;
    el.setSelectionRange(length, length);
  }
}
