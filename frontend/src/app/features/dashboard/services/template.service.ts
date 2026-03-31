import { Injectable } from '@angular/core';
import { Block, ChecklistItemPriority } from '../models/block.model';
import { PanelTemplate, PanelTemplateId } from '../models/template.model';
import {
  createChecklistBlock,
  createChecklistItem,
  createDefaultEmptyBlocks,
  createTextBlock,
} from './block-factory';

function formatJournalDate(): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date());
}

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly templates: readonly PanelTemplate[] = [
    {
      id: PanelTemplateId.Empty,
      name: 'Empty',
      description: 'Single empty block',
      createBlocks: () => [...createDefaultEmptyBlocks()],
      resolvePanelTitle: (n) => `Dashboard ${n}`,
    },
    {
      id: PanelTemplateId.BrainDump,
      name: 'Brain Dump',
      description: 'Quick unstructured notes',
      createBlocks: () => [createTextBlock('Start typing anything...')],
      resolvePanelTitle: (n) => `Brain Dump ${n}`,
    },
    {
      id: PanelTemplateId.Journal,
      name: 'Journal',
      description: 'Daily reflection',
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
      id: PanelTemplateId.TaskList,
      name: 'Task List',
      description: 'Tasks with optional priority',
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
      id: PanelTemplateId.Tracker,
      name: 'Tracker',
      description: 'To watch / watched lists',
      createBlocks: () => [
        createTextBlock('', 'To Watch'),
        createChecklistBlock([createChecklistItem('', false)]),
        createTextBlock('', 'Watched'),
        createChecklistBlock([createChecklistItem('', false)]),
      ],
      resolvePanelTitle: (n) => `Tracker ${n}`,
    },
  ];

  private readonly byId = new Map(
    this.templates.map((template) => [template.id, template]),
  );

  listTemplates(): readonly PanelTemplate[] {
    return this.templates;
  }

  getTemplate(id: PanelTemplateId): PanelTemplate | undefined {
    return this.byId.get(id);
  }

  createBlocksForTemplate(id: PanelTemplateId): Block[] {
    const template = this.byId.get(id);
    if (!template) {
      return [...createDefaultEmptyBlocks()];
    }
    return template.createBlocks();
  }

  resolvePanelTitle(id: PanelTemplateId, nextDashboardNumber: number): string {
    const template = this.byId.get(id);
    if (!template) {
      return `Dashboard ${nextDashboardNumber}`;
    }
    return template.resolvePanelTitle(nextDashboardNumber);
  }
}
