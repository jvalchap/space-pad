import { ChecklistItemPriority } from './block.model';
import { BlockFieldSnapshot } from '../services/editor.service';

export interface BlockContentChangePayload {
  readonly blockId: string;
  readonly content: string;
}

export interface TextLikeFieldKeydownPayload {
  readonly blockId: string;
  readonly keyboardEvent: KeyboardEvent;
  readonly snapshot: BlockFieldSnapshot;
}

export interface ChecklistTogglePayload {
  readonly blockId: string;
  readonly itemIndex: number;
}

export interface ChecklistItemTextPayload {
  readonly blockId: string;
  readonly itemIndex: number;
  readonly text: string;
}

export interface ChecklistItemPriorityPayload {
  readonly blockId: string;
  readonly itemIndex: number;
  readonly priority: ChecklistItemPriority | null;
}

export interface ChecklistItemKeydownPayload {
  readonly blockId: string;
  readonly itemIndex: number;
  readonly keyboardEvent: KeyboardEvent;
  readonly snapshot: BlockFieldSnapshot;
}

export interface BlocksReorderPayload {
  readonly previousIndex: number;
  readonly currentIndex: number;
}
