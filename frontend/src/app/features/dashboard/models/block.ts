/** Import path: `.../models/block` */

// =============================================================================
// DOMAIN — shapes persisted and rendered (no component wiring)
// =============================================================================

export enum BlockType {
  Text = 'text',
  Checklist = 'checklist',
}

export function isBlockType(value: unknown): value is BlockType {
  return value === BlockType.Text || value === BlockType.Checklist;
}

export enum ChecklistItemPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export function isChecklistItemPriority(
  value: unknown,
): value is ChecklistItemPriority {
  return (
    value === ChecklistItemPriority.Low ||
    value === ChecklistItemPriority.Medium ||
    value === ChecklistItemPriority.High
  );
}

export interface ChecklistItem {
  readonly text: string;
  readonly checked: boolean;
  readonly priority?: ChecklistItemPriority;
}

export interface TextBlock {
  readonly id: string;
  readonly type: BlockType.Text;
  readonly content: string;
  readonly title?: string;
}

export interface ChecklistBlock {
  readonly id: string;
  readonly type: BlockType.Checklist;
  /** Legacy / optional subtitle; prefer `title` for section headings */
  readonly content: string;
  readonly items: ChecklistItem[];
  readonly title?: string;
}

export type Block = TextBlock | ChecklistBlock;

// =============================================================================
// UI — component ↔ DashboardService (payloads, focus, snapshots)
// =============================================================================

/** Value + caret for Enter/Backspace handling on text-like fields */
export interface BlockFieldSnapshot {
  readonly value: string;
  readonly selectionStart: number;
  readonly selectionEnd: number;
}

/** Focus target after insert, navigation, or search */
export interface BlockFocusRequest {
  readonly blockId: string;
  readonly checklistItemIndex?: number;
}

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

// =============================================================================
// TEMPLATES — presets de bloques (drawer / nuevo panel)
// =============================================================================

export enum PanelTemplateId {
  Empty = 'empty',
  BrainDump = 'brainDump',
  Journal = 'journal',
  TaskList = 'taskList',
  Tracker = 'tracker',
}

export interface PanelTemplate {
  readonly id: PanelTemplateId;
  readonly name: string;
  readonly description: string;
  readonly createBlocks: () => Block[];
  readonly resolvePanelTitle: (nextDashboardNumber: number) => string;
}
