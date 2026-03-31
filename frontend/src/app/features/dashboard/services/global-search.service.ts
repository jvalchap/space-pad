import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { GlobalSearchHit } from '../models/global-search-hit.model';
import { computeGlobalSearchHits } from '../utils/global-search.util';
import { EditorService } from './editor.service';

@Injectable()
export class GlobalSearchService {
  private readonly editor = inject(EditorService);

  private readonly querySubject = new BehaviorSubject('');

  readonly results$: Observable<GlobalSearchHit[]> = combineLatest([
    this.editor.workspace$,
    this.querySubject.pipe(debounceTime(180), distinctUntilChanged()),
  ]).pipe(
    map(([workspace, query]) => computeGlobalSearchHits(workspace, query)),
  );

  setQuery(value: string): void {
    this.querySubject.next(value);
  }
}
