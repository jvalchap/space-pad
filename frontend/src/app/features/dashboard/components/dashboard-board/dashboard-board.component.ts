import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BoardColumnId, type CardBlock } from '../../models/block';

interface BoardColumnDef {
  readonly id: BoardColumnId;
  readonly title: string;
}

@Component({
  selector: 'app-dashboard-board',
  standalone: true,
  imports: [DragDropModule, FormsModule],
  templateUrl: './dashboard-board.component.html',
  styleUrl: './dashboard-board.component.scss',
})
export class DashboardBoardComponent {
  readonly BoardColumnId = BoardColumnId;
  readonly columns: readonly BoardColumnDef[] = [
    { id: BoardColumnId.Todo, title: 'To Do' },
    { id: BoardColumnId.Doing, title: 'Doing' },
    { id: BoardColumnId.Done, title: 'Done' },
  ];

  readonly cards = input.required<CardBlock[]>();
  readonly cardTextChange = output<{ blockId: string; text: string }>();
  readonly layoutChange = output<CardBlock[]>();

  protected readonly todoCards = signal<CardBlock[]>([]);
  protected readonly doingCards = signal<CardBlock[]>([]);
  protected readonly doneCards = signal<CardBlock[]>([]);

  constructor() {
    effect(() => {
      const all = this.cards();
      this.todoCards.set(all.filter((card) => card.column === BoardColumnId.Todo));
      this.doingCards.set(all.filter((card) => card.column === BoardColumnId.Doing));
      this.doneCards.set(all.filter((card) => card.column === BoardColumnId.Done));
    });
  }

  dataFor(column: BoardColumnId): CardBlock[] {
    switch (column) {
      case BoardColumnId.Todo:
        return this.todoCards();
      case BoardColumnId.Doing:
        return this.doingCards();
      case BoardColumnId.Done:
        return this.doneCards();
      default:
        return this.todoCards();
    }
  }

  listId(column: BoardColumnId): string {
    return `board-column-${column}`;
  }

  drop(event: CdkDragDrop<CardBlock[]>, targetColumn: BoardColumnId): void {
    const todo = [...this.todoCards()];
    const doing = [...this.doingCards()];
    const done = [...this.doneCards()];
    const buckets: Record<BoardColumnId, CardBlock[]> = {
      [BoardColumnId.Todo]: todo,
      [BoardColumnId.Doing]: doing,
      [BoardColumnId.Done]: done,
    };

    const previousColumn = this.resolveColumnFromListId(event.previousContainer.id);
    const sourceList = buckets[previousColumn];
    const targetList = buckets[targetColumn];

    if (event.previousContainer === event.container) {
      moveItemInArray(targetList, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(sourceList, targetList, event.previousIndex, event.currentIndex);
      const moved = targetList[event.currentIndex];
      if (moved !== undefined) {
        targetList[event.currentIndex] = { ...moved, column: targetColumn };
      }
    }

    this.todoCards.set(todo);
    this.doingCards.set(doing);
    this.doneCards.set(done);

    const merged = [...todo, ...doing, ...done];
    this.layoutChange.emit(merged);
  }

  onCardText(blockId: string, text: string): void {
    this.cardTextChange.emit({ blockId, text });
  }

  private resolveColumnFromListId(containerId: string): BoardColumnId {
    const suffix = containerId.replace('board-column-', '');
    if (suffix === BoardColumnId.Doing || suffix === BoardColumnId.Done) {
      return suffix;
    }
    return BoardColumnId.Todo;
  }
}
