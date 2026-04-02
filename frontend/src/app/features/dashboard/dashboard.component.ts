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
import { AuthService } from '../../core/auth/auth.service';
import { BottomDrawerComponent } from './components/bottom-drawer/bottom-drawer.component';
import { BlockListComponent } from './components/block-list/block-list.component';
import { GlobalSearchBarComponent } from './components/global-search-bar/global-search-bar.component';
import { PanelTagsBarComponent } from './components/panel-tags-bar/panel-tags-bar.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { WorkspaceSidebarComponent } from './components/workspace-sidebar/workspace-sidebar.component';
import {
  BlockContentChangePayload,
  BlocksReorderPayload,
  ChecklistItemKeydownPayload,
  ChecklistItemPriorityPayload,
  ChecklistItemTextPayload,
  ChecklistTogglePayload,
  BlockFocusRequest,
  TextLikeFieldKeydownPayload,
} from './models/block';
import { GlobalSearchService } from './services/global-search.service';
import { DashboardService } from './services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AsyncPipe,
    WorkspaceSidebarComponent,
    GlobalSearchBarComponent,
    ThemeToggleComponent,
    PanelTagsBarComponent,
    BlockListComponent,
    BottomDrawerComponent,
  ],
  providers: [DashboardService, GlobalSearchService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly dashboard = inject(DashboardService);
  readonly authService = inject(AuthService);
  private readonly blocksApi = inject(BlocksApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  readonly blocks$ = this.dashboard.blocks$;
  readonly reorderMode = signal(false);

  constructor() {
    this.dashboard.focusRequest$.pipe(takeUntilDestroyed()).subscribe((request) => {
      queueMicrotask(() => this.focusDashboardTarget(request));
    });

    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      this.blocksApi
        .getBlocks()
        .pipe(take(1), takeUntilDestroyed(this.destroyRef))
        .subscribe((blocks) => this.dashboard.loadBlocksFromApi(blocks));
    });
  }

  toggleReorderMode(): void {
    this.reorderMode.update((v) => !v);
  }

  onBlocksReordered(payload: BlocksReorderPayload): void {
    this.dashboard.reorderBlocks(payload.previousIndex, payload.currentIndex);
  }

  onTextLikeContent(payload: BlockContentChangePayload): void {
    this.dashboard.updateBlockContent(payload.blockId, payload.content);
  }

  onTextLikeFieldKeydown(payload: TextLikeFieldKeydownPayload): void {
    this.dashboard.handleBlockKeydown(
      payload.blockId,
      payload.keyboardEvent,
      payload.snapshot,
    );
  }

  onChecklistToggle(payload: ChecklistTogglePayload): void {
    this.dashboard.toggleChecklistItem(payload.blockId, payload.itemIndex);
  }

  onChecklistItemText(payload: ChecklistItemTextPayload): void {
    this.dashboard.updateChecklistItemText(
      payload.blockId,
      payload.itemIndex,
      payload.text,
    );
  }

  onChecklistItemKeydown(payload: ChecklistItemKeydownPayload): void {
    this.dashboard.handleChecklistItemKeydown(
      payload.blockId,
      payload.itemIndex,
      payload.keyboardEvent,
      payload.snapshot,
    );
  }

  onChecklistItemPriority(payload: ChecklistItemPriorityPayload): void {
    this.dashboard.updateChecklistItemPriority(
      payload.blockId,
      payload.itemIndex,
      payload.priority ?? undefined,
    );
  }

  private focusDashboardTarget(request: BlockFocusRequest): void {
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
