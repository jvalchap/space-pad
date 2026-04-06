import { Block } from './block';
import { DashboardTypeApi } from './dashboard-type.model';

export interface Panel {
  readonly id: string;
  readonly title: string;
  readonly blocks: readonly Block[];
  readonly tags: readonly string[];
  readonly dashboardType: DashboardTypeApi;
}
