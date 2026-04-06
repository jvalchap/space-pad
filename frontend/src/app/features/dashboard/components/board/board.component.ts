import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import type { BoardCardLabel, CardBlock } from '../../models/block';
import { BoardColumnId } from '../../models/block';
import { BoardColumnComponent } from './board-column.component';
import type { BoardColumnDefinition } from './board.types';

const STORAGE_PREFIX = 'space-pad-board-columns:';

const DEFAULT_BOARD_COLUMNS: readonly BoardColumnDefinition[] = [
  { id: BoardColumnId.Todo, title: 'TO DO' },
  { id: BoardColumnId.Doing, title: 'DOING' },
  { id: BoardColumnId.Done, title: 'DONE' },
];

const DEFAULT_COLUMN_IDS = new Set(DEFAULT_BOARD_COLUMNS.map((column) => column.id));

function mergeColumnDefinitions(
  stored: BoardColumnDefinition[] | null,
): BoardColumnDefinition[] {
  if (stored === null || stored.length === 0) {
    return [...DEFAULT_BOARD_COLUMNS];
  }
  const storedById = new Map(stored.map((column) => [column.id, column]));
  const mergedDefaults = DEFAULT_BOARD_COLUMNS.map((definition) => {
    const override = storedById.get(definition.id);
    return override ?? definition;
  });
  const extras = stored.filter((column) => !DEFAULT_COLUMN_IDS.has(column.id));
  return [...mergedDefaults, ...extras];
}

function readColumnsFromStorage(dashboardId: string): BoardColumnDefinition[] {
  if (typeof sessionStorage === 'undefined') {
    return [...DEFAULT_BOARD_COLUMNS];
  }
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${dashboardId}`);
    if (raw === null || raw === '') {
      return [...DEFAULT_BOARD_COLUMNS];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_BOARD_COLUMNS];
    }
    const columns: BoardColumnDefinition[] = [];
    for (const item of parsed) {
      if (item === null || typeof item !== 'object') {
        continue;
      }
      const row = item as Record<string, unknown>;
      const id = typeof row['id'] === 'string' ? row['id'] : '';
      const title = typeof row['title'] === 'string' ? row['title'] : '';
      if (id === '' || title === '') {
        continue;
      }
      columns.push({ id, title });
    }
    return mergeColumnDefinitions(columns);
  } catch {
    return [...DEFAULT_BOARD_COLUMNS];
  }
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [DragDropModule, BoardColumnComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export class BoardComponent {
  readonly cards = input.required<CardBlock[]>();
  readonly dashboardId = input.required<string>();

  readonly layoutChange = output<CardBlock[]>();
  readonly cardTextChange = output<{ blockId: string; text: string }>();
  readonly cardAdd = output<{ columnId: string; content: string }>();
  readonly cardDelete = output<string>();
  readonly cardLabelsChange = output<{ blockId: string; labels: BoardCardLabel[] }>();

  protected readonly columns = signal<BoardColumnDefinition[]>([...DEFAULT_BOARD_COLUMNS]);

  constructor() {
    effect(() => {
      const id = this.dashboardId();
      if (id === '') {
        this.columns.set([...DEFAULT_BOARD_COLUMNS]);
        return;
      }
      this.columns.set(readColumnsFromStorage(id));
    });
    effect(() => {
      const id = this.dashboardId();
      const list = this.columns();
      if (id === '' || typeof sessionStorage === 'undefined') {
        return;
      }
      sessionStorage.setItem(`${STORAGE_PREFIX}${id}`, JSON.stringify(list));
    });
  }

  readonly splitCards = computed(() => {
    const all = this.cards();
    const columnIds = this.columns().map((column) => column.id);
    if (columnIds.length === 0) {
      return {} as Record<string, CardBlock[]>;
    }
    const buckets: Record<string, CardBlock[]> = {};
    for (const id of columnIds) {
      buckets[id] = [];
    }
    const fallback = columnIds[0]!;
    for (const card of all) {
      const key = columnIds.includes(card.column) ? card.column : fallback;
      buckets[key].push(card);
    }
    return buckets;
  });

  protected listId(columnId: string): string {
    return `board-column-${columnId}`;
  }

  protected cardsForColumn(columnId: string): CardBlock[] {
    return this.splitCards()[columnId] ?? [];
  }

  protected onColumnDrop(
    event: CdkDragDrop<CardBlock[]>,
    targetColumnId: string,
  ): void {
    const columnIds = this.columns().map((column) => column.id);
    const sourceBuckets = this.splitCards();
    const buckets: Record<string, CardBlock[]> = {};
    for (const id of columnIds) {
      buckets[id] = [...(sourceBuckets[id] ?? [])];
    }
    const previousColumnId = this.resolveListToColumnId(event.previousContainer.id);
    const sourceList = buckets[previousColumnId];
    const targetList = buckets[targetColumnId];
    if (sourceList === undefined || targetList === undefined) {
      return;
    }
    if (event.previousContainer === event.container) {
      moveItemInArray(sourceList, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        sourceList,
        targetList,
        event.previousIndex,
        event.currentIndex,
      );
      const movedCard = targetList[event.currentIndex];
      if (movedCard !== undefined) {
        targetList[event.currentIndex] = { ...movedCard, column: targetColumnId };
      }
    }
    const flat = this.flattenBuckets(buckets, columnIds);
    this.layoutChange.emit(this.assignPositions(flat));
  }

  private flattenBuckets(
    buckets: Record<string, CardBlock[]>,
    columnOrder: string[],
  ): CardBlock[] {
    const result: CardBlock[] = [];
    for (const columnId of columnOrder) {
      const list = buckets[columnId] ?? [];
      result.push(...list);
    }
    return result;
  }

  private assignPositions(ordered: CardBlock[]): CardBlock[] {
    const perColumn = new Map<string, number>();
    return ordered.map((card) => {
      const next = (perColumn.get(card.column) ?? 0) + 1;
      perColumn.set(card.column, next);
      return { ...card, position: next };
    });
  }

  private resolveListToColumnId(containerId: string): string {
    return containerId.replace(/^board-column-/, '');
  }

  protected onAddCard(payload: { columnId: string; content: string }): void {
    this.cardAdd.emit(payload);
  }

  protected onCardTextSave(payload: { blockId: string; text: string }): void {
    this.cardTextChange.emit(payload);
  }

  protected onCardDelete(blockId: string): void {
    this.cardDelete.emit(blockId);
  }

  protected onCardLabels(payload: { blockId: string; labels: BoardCardLabel[] }): void {
    this.cardLabelsChange.emit(payload);
  }

  protected addColumn(): void {
    const name = window.prompt('Column name');
    if (name === null) {
      return;
    }
    const title = name.trim();
    if (title.length === 0) {
      return;
    }
    const id = `col-${crypto.randomUUID().slice(0, 8)}`;
    this.columns.update((current) => [...current, { id, title }]);
  }
}
