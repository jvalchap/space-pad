import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { Component, ElementRef, input, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideGripVertical, LucideTrash2 } from '@lucide/angular';
import {
  BoardCardLabel,
  BoardCardLabelColor,
  type CardBlock,
} from '../../models/block';

@Component({
  selector: 'app-board-card',
  standalone: true,
  imports: [CdkDrag, CdkDragHandle, FormsModule, LucideGripVertical, LucideTrash2],
  templateUrl: './board-card.component.html',
  styleUrl: './board-card.component.scss',
})
export class BoardCardComponent {
  readonly card = input.required<CardBlock>();
  readonly columnTitle = input('');

  readonly textSave = output<{ blockId: string; text: string }>();
  readonly deleteCard = output<string>();
  readonly labelsChange = output<{ blockId: string; labels: BoardCardLabel[] }>();

  protected readonly PRESET_LABELS: readonly BoardCardLabel[] = [
    { id: 'label-sky', name: 'Idea', color: BoardCardLabelColor.Sky },
    { id: 'label-mint', name: 'Scope', color: BoardCardLabelColor.Mint },
    { id: 'label-peach', name: 'Risk', color: BoardCardLabelColor.Peach },
    { id: 'label-lilac', name: 'Later', color: BoardCardLabelColor.Lilac },
  ];

  protected editingText = false;
  protected draftText = '';

  private readonly editArea = viewChild<ElementRef<HTMLTextAreaElement>>('editArea');

  protected startEdit(): void {
    this.draftText = this.card().content;
    this.editingText = true;
    queueMicrotask(() => {
      const el = this.editArea()?.nativeElement;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  }

  protected commitEdit(): void {
    if (!this.editingText) {
      return;
    }
    this.editingText = false;
    const trimmed = this.draftText.trimEnd();
    if (trimmed !== this.card().content) {
      this.textSave.emit({ blockId: this.card().id, text: trimmed });
    }
  }

  protected onEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.commitEdit();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.editingText = false;
      this.draftText = this.card().content;
    }
  }

  protected onDeleteClick(event: MouseEvent): void {
    event.stopPropagation();
    this.deleteCard.emit(this.card().id);
  }

  protected togglePreset(preset: BoardCardLabel, event: MouseEvent): void {
    event.stopPropagation();
    const current = [...(this.card().labels ?? [])];
    const index = current.findIndex((label) => label.id === preset.id);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(preset);
    }
    this.labelsChange.emit({ blockId: this.card().id, labels: current });
  }

  protected isPresetActive(presetId: string): boolean {
    return (this.card().labels ?? []).some((label) => label.id === presetId);
  }
}
