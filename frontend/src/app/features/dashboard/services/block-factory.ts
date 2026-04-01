import {
  BlockType,
  ChecklistBlock,
  ChecklistItem,
  ChecklistItemPriority,
  TextBlock,
} from '../models/block';

function createBlockId(): string {
  return crypto.randomUUID();
}

export function createTextBlock(
  content: string,
  title?: string,
): TextBlock {
  const block: TextBlock = {
    id: createBlockId(),
    type: BlockType.Text,
    content,
  };
  if (title !== undefined && title.length > 0) {
    return { ...block, title };
  }
  return block;
}

export function createChecklistItem(
  text: string,
  checked = false,
  priority?: ChecklistItemPriority,
): ChecklistItem {
  const item: ChecklistItem = { text, checked };
  if (priority !== undefined) {
    return { ...item, priority };
  }
  return item;
}

export function createChecklistBlock(
  items: readonly ChecklistItem[],
  options?: { title?: string; content?: string },
): ChecklistBlock {
  const list = items.length > 0 ? [...items] : [createChecklistItem('', false)];
  const block: ChecklistBlock = {
    id: createBlockId(),
    type: BlockType.Checklist,
    content: options?.content ?? '',
    items: list,
  };
  if (options?.title !== undefined && options.title.length > 0) {
    return { ...block, title: options.title };
  }
  return block;
}

/** Default single empty text block for new / empty panels */
export function createDefaultEmptyBlocks(): TextBlock[] {
  return [createTextBlock('')];
}
