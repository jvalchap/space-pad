/** Import path: `.../models/block` */

// =============================================================================
// DOMAIN — shapes persisted and rendered (no component wiring)
// =============================================================================

export enum BlockType {
  Text = 'text',
  Checklist = 'checklist',
  Card = 'card',
}

export function isBlockType(value: unknown): value is BlockType {
  return (
    value === BlockType.Text ||
    value === BlockType.Checklist ||
    value === BlockType.Card
  );
}

export enum BoardColumnId {
  Todo = 'todo',
  Doing = 'doing',
  Done = 'done',
}

export function isBoardColumnId(value: unknown): value is BoardColumnId {
  return (
    value === BoardColumnId.Todo ||
    value === BoardColumnId.Doing ||
    value === BoardColumnId.Done
  );
}

/** Optional colored tag on board cards (stored in block JSON). */
export interface BoardCardLabel {
  readonly id: string;
  readonly name: string;
  readonly color: BoardCardLabelColor;
}

export enum BoardCardLabelColor {
  Sky = 'sky',
  Mint = 'mint',
  Peach = 'peach',
  Lilac = 'lilac',
}

export function isBoardCardLabelColor(value: unknown): value is BoardCardLabelColor {
  return (
    value === BoardCardLabelColor.Sky ||
    value === BoardCardLabelColor.Mint ||
    value === BoardCardLabelColor.Peach ||
    value === BoardCardLabelColor.Lilac
  );
}

export function normalizeBoardCardLabels(raw: unknown): BoardCardLabel[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const result: BoardCardLabel[] = [];
  for (const entry of raw) {
    if (entry === null || typeof entry !== 'object') {
      continue;
    }
    const row = entry as Record<string, unknown>;
    const id = typeof row['id'] === 'string' ? row['id'] : '';
    const name = typeof row['name'] === 'string' ? row['name'] : '';
    const colorRaw = row['color'];
    if (id === '' || !isBoardCardLabelColor(colorRaw)) {
      continue;
    }
    result.push({ id, name, color: colorRaw });
  }
  return result;
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

export interface CardBlock {
  readonly id: string;
  readonly type: BlockType.Card;
  readonly content: string;
  /** Column id (default lists use BoardColumnId values; custom columns use generated ids). */
  readonly column: string;
  /** Order within the column (1-based for display logic; persisted via layout sync). */
  readonly position: number;
  readonly labels?: readonly BoardCardLabel[];
}

export type Block = TextBlock | ChecklistBlock | CardBlock;

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


export enum BlockPresetId {
  Empty = 'empty',
  SingleText = 'singleText',
  SingleChecklist = 'singleChecklist',
  BrainDump = 'brainDump',
  Journal = 'journal',
  TaskList = 'taskList',
  Tracker = 'tracker',
}

export interface BlockPreset {
  readonly id: BlockPresetId;
  readonly label: string;
  readonly hint: string;
  readonly createBlocks: () => Block[];
  readonly resolvePanelTitle: (nextDashboardNumber: number) => string;
}
