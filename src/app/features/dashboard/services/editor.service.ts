import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  Block,
  BlockType,
  ChecklistBlock,
  ChecklistItem,
  TextBlock,
} from '../models/block.model';

function createBlockId(): string {
  return crypto.randomUUID();
}

function createTextBlock(content: string): TextBlock {
  return {
    id: createBlockId(),
    type: 'text',
    content,
  };
}

function createChecklistBlock(): ChecklistBlock {
  const emptyItem: ChecklistItem = { text: '', checked: false };
  return {
    id: createBlockId(),
    type: 'checklist',
    content: '',
    items: [emptyItem],
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
  private readonly blocksSubject = new BehaviorSubject<Block[]>([createTextBlock('')]);
  readonly blocks$ = this.blocksSubject.asObservable();

  private readonly focusRequestSubject = new Subject<EditorFocusRequest>();
  readonly focusRequest$ = this.focusRequestSubject.asObservable();

  private readonly blockTypeDrawerOpenSubject = new BehaviorSubject(false);
  readonly blockTypeDrawerOpen$ = this.blockTypeDrawerOpenSubject.asObservable();

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

  private insertBlockAtEndOfType(type: BlockType): void {
    const created = this.createBlockOfType(type);
    this.blocksSubject.next([...this.blocksSubject.value, created]);
    this.requestFocusAfterInsert(created);
  }

  private createBlockOfType(type: BlockType): Block {
    if (type === 'text') {
      return createTextBlock('');
    }
    return createChecklistBlock();
  }

  private requestFocusAfterInsert(block: Block): void {
    if (block.type === 'checklist') {
      this.requestFocus(block.id, 0);
      return;
    }
    this.requestFocus(block.id);
  }

  reorderBlocks(previousIndex: number, currentIndex: number): void {
    const blocks = this.blocksSubject.value;
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
    this.blocksSubject.next(next);
  }

  updateBlockContent(blockId: string, content: string): void {
    const blocks = this.blocksSubject.value;
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) {
      return;
    }
    const previous = blocks[index];
    if (previous.type !== 'text') {
      return;
    }
    if (previous.content === content) {
      return;
    }
    const next = [...blocks];
    next[index] = { ...previous, content };
    this.blocksSubject.next(next);
  }

  handleBlockKeydown(blockId: string, event: KeyboardEvent, snapshot: BlockFieldSnapshot): void {
    const blocks = this.blocksSubject.value;
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.type === 'checklist') {
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
      const inserted: ChecklistItem = { text: textForNewItem, checked: false };
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
    const blocks = this.blocksSubject.value;
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.type !== 'checklist') {
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
    const blocks = this.blocksSubject.value;
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) {
      return;
    }
    const current = blocks[index];
    if (current.type !== 'checklist') {
      return;
    }
    const next = [...blocks];
    next[index] = patch(current);
    this.blocksSubject.next(next);
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
    const blocks = this.blocksSubject.value;
    const index = blocks.findIndex((b) => b.id === afterId);
    if (index === -1) {
      return afterId;
    }
    const inserted = createTextBlock(initialContent);
    const next = [...blocks.slice(0, index + 1), inserted, ...blocks.slice(index + 1)];
    this.blocksSubject.next(next);
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
    const blocks = this.blocksSubject.value;
    if (blocks.length <= 1) {
      return;
    }
    event.preventDefault();
    this.removeBlockAndFocusNeighbor(blockId);
  }

  private removeBlockAndFocusNeighbor(blockId: string): void {
    const blocks = this.blocksSubject.value;
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) {
      return;
    }
    const next = blocks.filter((b) => b.id !== blockId);
    this.blocksSubject.next(next);
    const focusIndex = index > 0 ? index - 1 : 0;
    const focusBlock = next[focusIndex];
    if (focusBlock.type === 'checklist') {
      const itemIdx = Math.max(0, focusBlock.items.length - 1);
      this.requestFocus(focusBlock.id, itemIdx);
      return;
    }
    this.requestFocus(focusBlock.id);
  }

  private requestFocus(blockId: string, checklistItemIndex?: number): void {
    this.focusRequestSubject.next({ blockId, checklistItemIndex });
  }
}
