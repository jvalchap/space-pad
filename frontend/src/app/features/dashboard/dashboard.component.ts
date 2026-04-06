import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, EMPTY, map, of, switchMap, take } from 'rxjs';
import { DashboardsApiService } from '../../core/api/dashboards-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { BottomDrawerComponent } from './components/bottom-drawer/bottom-drawer.component';
import { DashboardBoardComponent } from './components/dashboard-board/dashboard-board.component';
import { DashboardToolbarComponent } from './components/dashboard-toolbar/dashboard-toolbar.component';
import { BlockListComponent } from './components/block-list/block-list.component';
import { GlobalSearchBarComponent } from './components/global-search-bar/global-search-bar.component';
import {
  NewDashboardDialogComponent,
  type NewDashboardDraft,
} from './components/new-dashboard-dialog/new-dashboard-dialog.component';
import { UserMenuComponent } from './components/user-menu/user-menu.component';
import { WorkspaceSidebarComponent } from './components/workspace-sidebar/workspace-sidebar.component';
import {
  BlockContentChangePayload,
  BlocksReorderPayload,
  ChecklistItemKeydownPayload,
  ChecklistItemPriorityPayload,
  ChecklistItemTextPayload,
  ChecklistTogglePayload,
  BlockPresetId,
  BlockFocusRequest,
  BlockType,
  type Block,
  type CardBlock,
  TextLikeFieldKeydownPayload,
} from './models/block';
import { DashboardTypeApi } from './models/dashboard-type.model';
import { GlobalSearchService } from './services/global-search.service';
import { ToolbarMode } from './models/toolbar.model';
import { DashboardService } from './services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AsyncPipe,
    WorkspaceSidebarComponent,
    GlobalSearchBarComponent,
    UserMenuComponent,
    BlockListComponent,
    DashboardBoardComponent,
    DashboardToolbarComponent,
    NewDashboardDialogComponent,
    BottomDrawerComponent,
  ],
  providers: [DashboardService, GlobalSearchService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly dashboard = inject(DashboardService);
  private readonly dashboardsApi = inject(DashboardsApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly blocks$ = this.dashboard.blocks$;
  readonly workspaceLoading = signal(false);
  readonly workspaceError = signal<string | null>(null);
  readonly newDashboardOpen = signal(false);
  readonly toolbarMode = signal<ToolbarMode>('default');
  readonly selectedBlockIds = signal<string[]>([]);
  readonly reorderMode = computed(() => this.toolbarMode() === 'reorder');
  readonly selectMode = computed(() => this.toolbarMode() === 'select');

  readonly mobileSidebarOpen = signal(false);

  readonly blocksSignal = toSignal(this.dashboard.blocks$, {
    initialValue: [] as Block[],
  });
  readonly activeDashboardType = toSignal(
    this.dashboard.workspace$.pipe(
      map((workspace) => {
        const page = workspace.pages.find((panel) => panel.id === workspace.activePageId);
        return page?.dashboardType ?? DashboardTypeApi.Default;
              }),
      ),
    { initialValue: DashboardTypeApi.Default },
  );
  readonly isBoardDashboard = computed(() => this.activeDashboardType() === DashboardTypeApi.Board);
  readonly cardBlocks = computed(() =>
    this.blocksSignal().filter((block): block is CardBlock => block.type === BlockType.Card),
  );

  constructor() {
    this.dashboard.focusRequest$.pipe(takeUntilDestroyed()).subscribe((request) => {
      queueMicrotask(() => this.focusDashboardTarget(request));
    });

    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      this.bootstrapWorkspace();

      const syncMobileSidebarToViewport = (): void => {
        if (window.matchMedia('(min-width: 769px)').matches) {
          this.mobileSidebarOpen.set(false);
        }
      };
      window.addEventListener('resize', syncMobileSidebarToViewport);
      this.destroyRef.onDestroy(() =>
        window.removeEventListener('resize', syncMobileSidebarToViewport),
      );
    });
  }

  private bootstrapWorkspace(): void {
    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login']);
      return;
    }
    const user = this.authService.user();
    if (user === null) {
      void this.router.navigate(['/login']);
      return;
    }
    this.workspaceError.set(null);
    this.workspaceLoading.set(true);
    this.dashboardsApi
      .getDashboardsForUser(user.id)
      .pipe(
        take(1),
        switchMap((list) => {
          this.dashboard.setWorkspaceFromSummaries(list);
          const activeId = this.dashboard.getActivePageId();
          if (activeId === '') {
            return of(null);
          }
          return this.dashboardsApi.getDashboard(activeId);
        }),
        catchError((error: unknown) => {
          this.workspaceError.set(this.formatWorkspaceError(error));
          this.workspaceLoading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (detail) => {
          if (detail !== null) {
            this.dashboard.applyDashboardDetail(detail);
          }
          this.workspaceLoading.set(false);
        },
      });
  }

  private refreshActiveDashboard(): void {
    const dashboardId = this.dashboard.getActivePageId();
    if (dashboardId === '') {
      return;
    }
    this.workspaceError.set(null);
    this.workspaceLoading.set(true);
    this.dashboardsApi
      .getDashboard(dashboardId)
      .pipe(
        take(1),
        catchError((error: unknown) => {
          this.workspaceError.set(this.formatWorkspaceError(error));
          this.workspaceLoading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (detail) => {
          this.dashboard.applyDashboardDetail(detail);
          this.workspaceLoading.set(false);
        },
      });
  }

  onSidebarPageSelect(pageId: string): void {
    this.dashboard.selectPage(pageId);
    this.refreshActiveDashboard();
  }

  openNewDashboardDialog(): void {
    this.newDashboardOpen.set(true);
  }

  closeNewDashboardDialog(): void {
    this.newDashboardOpen.set(false);
  }

  onCreateDashboardFromDialog(draft: NewDashboardDraft): void {
    const user = this.authService.user();
    if (user === null) {
      void this.router.navigate(['/login']);
      return;
    }
    this.workspaceError.set(null);
    this.workspaceLoading.set(true);
    this.dashboardsApi
      .createDashboard({
        title: draft.title,
        type: draft.type,
        userId: user.id,
      })
      .pipe(
        take(1),
        catchError((error: unknown) => {
          this.workspaceError.set(this.formatWorkspaceError(error));
          this.workspaceLoading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (summary) => {
          this.dashboard.addRemoteDashboard(summary);
          this.closeNewDashboardDialog();
          this.refreshActiveDashboard();
        },
      });
  }

  dismissWorkspaceError(): void {
    this.workspaceError.set(null);
  }

  private formatWorkspaceError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error;
      if (typeof body === 'object' && body !== null && 'message' in body) {
        const message = (body as { message: unknown }).message;
        if (typeof message === 'string') {
          return message;
        }
        if (Array.isArray(message)) {
          return message.filter((item) => typeof item === 'string').join(' ');
        }
      }
      if (error.status === 0) {
        return 'No se pudo conectar con el servidor. ¿Está el backend en marcha (p. ej. puerto 3000)?';
      }
      if (error.status === 401 || error.status === 403) {
        return 'Sesión no válida. Vuelve a iniciar sesión.';
      }
      return error.message || `Error del servidor (${String(error.status)}).`;
    }
    return 'Ha ocurrido un error. Inténtalo de nuevo.';
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update((open) => !open);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscapeCloseMobileSidebar(): void {
    if (this.mobileSidebarOpen()) {
      this.closeMobileSidebar();
    }
  }

  onToolbarAddBlock(): void {
    if (this.dashboard.getActivePageId() === '') {
      this.workspaceError.set('Crea o elige un dashboard en la barra lateral antes de añadir contenido.');
      return;
    }
    this.workspaceError.set(null);
    if (this.isBoardDashboard()) {
      this.dashboard
        .addBoardCard()
        .pipe(
          take(1),
          catchError((error: unknown) => {
            this.workspaceError.set(this.formatWorkspaceError(error));
            return EMPTY;
          }),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((block) => {
          if (block !== null) {
            queueMicrotask(() => this.focusDashboardTarget({ blockId: block.id }));
          }
        });
      return;
    }
    this.dashboard.openBlockTypeDrawer();
  }

  onToolbarReorderStart(): void {
    this.toolbarMode.set('reorder');
    this.selectedBlockIds.set([]);
  }

  onToolbarReorderDone(): void {
    this.toolbarMode.set('default');
  }

  onToolbarSelectToggle(): void {
    if (this.toolbarMode() === 'reorder') {
      return;
    }
    if (this.toolbarMode() === 'select') {
      this.toolbarMode.set('default');
      this.selectedBlockIds.set([]);
      return;
    }
    this.toolbarMode.set('select');
    this.selectedBlockIds.set([]);
  }

  onToolbarCancelSelect(): void {
    this.toolbarMode.set('default');
    this.selectedBlockIds.set([]);
  }

  onToolbarDeleteSelected(): void {
    const ids = this.selectedBlockIds();
    if (ids.length === 0) {
      return;
    }
    this.dashboard.removeBlocksByIds(ids);
    this.selectedBlockIds.set([]);
    this.toolbarMode.set('default');
  }

  onToolbarShare(): void {}

  onToolbarMoveSelected(): void {}

  toggleBlockSelection(blockId: string): void {
    this.selectedBlockIds.update((previous) =>
      previous.includes(blockId)
        ? previous.filter((id) => id !== blockId)
        : [...previous, blockId],
    );
  }

  onBlockPresetPicked(presetId: BlockPresetId): void {
    if (this.dashboard.getActivePageId() === '') {
      this.workspaceError.set('Crea o elige un dashboard antes de añadir bloques.');
      this.dashboard.closeBlockTypeDrawer();
      return;
    }
    this.workspaceError.set(null);
    this.dashboard
      .appendBlocksFromDrawerPreset(presetId)
      .pipe(
        take(1),
        catchError((error: unknown) => {
          this.workspaceError.set(this.formatWorkspaceError(error));
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  onBoardLayoutChange(blocks: CardBlock[]): void {
    this.dashboard.applyBoardLayout(blocks);
  }

  onCardTextChange(payload: { blockId: string; text: string }): void {
    this.dashboard.updateCardContent(payload.blockId, payload.text);
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
