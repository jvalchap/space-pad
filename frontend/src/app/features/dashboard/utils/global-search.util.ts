import { Block, BlockType } from '../models/block.model';
import { GlobalSearchHit, GlobalSearchHitSource } from '../models/global-search-hit.model';
import { EditorWorkspaceState } from '../models/editor-page.model';

function buildSnippet(text: string, query: string, radius = 44): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized === '') {
    return query;
  }
  const lower = normalized.toLowerCase();
  const qLower = query.toLowerCase();
  const matchIndex = lower.indexOf(qLower);
  if (matchIndex === -1) {
    return normalized.length > radius * 2
      ? `${normalized.slice(0, radius)}…`
      : normalized;
  }
  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(
    normalized.length,
    matchIndex + query.length + radius,
  );
  const prefix = start > 0 ? '…' : '';
  const suffix = end < normalized.length ? '…' : '';
  return `${prefix}${normalized.slice(start, end)}${suffix}`;
}

function collectBlockHits(
  panelId: string,
  panelTitle: string,
  block: Block,
  query: string,
  qLower: string,
  hits: GlobalSearchHit[],
): void {
  if (block.type === BlockType.Text) {
    if (block.content.toLowerCase().includes(qLower)) {
      hits.push({
        panelId,
        panelTitle,
        snippet: buildSnippet(block.content, query),
        source: GlobalSearchHitSource.BlockContent,
        blockId: block.id,
      });
    }
    return;
  }
  if (block.content.toLowerCase().includes(qLower)) {
    hits.push({
      panelId,
      panelTitle,
      snippet: buildSnippet(block.content, query),
      source: GlobalSearchHitSource.BlockContent,
      blockId: block.id,
    });
  }
  block.items.forEach((item, checklistItemIndex) => {
    if (item.text.toLowerCase().includes(qLower)) {
      hits.push({
        panelId,
        panelTitle,
        snippet: buildSnippet(item.text, query),
        source: GlobalSearchHitSource.BlockContent,
        blockId: block.id,
        checklistItemIndex,
      });
    }
  });
}

export function computeGlobalSearchHits(
  workspace: EditorWorkspaceState,
  rawQuery: string,
): GlobalSearchHit[] {
  const query = rawQuery.trim();
  if (query === '') {
    return [];
  }
  const qLower = query.toLowerCase();
  const hits: GlobalSearchHit[] = [];
  for (const panel of workspace.pages) {
    if (panel.title.toLowerCase().includes(qLower)) {
      hits.push({
        panelId: panel.id,
        panelTitle: panel.title,
        snippet: buildSnippet(panel.title, query),
        source: GlobalSearchHitSource.PanelTitle,
      });
    }
    for (const tag of panel.tags) {
      if (tag.toLowerCase().includes(qLower)) {
        hits.push({
          panelId: panel.id,
          panelTitle: panel.title,
          snippet: tag,
          source: GlobalSearchHitSource.Tag,
        });
      }
    }
    for (const block of panel.blocks) {
      collectBlockHits(panel.id, panel.title, block, query, qLower, hits);
    }
  }
  return hits;
}
