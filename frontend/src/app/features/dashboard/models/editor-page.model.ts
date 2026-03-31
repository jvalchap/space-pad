import { Block } from './block.model';

/** Una pestaña/espacio de trabajo: su propia lista de bloques (estilo página de Notion). */
export interface EditorPage {
  readonly id: string;
  readonly title: string;
  readonly blocks: Block[];
}

export interface EditorWorkspaceState {
  readonly pages: readonly EditorPage[];
  readonly activePageId: string;
}
