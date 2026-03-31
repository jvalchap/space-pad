export enum BlockType {
  Text = 'text',
  Checklist = 'checklist',
}

export function isBlockType(value: unknown): value is BlockType {
  return value === BlockType.Text || value === BlockType.Checklist;
}

export interface ChecklistItem {
  readonly text: string;
  readonly checked: boolean;
}

export interface TextBlock {
  readonly id: string;
  readonly type: BlockType.Text;
  readonly content: string;
}

export interface ChecklistBlock {
  readonly id: string;
  readonly type: BlockType.Checklist;
  readonly content: string;
  readonly items: ChecklistItem[];
}

export type Block = TextBlock | ChecklistBlock;
