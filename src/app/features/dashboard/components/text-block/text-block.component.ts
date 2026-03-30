import {
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { TextBlock } from '../../models/block.model';
import {
  BlockContentChangePayload,
  TextLikeFieldKeydownPayload,
} from '../../models/block-ui-payloads.model';

@Component({
  selector: 'app-text-block',
  standalone: true,
  templateUrl: './text-block.component.html',
  styleUrl: './text-block.component.scss',
})
export class TextBlockComponent {
  readonly block = input.required<TextBlock>();

  readonly contentChange = output<BlockContentChangePayload>();

  readonly fieldKeydown = output<TextLikeFieldKeydownPayload>();

  private readonly field = viewChild<ElementRef<HTMLTextAreaElement>>('field');

  private rowFocused = false;

  constructor() {
    effect(() => {
      const ref = this.field();
      if (!ref) {
        return;
      }
      const current = this.block();
      const el = ref.nativeElement;
      const shouldSyncFromModel =
        !this.rowFocused || el.value !== current.content;
      if (!shouldSyncFromModel) {
        return;
      }
      el.value = current.content;
      if (
        typeof document !== 'undefined' &&
        document.activeElement === el
      ) {
        const end = el.value.length;
        el.setSelectionRange(end, end);
      }
    });
  }

  onFocusIn(): void {
    this.rowFocused = true;
  }

  onFocusOut(): void {
    this.rowFocused = false;
  }

  onInput(): void {
    const ref = this.field();
    if (!ref) {
      return;
    }
    this.contentChange.emit({
      blockId: this.block().id,
      content: ref.nativeElement.value,
    });
  }

  onKeydown(event: KeyboardEvent): void {
    const ref = this.field();
    if (!ref) {
      return;
    }
    const el = ref.nativeElement;
    this.fieldKeydown.emit({
      blockId: this.block().id,
      keyboardEvent: event,
      snapshot: {
        value: el.value,
        selectionStart: el.selectionStart,
        selectionEnd: el.selectionEnd,
      },
    });
  }
}
