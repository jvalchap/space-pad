import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, ElementRef, input, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { BoardCardLabel, CardBlock } from '../../models/block';
import { BoardCardComponent } from './board-card.component';
import type { BoardColumnDefinition } from './board.types';

@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [CdkDropList, FormsModule, BoardCardComponent],
  templateUrl: './board-column.component.html',
  styleUrl: './board-column.component.scss',
})
export class BoardColumnComponent {
  readonly column = input.required<BoardColumnDefinition>();
  readonly cards = input.required<CardBlock[]>();
  readonly dropListId = input.required<string>();

  readonly dropped = output<CdkDragDrop<CardBlock[]>>();
  readonly addCard = output<{ columnId: string; content: string }>();
  readonly cardTextSave = output<{ blockId: string; text: string }>();
  readonly cardDelete = output<string>();
  readonly cardLabelsChange = output<{ blockId: string; labels: BoardCardLabel[] }>();

  private readonly composerField = viewChild<ElementRef<HTMLTextAreaElement>>('composerField');

  protected composerOpen = false;
  protected draftContent = '';
  private composerEscapeClose = false;

  protected toggleComposer(): void {
    this.composerOpen = true;
    this.draftContent = '';
    this.composerEscapeClose = false;
    queueMicrotask(() => {
      this.composerField()?.nativeElement.focus();
    });
  }

  protected closeComposer(): void {
    this.composerOpen = false;
    this.draftContent = '';
  }

  protected onComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitComposer();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.composerEscapeClose = true;
      this.closeComposer();
    }
  }

  protected onComposerBlur(): void {
    if (this.composerEscapeClose) {
      this.composerEscapeClose = false;
      return;
    }
    this.submitComposer();
  }

  protected submitComposer(): void {
    const text = this.draftContent.trim();
    if (text.length === 0) {
      this.closeComposer();
      return;
    }
    this.addCard.emit({ columnId: this.column().id, content: text });
    this.closeComposer();
  }
}
