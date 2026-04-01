import { Component, booleanAttribute, effect, input, output } from '@angular/core';
import { BlockPreset, BlockPresetId } from '../../models/block';
import { BLOCK_DRAWER_PRESETS } from '../../services/block-factory';

@Component({
  selector: 'app-bottom-drawer',
  standalone: true,
  templateUrl: './bottom-drawer.component.html',
  styleUrl: './bottom-drawer.component.scss',
})
export class BottomDrawerComponent {
  readonly drawerPresets: readonly BlockPreset[] = BLOCK_DRAWER_PRESETS;
  readonly open = input(false, { transform: booleanAttribute });
  readonly closeDrawer = output<void>();
  readonly blockPresetPicked = output<BlockPresetId>();

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

  pickPreset(preset: BlockPreset): void {
    this.blockPresetPicked.emit(preset.id);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDrawer.emit();
    }
  }
}
