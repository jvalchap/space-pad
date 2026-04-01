import { Panel } from './panel.model';

export type DashboardPage = Panel;

export interface DashboardWorkspaceState {
  readonly pages: readonly Panel[];
  readonly activePageId: string;
}
