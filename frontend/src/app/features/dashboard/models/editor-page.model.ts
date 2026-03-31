import { Panel } from './panel.model';

export type EditorPage = Panel;

export interface EditorWorkspaceState {
  readonly pages: readonly Panel[];
  readonly activePageId: string;
}
