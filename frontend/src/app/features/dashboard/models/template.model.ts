import { Block } from './block.model';

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
