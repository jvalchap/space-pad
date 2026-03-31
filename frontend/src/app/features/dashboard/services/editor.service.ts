import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, Subject } from 'rxjs';
import {
  Block,
  BlockType,
  ChecklistBlock,
  ChecklistItem,
  isBlockType,
  isChecklistItemPriority,
  TextBlock,
} from '../models/block.model';
import { PanelTemplateId } from '../models/template.model';
import { EditorWorkspaceState } from '../models/editor-page.model';
import { Panel } from '../models/panel.model';
import {
  createChecklistBlock,
  createChecklistItem,
  createDefaultEmptyBlocks,
  createTextBlock,
} from './block-factory';
import { TemplateService } from './template.service';

function createEditorPage(
  title: string,
  blocks: Block[],
  tags: readonly string[] = [],
): Panel {
  return {
    id: crypto.randomUUID(),
    title,
    blocks,
    tags: [...tags],
  };
}

function createInitialWorkspaceState(): EditorWorkspaceState {
  const empty = [...createDefaultEmptyBlocks()];
  const page1 = createEditorPage('Dashboard 1', empty);
  const page2 = createEditorPage('Dashboard 2', [...createDefaultEmptyBlocks()]);
  return {
    pages: [page1, page2],
    activePageId: page1.id,
  };
}

export interface BlockFieldSnapshot {
  readonly value: string;
  readonly selectionStart: number;
  readonly selectionEnd: number;
}

export interface EditorFocusRequest {
  readonly blockId: string;
  readonly checklistItemIndex?: number;
}

@Injectable()
export class EditorService {
  private readonly templateService = inject(TemplateService);

  private readonly workspaceSubject = new BehaviorSubject<EditorWorkspaceState>(
    createInitialWorkspaceState(),
  );

  readonly workspace$: Observable<EditorWorkspaceState> =
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

  private readonly focusRequestSubject = new Subject<EditorFocusRequest>();
  readonly focusRequest$ = this.focusRequestSubject.asObservable();

  private readonly blockTypeDrawerOpenSubject = new BehaviorSubject(false);
  readonly blockTypeDrawerOpen$ = this.blockTypeDrawerOpenSubject.asObservable();

  loadBlocksFromApi(blocks: readonly unknown[]): void {
    const normalized = blocks
      .map((raw) => this.normalizeBlockFromApi(raw))
      .filter((b): b is Block => b !== null);
    const forFirstPage =
      normalized.length > 0 ? normalized : [...createDefaultEmptyBlocks()];
    const s = this.getState();
    if (s.pages.length === 0) {
      return;
    }
    const pages = [...s.pages];
    const first = pages[0];
    pages[0] = { ...first, blocks: forFirstPage };
    this.workspaceSubject.next({ ...s, pages });
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

  addPage(templateId: PanelTemplateId = PanelTemplateId.Empty): void {
    const s = this.getState();
    const nextNum = s.pages.length + 1;
    const blocks = this.templateService.createBlocksForTemplate(templateId);
    const title = this.templateService.resolvePanelTitle(templateId, nextNum);
    const newPage = createEditorPage(title, blocks);
    this.workspaceSubject.next({
      pages: [...s.pages, newPage],
      activePageId: newPage.id,
    });
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
    this.focusRequestSubject.next({ blockId, checklistItemIndex });
  }

  openBlockTypeDrawer(): void {
    this.blockTypeDrawerOpenSubject.next(true);
  }

  closeBlockTypeDrawer(): void {
    this.blockTypeDrawerOpenSubject.next(false);
  }

  insertBlockTypeFromPicker(type: BlockType): void {
    this.closeBlockTypeDrawer();
    this.insertBlockAtEndOfType(type);
  }

  appendBlocksFromTemplate(templateId: PanelTemplateId): void {
    this.closeBlockTypeDrawer();
    const extra = this.templateService.createBlocksForTemplate(templateId);
    if (extra.length === 0) {
      return;
    }
    const blocks = this.getActiveBlocks();
    this.setActivePageBlocks([...blocks, ...extra]);
    const last = extra[extra.length - 1];
    this.requestFocusAfterInsert(last);
  }

  private insertBlockAtEndOfType(type: BlockType): void {
    const created = this.createBlockOfType(type);
    const blocks = this.getActiveBlocks();
    this.setActivePageBlocks([...blocks, created]);
    this.requestFocusAfterInsert(created);
  }

  private createBlockOfType(type: BlockType): Block {
    if (type === BlockType.Text) {
      return createTextBlock('');
    }
    return createChecklistBlock([createChecklistItem('', false)]);
  }

  private requestFocusAfterInsert(block: Block): void {
    if (block.type === BlockType.Checklist) {
      this.requestFocus(block.id, 0);
      return;
    }
    this.requestFocus(block.id);
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
    next[index] = { ...previous, content };
    this.setActivePageBlocks(next);
  }

  handleBlockKeydown(blockId: string, event: KeyboardEvent, snapshot: BlockFieldSnapshot): void {
    const blocks = this.getActiveBlocks();
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.type === BlockType.Checklist) {
      return;
    }
    if (this.isSplitLineKey(event)) {
      event.preventDefault();
      this.splitBlockAtCaret(blockId, snapshot);
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
    next[index] = patch(current);
    this.setActivePageBlocks(next);
  }

  private isSplitLineKey(event: KeyboardEvent): boolean {
    return event.key === 'Enter' && !event.shiftKey;
  }

  private splitBlockAtCaret(blockId: string, snapshot: BlockFieldSnapshot): void {
    const before = snapshot.value.slice(0, snapshot.selectionStart);
    const after = snapshot.value.slice(snapshot.selectionEnd);
    this.updateBlockContent(blockId, before);
    const newId = this.insertTextBlockAfter(blockId, after);
    this.requestFocus(newId);
  }

  private insertTextBlockAfter(afterId: string, initialContent: string): string {
    const blocks = this.getActiveBlocks();
    const index = blocks.findIndex((b) => b.id === afterId);
    if (index === -1) {
      return afterId;
    }
    const inserted = createTextBlock(initialContent);
    const next = [...blocks.slice(0, index + 1), inserted, ...blocks.slice(index + 1)];
    this.setActivePageBlocks(next);
    return inserted.id;
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

  private getState(): EditorWorkspaceState {
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
