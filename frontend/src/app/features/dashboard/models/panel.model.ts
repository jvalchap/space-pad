import { Block } from './block.model';

export interface Panel {
  readonly id: string;
  readonly title: string;
  readonly blocks: readonly Block[];
  readonly tags: readonly string[];
}
