export enum GlobalSearchHitSource {
  PanelTitle = 'panelTitle',
  Tag = 'tag',
  BlockContent = 'blockContent',
}

export interface GlobalSearchHit {
  readonly panelId: string;
  readonly panelTitle: string;
  readonly snippet: string;
  readonly source: GlobalSearchHitSource;
  readonly blockId?: string;
  readonly checklistItemIndex?: number;
}
