import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  EMPTY,
  forkJoin,
  map,
  Observable,
  of,
  Subject,
  tap,
} from 'rxjs';
import { BlocksApiService } from '../../../core/api/blocks-api.service';
import type { DashboardDetailDto, DashboardSummaryDto } from '../../../core/api/dashboards-api.service';
import {
  Block,
  BlockFieldSnapshot,
  BlockFocusRequest,
  BlockPresetId,
  BlockType,
  BoardColumnId,
  CardBlock,
  ChecklistBlock,
  ChecklistItem,
  isBlockType,
  isBoardColumnId,
  isChecklistItemPriority,
  TextBlock,
} from '../models/block';
import { DashboardTypeApi } from '../models/dashboard-type.model';
import { DashboardWorkspaceState } from '../models/dashboard-page.model';
import { Panel } from '../models/panel.model';
import {
  createBlocksForPreset,
  createChecklistBlock,
  createChecklistItem,
  createDefaultEmptyBlocks,
} from './block-factory';

function createEmptyWorkspaceState(): DashboardWorkspaceState {
  return {
    pages: [],
    activePageId: '',
  };
}

@Injectable()
export class DashboardService {
  private readonly blocksApi = inject(BlocksApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly persistTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private readonly workspaceSubject = new BehaviorSubject<DashboardWorkspaceState>(
    createEmptyWorkspaceState(),
  );

  readonly workspace$: Observable<DashboardWorkspaceState> =
    this.workspaceSubject.asObservable();

  readonly blocks$: Observable<Block[]> = this.workspaceSubject.pipe(
    map((s) => {
      const page = s.pages.find((p) => p.id === s.activePageId);
      return page ? [...page.blocks] : [];
    }),
  );

  private readonly globalSearchHighlightSubject = new BehaviorSubject('');
  readonly globalSearchHighlight$: Observable<string> =
    this.globalSearchHighlightSubject.asObservable();

  private readonly focusRequestSubject = new Subject<BlockFocusRequest>();
  readonly focusRequest$ = this.focusRequestSubject.asObservable();

  private readonly blockTypeDrawerOpenSubject = new BehaviorSubject(false);
  readonly blockTypeDrawerOpen$ = this.blockTypeDrawerOpenSubject.asObservable();

  setWorkspaceFromSummaries(rows: readonly DashboardSummaryDto[]): void {
    const pages: Panel[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      blocks: [],
      tags: [],
      dashboardType: row.type,
    }));
    const activePageId = pages.length > 0 ? pages[0].id : '';
    this.workspaceSubject.next({ pages, activePageId });
  }

  applyDashboardDetail(detail: DashboardDetailDto): void {
    const normalized = detail.blocks
      .map((raw) => this.normalizeBlockFromApi(raw))
      .filter((block): block is Block => block !== null);
    const fallbackBlocks =
      detail.type === DashboardTypeApi.Default && normalized.length === 0
        ? [...createDefaultEmptyBlocks()]
        : normalized;
    const s = this.getState();
    const pages = s.pages.map((page) =>
      page.id === detail.id
        ? {
            ...page,
            title: detail.title,
            dashboardType: detail.type,
            blocks: fallbackBlocks,
          }
        : page,
    );
    const hasPage = pages.some((page) => page.id === detail.id);
    const mergedPages = hasPage
      ? pages
      : [
          ...pages,
          {
            id: detail.id,
            title: detail.title,
            blocks: fallbackBlocks,
            tags: [],
            dashboardType: detail.type,
          },
        ];
    this.workspaceSubject.next({
      ...s,
      pages: mergedPages,
      activePageId: detail.id,
    });
  }

  addRemoteDashboard(row: DashboardSummaryDto): void {
    const page: Panel = {
      id: row.id,
      title: row.title,
      blocks: [],
      tags: [],
      dashboardType: row.type,
    };
    const s = this.getState();
    this.workspaceSubject.next({
      pages: [...s.pages, page],
      activePageId: row.id,
    });
  }

  getActivePageId(): string {
    return this.getState().activePageId;
  }

  getActiveDashboardType(): DashboardTypeApi | null {
    const state = this.getState();
    const page = state.pages.find((panel) => panel.id === state.activePageId);
    return page !== undefined ? page.dashboardType : null;
  }

  selectPage(pageId: string): void {
    const s = this.getState();
    if (!s.pages.some((p) => p.id === pageId)) {
      return;
    }
    if (s.activePageId === pageId) {
      return;
    }
    this.workspaceSubject.next({ ...s, activePageId: pageId });
  }

  addTagToPanel(panelId: string, rawTag: string): void {
    const trimmed = rawTag.trim();
    if (trimmed === '') {
      return;
    }
    const s = this.getState();
    const pages = s.pages.map((p) => {
      if (p.id !== panelId) {
        return p;
      }
      const lower = trimmed.toLowerCase();
      if (p.tags.some((tag) => tag.toLowerCase() === lower)) {
        return p;
      }
      return { ...p, tags: [...p.tags, trimmed] };
    });
    this.workspaceSubject.next({ ...s, pages });
  }

  removeTagFromPanel(panelId: string, tag: string): void {
    const s = this.getState();
    const pages = s.pages.map((p) => {
      if (p.id !== panelId) {
        return p;
      }
      const nextTags = p.tags.filter((t) => t !== tag);
      if (nextTags.length === p.tags.length) {
        return p;
      }
      return { ...p, tags: nextTags };
    });
    this.workspaceSubject.next({ ...s, pages });
  }

  setGlobalSearchHighlight(query: string): void {
    this.globalSearchHighlightSubject.next(query.trim());
  }

  clearGlobalSearchHighlight(): void {
    this.globalSearchHighlightSubject.next('');
  }

  focusBlock(blockId: string, checklistItemIndex?: number): void {
    this.requestFocus(blockId, checklistItemIndex);
  }

  openBlockTypeDrawer(): void {
    this.blockTypeDrawerOpenSubject.next(true);
  }

  closeBlockTypeDrawer(): void {
    this.blockTypeDrawerOpenSubject.next(false);
  }

  appendBlocksFromDrawerPreset(presetId: BlockPresetId): Observable<Block[]> {
    this.closeBlockTypeDrawer();
    const dashboardId = this.getActivePageId();
    if (dashboardId === '') {
      return EMPTY;
    }
    const extra = createBlocksForPreset(presetId);
    if (extra.length === 0) {
      return of([]);
    }
    const start = this.getActiveBlocks().length;
    return forkJoin(
      extra.map((block, index) =>
        this.blocksApi.createBlock({
          type: block.type,
          content: this.serializeNewBlockForCreate(block),
          position: start + index,
          dashboardId,
        }),
      ),
    ).pipe(
      map((responses) =>
        responses
          .map((raw) => this.normalizeBlockFromApi(raw))
          .filter((block): block is Block => block !== null),
      ),
      tap((normalized) => {
        const current = this.getActiveBlocks();
        this.setActivePageBlocks([...current, ...normalized]);
        const lastBlock = normalized[normalized.length - 1];
        if (lastBlock !== undefined) {
          this.requestFocusAfterInsert(lastBlock);
        }
      }),
    );
  }

  addBoardCard(): Observable<Block | null> {
    const dashboardId = this.getActivePageId();
    if (dashboardId === '') {
      return of(null);
    }
    const position = this.getActiveBlocks().length;
    return this.blocksApi
      .createBlock({
        type: BlockType.Card,
        content: { text: '', column: BoardColumnId.Todo },
        position,
        dashboardId,
      })
      .pipe(
        map((raw) => this.normalizeBlockFromApi(raw)),
        tap((block) => {
          if (block !== null) {
            this.setActivePageBlocks([...this.getActiveBlocks(), block]);
          }
        }),
      );
  }

  updateCardContent(blockId: string, text: string): void {
    const blocks = this.getActiveBlocks();
    const index = blocks.findIndex((block) => block.id === blockId);
    if (index === -1) {
      return;
    }
    const current = blocks[index];
    if (current.type !== BlockType.Card) {
      return;
    }
    if (current.content === text) {
      return;
    }
    const next = [...blocks];
    next[index] = { ...current, content: text };
    this.setActivePageBlocks(next);
    this.scheduleBlockPersist(next[index] as CardBlock);
  }

  applyBoardLayout(blocks: Block[]): void {
    this.setActivePageBlocks(blocks);
    blocks.forEach((block, index) => {
      if (block.type === BlockType.Card) {
        this.blocksApi
          .patchBlock(block.id, {
            position: index,
            content: { text: block.content, column: block.column },
          })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe();
        return;
      }
      this.blocksApi
        .patchBlock(block.id, { position: index })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    });
  }

  private serializeNewBlockForCreate(block: Block): Record<string, unknown> {
    if (block.type === BlockType.Text) {
      const payload: Record<string, unknown> = { text: block.content };
      if (block.title !== undefined) {
        payload['title'] = block.title;
      }
      return payload;
    }
    if (block.type === BlockType.Checklist) {
      return {
        content: block.content,
        items: block.items,
        ...(block.title !== undefined ? { title: block.title } : {}),
      };
    }
    return {
      text: block.content,
      column: block.column,
    };
  }

  private scheduleBlockPersist(block: Block): void {
    const previousTimer = this.persistTimers.get(block.id);
    if (previousTimer !== undefined) {
      clearTimeout(previousTimer);
    }
    const timer = setTimeout(() => {
      this.persistTimers.delete(block.id);
      let contentPayload: Record<string, unknown>;
      if (block.type === BlockType.Text) {
        contentPayload = { text: block.content };
        if (block.title !== undefined) {
          contentPayload['title'] = block.title;
        }
      } else if (block.type === BlockType.Checklist) {
        contentPayload = {
          content: block.content,
          items: block.items,
          ...(block.title !== undefined ? { title: block.title } : {}),
        };
      } else {
        contentPayload = { text: block.content, column: block.column };
      }
      this.blocksApi
        .patchBlock(block.id, { content: contentPayload })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }, 420);
    this.persistTimers.set(block.id, timer);
  }

  private requestFocusAfterInsert(block: Block): void {
    if (block.type === BlockType.Checklist) {
      this.requestFocus(block.id, 0);
      return;
    }
    this.requestFocus(block.id);
  }

  removeBlocksByIds(blockIds: readonly string[]): void {
    if (blockIds.length === 0) {
      return;
    }
    this.blocksApi
      .deleteBlocks([...blockIds])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const idSet = new Set(blockIds);
        const blocks = this.getActiveBlocks();
        const next = blocks.filter((block) => !idSet.has(block.id));
        if (next.length === blocks.length) {
          return;
        }
        this.setActivePageBlocks(next);
        next.forEach((block, index) => {
          this.blocksApi
            .patchBlock(block.id, { position: index })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        });
      });
  }

  reorderBlocks(previousIndex: number, currentIndex: number): void {
    const blocks = this.getActiveBlocks();
    if (
      previousIndex < 0 ||
      currentIndex < 0 ||
      previousIndex >= blocks.length ||
      currentIndex >= blocks.length
    ) {
      return;
    }
    if (previousIndex === currentIndex) {
      return;
    }
    const next = [...blocks];
    const [moved] = next.splice(previousIndex, 1);
    next.splice(currentIndex, 0, moved);
    this.setActivePageBlocks(next);
    next.forEach((block, index) => {
      this.blocksApi
        .patchBlock(block.id, { position: index })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    });
  }

  updateBlockContent(blockId: string, content: string): void {
    const blocks = this.getActiveBlocks();
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) {
      return;
    }
    const previous = blocks[index];
    if (previous.type !== BlockType.Text) {
      return;
    }
    if (previous.content === content) {
      return;
    }
    const next = [...blocks];
    const updated: TextBlock = { ...previous, content };
    next[index] = updated;
    this.setActivePageBlocks(next);
    this.scheduleBlockPersist(updated);
  }

  handleBlockKeydown(blockId: string, event: KeyboardEvent, snapshot: BlockFieldSnapshot): void {
    const blocks = this.getActiveBlocks();
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.type === BlockType.Checklist) {
      return;
    }
    if (event.key === 'Backspace') {
      this.handleBackspaceOnEmptyBlock(blockId, snapshot, event);
    }
  }

  toggleChecklistItem(blockId: string, itemIndex: number): void {
    this.patchChecklistBlock(blockId, (checklist) => {
      const items = checklist.items.map((item, i) =>
        i === itemIndex ? { ...item, checked: !item.checked } : item,
      );
      return { ...checklist, items };
    });
  }

  updateChecklistItemText(blockId: string, itemIndex: number, text: string): void {
    this.patchChecklistBlock(blockId, (checklist) => {
      const previous = checklist.items[itemIndex];
      if (!previous || previous.text === text) {
        return checklist;
      }
      const items = checklist.items.map((item, i) => (i === itemIndex ? { ...item, text } : item));
      return { ...checklist, items };
    });
  }

  updateChecklistItemPriority(
    blockId: string,
    itemIndex: number,
    priority: ChecklistItem['priority'],
  ): void {
    this.patchChecklistBlock(blockId, (checklist) => {
      const previous = checklist.items[itemIndex];
      if (!previous) {
        return checklist;
      }
      const items = checklist.items.map((item, i) => {
        if (i !== itemIndex) {
          return item;
        }
        if (priority === undefined) {
          return { text: item.text, checked: item.checked };
        }
        return { ...item, priority };
      });
      return { ...checklist, items };
    });
  }

  handleChecklistItemKeydown(
    blockId: string,
    itemIndex: number,
    event: KeyboardEvent,
    snapshot: BlockFieldSnapshot,
  ): void {
    if (this.isSplitLineKey(event)) {
      event.preventDefault();
      this.splitChecklistItem(blockId, itemIndex, snapshot);
      return;
    }
    if (event.key === 'Backspace') {
      this.handleChecklistItemBackspace(blockId, itemIndex, snapshot, event);
    }
  }

  private splitChecklistItem(blockId: string, itemIndex: number, snapshot: BlockFieldSnapshot): void {
    const before = snapshot.value.slice(0, snapshot.selectionStart);
    const after = snapshot.value.slice(snapshot.selectionEnd);
    this.updateChecklistItemText(blockId, itemIndex, before);
    this.addChecklistItemAfter(blockId, itemIndex, after);
  }

  private addChecklistItemAfter(
    blockId: string,
    afterIndex: number,
    textForNewItem: string,
  ): void {
    this.patchChecklistBlock(blockId, (checklist) => {
      const inserted = createChecklistItem(textForNewItem, false);
      const items = [
        ...checklist.items.slice(0, afterIndex + 1),
        inserted,
        ...checklist.items.slice(afterIndex + 1),
      ];
      return { ...checklist, items };
    });
    this.requestFocus(blockId, afterIndex + 1);
  }

  private handleChecklistItemBackspace(
    blockId: string,
    itemIndex: number,
    snapshot: BlockFieldSnapshot,
    event: KeyboardEvent,
  ): void {
    if (snapshot.value.length > 0) {
      return;
    }
    const blocks = this.getActiveBlocks();
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.type !== BlockType.Checklist) {
      return;
    }
    if (block.items.length > 1) {
      event.preventDefault();
      this.removeChecklistItem(blockId, itemIndex);
      return;
    }
    if (blocks.length > 1) {
      event.preventDefault();
      this.removeBlockAndFocusNeighbor(blockId);
    }
  }

  private removeChecklistItem(blockId: string, itemIndex: number): void {
    let focusIndex = Math.max(0, itemIndex - 1);
    this.patchChecklistBlock(blockId, (checklist) => {
      const items = checklist.items.filter((_, i) => i !== itemIndex);
      focusIndex = Math.min(focusIndex, items.length - 1);
      return { ...checklist, items };
    });
    this.requestFocus(blockId, focusIndex);
  }

  private patchChecklistBlock(
    blockId: string,
    patch: (block: ChecklistBlock) => ChecklistBlock,
  ): void {
    const blocks = this.getActiveBlocks();
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) {
      return;
    }
    const current = blocks[index];
    if (current.type !== BlockType.Checklist) {
      return;
    }
    const next = [...blocks];
    const updated = patch(current);
    next[index] = updated;
    this.setActivePageBlocks(next);
    this.scheduleBlockPersist(updated);
  }

  private isSplitLineKey(event: KeyboardEvent): boolean {
    return event.key === 'Enter' && !event.shiftKey;
  }

  private handleBackspaceOnEmptyBlock(
    blockId: string,
    snapshot: BlockFieldSnapshot,
    event: KeyboardEvent,
  ): void {
    if (snapshot.value.length > 0) {
      return;
    }
    const blocks = this.getActiveBlocks();
    if (blocks.length <= 1) {
      return;
    }
    event.preventDefault();
    this.removeBlockAndFocusNeighbor(blockId);
  }

  private removeBlockAndFocusNeighbor(blockId: string): void {
    const blocks = this.getActiveBlocks();
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) {
      return;
    }
    const next = blocks.filter((b) => b.id !== blockId);
    this.setActivePageBlocks(next);
    const focusIndex = index > 0 ? index - 1 : 0;
    const focusBlock = next[focusIndex];
    if (focusBlock.type === BlockType.Checklist) {
      const itemIdx = Math.max(0, focusBlock.items.length - 1);
      this.requestFocus(focusBlock.id, itemIdx);
      return;
    }
    this.requestFocus(focusBlock.id);
  }

  private requestFocus(blockId: string, checklistItemIndex?: number): void {
    this.focusRequestSubject.next({ blockId, checklistItemIndex });
  }

  private getState(): DashboardWorkspaceState {
    return this.workspaceSubject.value;
  }

  private getActiveBlocks(): Block[] {
    const s = this.getState();
    const page = s.pages.find((p) => p.id === s.activePageId);
    return page ? [...page.blocks] : [];
  }

  private setActivePageBlocks(blocks: Block[]): void {
    const s = this.getState();
    const pages = s.pages.map((p) =>
      p.id === s.activePageId ? { ...p, blocks } : p,
    );
    this.workspaceSubject.next({ ...s, pages });
  }

  private normalizeBlockFromApi(raw: unknown): Block | null {
    if (raw === null || typeof raw !== 'object') {
      return null;
    }
    const o = raw as Record<string, unknown>;
    const id = typeof o['id'] === 'string' ? o['id'] : '';
    const type = o['type'];
    if (id === '' || !isBlockType(type)) {
      return null;
    }
    if (type === BlockType.Card) {
      const columnRaw = o['column'];
      const column = isBoardColumnId(columnRaw) ? columnRaw : BoardColumnId.Todo;
      const card: CardBlock = {
        id,
        type: BlockType.Card,
        content: typeof o['content'] === 'string' ? o['content'] : '',
        column,
      };
      return card;
    }
    if (type === BlockType.Text) {
      const titleRaw = o['title'];
      const title =
        typeof titleRaw === 'string' && titleRaw.length > 0 ? titleRaw : undefined;
      const textBlock: TextBlock = {
        id,
        type: BlockType.Text,
        content: typeof o['content'] === 'string' ? o['content'] : '',
      };
      return title !== undefined ? { ...textBlock, title } : textBlock;
    }
    const itemsRaw = o['items'];
    const items: ChecklistItem[] = Array.isArray(itemsRaw)
      ? itemsRaw.map((item) => {
          const row = item as Record<string, unknown>;
          const pr = row['priority'];
          const base: ChecklistItem = {
            text: typeof row['text'] === 'string' ? row['text'] : '',
            checked: Boolean(row['checked']),
          };
          if (isChecklistItemPriority(pr)) {
            return { ...base, priority: pr };
          }
          return base;
        })
      : [];
    const checklistItems =
      items.length > 0 ? items : [createChecklistItem('', false)];
    const titleRaw = o['title'];
    const blockTitle =
      typeof titleRaw === 'string' && titleRaw.length > 0 ? titleRaw : undefined;
    const checklist: ChecklistBlock = {
      id,
      type: BlockType.Checklist,
      content: typeof o['content'] === 'string' ? o['content'] : '',
      items: checklistItems,
    };
    return blockTitle !== undefined ? { ...checklist, title: blockTitle } : checklist;
  }
}
