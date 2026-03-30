import {
  Component,
  booleanAttribute,
  effect,
  input,
  output,
} from '@angular/core';
import { BlockType } from '../../models/block.model';

@Component({
  selector: 'app-bottom-drawer',
  standalone: true,
  templateUrl: './bottom-drawer.component.html',
  styleUrl: './bottom-drawer.component.scss',
})
export class BottomDrawerComponent {
  readonly open = input(false, { transform: booleanAttribute });

  readonly closeDrawer = output<void>();

  readonly blockTypePicked = output<BlockType>();

  constructor() {
    effect((onCleanup) => {
      if (typeof document === 'undefined') {
        return;
      }
      if (!this.open()) {
        return;
      }
      const onKeydown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.closeDrawer.emit();
        }
      };
      document.addEventListener('keydown', onKeydown);
      onCleanup(() => document.removeEventListener('keydown', onKeydown));
    });

    effect((onCleanup) => {
      if (typeof document === 'undefined') {
        return;
      }
      if (!this.open()) {
        return;
      }
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      onCleanup(() => {
        document.body.style.overflow = previous;
      });
    });
  }

  pickType(type: BlockType): void {
    this.blockTypePicked.emit(type);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDrawer.emit();
    }
  }
}
