import {
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChildren,
} from '@angular/core';
import { ChecklistBlock } from '../../models/block.model';
import {
  ChecklistItemKeydownPayload,
  ChecklistItemTextPayload,
  ChecklistTogglePayload,
} from '../../models/block-ui-payloads.model';

@Component({
  selector: 'app-checklist-block',
  standalone: true,
  templateUrl: './checklist-block.component.html',
  styleUrl: './checklist-block.component.scss',
})
export class ChecklistBlockComponent {
  readonly block = input.required<ChecklistBlock>();

  readonly toggleItem = output<ChecklistTogglePayload>();

  readonly itemTextChange = output<ChecklistItemTextPayload>();

  readonly itemKeydown = output<ChecklistItemKeydownPayload>();

  private readonly itemTextRefs =
    viewChildren<ElementRef<HTMLInputElement>>('itemText');

  private focusedItemIndex: number | null = null;

  constructor() {
    effect(() => {
      const checklist = this.block();
      const refs = this.itemTextRefs();
      for (let i = 0; i < refs.length; i++) {
        const item = checklist.items[i];
        const ref = refs[i];
        if (!item || !ref) {
          continue;
        }
        const el = ref.nativeElement;
        const shouldSync =
          this.focusedItemIndex !== i || el.value !== item.text;
        if (!shouldSync) {
          continue;
        }
        el.value = item.text;
        if (
          typeof document !== 'undefined' &&
          document.activeElement === el
        ) {
          const end = el.value.length;
          el.setSelectionRange(end, end);
        }
      }
    });
  }

  onToggle(itemIndex: number): void {
    this.toggleItem.emit({
      blockId: this.block().id,
      itemIndex,
    });
  }

  onItemFocusIn(itemIndex: number): void {
    this.focusedItemIndex = itemIndex;
  }

  onItemFocusOut(): void {
    this.focusedItemIndex = null;
  }

  onItemInput(itemIndex: number, event: Event): void {
    const el = event.target as HTMLInputElement;
    this.itemTextChange.emit({
      blockId: this.block().id,
      itemIndex,
      text: el.value,
    });
  }

  onItemKeydown(itemIndex: number, event: KeyboardEvent): void {
    const el = event.target as HTMLInputElement;
    this.itemKeydown.emit({
      blockId: this.block().id,
      itemIndex,
      keyboardEvent: event,
      snapshot: {
        value: el.value,
        selectionStart: el.selectionStart ?? 0,
        selectionEnd: el.selectionEnd ?? 0,
      },
    });
  }
}
