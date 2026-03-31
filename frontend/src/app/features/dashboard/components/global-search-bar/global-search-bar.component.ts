import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  GlobalSearchHit,
  GlobalSearchHitSource,
} from '../../models/global-search-hit.model';
import { EditorService } from '../../services/editor.service';
import { GlobalSearchService } from '../../services/global-search.service';
import { splitTextHighlightSegments } from '../../utils/text-highlight.util';

@Component({
  selector: 'app-global-search-bar',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './global-search-bar.component.html',
  styleUrl: './global-search-bar.component.scss',
})
export class GlobalSearchBarComponent {
  readonly search = inject(GlobalSearchService);

  readonly editor = inject(EditorService);

  readonly HitSource = GlobalSearchHitSource;

  query = '';

  onQueryInput(raw: string): void {
    this.query = raw;
    this.search.setQuery(raw);
    if (raw.trim() === '') {
      this.editor.clearGlobalSearchHighlight();
    }
  }

  segmentsFor(snippet: string): ReturnType<typeof splitTextHighlightSegments> {
    return splitTextHighlightSegments(snippet, this.query);
  }

  sourceLabel(source: GlobalSearchHitSource): string {
    switch (source) {
      case GlobalSearchHitSource.PanelTitle:
        return 'Título';
      case GlobalSearchHitSource.Tag:
        return 'Etiqueta';
      case GlobalSearchHitSource.BlockContent:
        return 'Contenido';
    }
  }

  onPickHit(hit: GlobalSearchHit): void {
    const trimmed = this.query.trim();
    this.editor.selectPage(hit.panelId);
    this.editor.setGlobalSearchHighlight(trimmed);
    if (hit.blockId) {
      queueMicrotask(() =>
        this.editor.focusBlock(hit.blockId!, hit.checklistItemIndex),
      );
    }
  }
}
