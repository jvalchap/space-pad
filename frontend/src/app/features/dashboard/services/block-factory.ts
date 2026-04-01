import {
  Block,
  BlockPreset,
  BlockPresetId,
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

export function createDefaultEmptyBlocks(): TextBlock[] {
  return [createTextBlock('')];
}

function formatJournalDate(): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date());
}

const ALL_BLOCK_PRESETS: readonly BlockPreset[] = [
  {
    id: BlockPresetId.SingleText,
    label: 'Text',
    hint: 'Paragraph',
    createBlocks: () => [createTextBlock('')],
    resolvePanelTitle: (n) => `Dashboard ${n}`,
  },
  {
    id: BlockPresetId.SingleChecklist,
    label: 'Checklist',
    hint: 'Task list with checkboxes',
    createBlocks: () => [createChecklistBlock([createChecklistItem('', false)])],
    resolvePanelTitle: (n) => `Dashboard ${n}`,
  },
  {
    id: BlockPresetId.Empty,
    label: 'Empty',
    hint: 'Single empty block',
    createBlocks: () => [...createDefaultEmptyBlocks()],
    resolvePanelTitle: (n) => `Dashboard ${n}`,
  },
  {
    id: BlockPresetId.BrainDump,
    label: 'Brain Dump',
    hint: 'Quick unstructured notes',
    createBlocks: () => [createTextBlock('Start typing anything...')],
    resolvePanelTitle: (n) => `Brain Dump ${n}`,
  },
  {
    id: BlockPresetId.Journal,
    label: 'Journal',
    hint: 'Daily reflection',
    createBlocks: () => [
      createTextBlock('', 'How do I feel today?'),
      createTextBlock('', 'What did I do today?'),
      createTextBlock('', 'What did I learn?'),
      createChecklistBlock([createChecklistItem('', false)], {
        title: 'Small wins',
      }),
    ],
    resolvePanelTitle: () => `Journal — ${formatJournalDate()}`,
  },
  {
    id: BlockPresetId.TaskList,
    label: 'Task List',
    hint: 'Tasks with optional priority',
    createBlocks: () => [
      createChecklistBlock(
        [createChecklistItem('', false, ChecklistItemPriority.Medium)],
        { title: 'Tasks' },
      ),
      createTextBlock('', 'Notes'),
    ],
    resolvePanelTitle: (n) => `Tasks ${n}`,
  },
  {
    id: BlockPresetId.Tracker,
    label: 'Tracker',
    hint: 'To watch / watched lists',
    createBlocks: () => [
      createTextBlock('', 'To Watch'),
      createChecklistBlock([createChecklistItem('', false)]),
      createTextBlock('', 'Watched'),
      createChecklistBlock([createChecklistItem('', false)]),
    ],
    resolvePanelTitle: (n) => `Tracker ${n}`,
  },
];

const PRESET_BY_ID = new Map(
  ALL_BLOCK_PRESETS.map((preset) => [preset.id, preset]),
);

export const BLOCK_DRAWER_PRESETS: readonly BlockPreset[] =
  ALL_BLOCK_PRESETS.filter((preset) => preset.id !== BlockPresetId.Empty);

export function createBlocksForPreset(id: BlockPresetId): Block[] {
  const preset = PRESET_BY_ID.get(id);
  if (!preset) {
    return [...createDefaultEmptyBlocks()];
  }
  return preset.createBlocks();
}

export function resolvePanelTitleForPreset(
  id: BlockPresetId,
  nextDashboardNumber: number,
): string {
  const preset = PRESET_BY_ID.get(id);
  if (!preset) {
    return `Dashboard ${nextDashboardNumber}`;
  }
  return preset.resolvePanelTitle(nextDashboardNumber);
}
