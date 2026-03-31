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
  readonly content: string;
  readonly items: ChecklistItem[];
  readonly title?: string;
}

export type Block = TextBlock | ChecklistBlock;
