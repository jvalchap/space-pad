export type BlockType = 'text' | 'checklist';

export interface ChecklistItem {
  readonly text: string;
  readonly checked: boolean;
}

export interface TextBlock {
  readonly id: string;
  readonly type: 'text';
  readonly content: string;
}

export interface ChecklistBlock {
  readonly id: string;
  readonly type: 'checklist';
  readonly content: string;
  readonly items: ChecklistItem[];
}

export type Block = TextBlock | ChecklistBlock;
